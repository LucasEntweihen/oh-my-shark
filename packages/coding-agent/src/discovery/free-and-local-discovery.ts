/**
 * Free & Local Model Discovery Engine for Oh My Shark (OMSK).
 * 
 * Inviolable constraints:
 * 1. 100% Free for the user.
 * 2. Does NOT force or trigger automatic local model downloads.
 * 3. Discovers existing local runtimes (Ollama, LM Studio, vLLM) in parallel without blocking.
 * 4. Catalogs 100% free cloud tiers (Groq free tier, Gemini free tier, OpenRouter :free models).
 * 5. Runs out-of-the-box without requiring coding or complex setups.
 */
import * as os from "node:os";

export interface LocalEndpointCandidate {
	name: string;
	url: string;
	type: "ollama" | "lm_studio" | "vllm" | "generic_openai";
	available: boolean;
	models: string[];
	latencyMs?: number;
}

export interface FreeCloudProviderOption {
	id: string;
	name: string;
	description: string;
	freeTierNotes: string;
	recommendedModels: string[];
	requiresKey: boolean;
	keyHelpUrl: string;
	contextWindowTokens?: number;
}

export type QuantFeasibilityLevel = "feasible" | "tight" | "insufficient";

export interface QuantizationFeasibility {
	q4_k_m: QuantFeasibilityLevel;
	q8_0: QuantFeasibilityLevel;
	fp16: QuantFeasibilityLevel;
}

export interface GpuAccelerationProfile {
	hasGpu: boolean;
	type: "nvidia_cuda" | "apple_metal" | "amd_rocm" | "unknown" | "none";
	estimatedVramGb?: number;
	details: string;
}

export interface SystemResourceProfile {
	totalRamGb: number;
	freeRamGb: number;
	cpuCores: number;
	cpuModel: string;
	platform: string;
	localModelFeasibility: "lightweight_only" | "medium_feasible" | "heavy_feasible" | "cloud_recommended";
	quantization: QuantizationFeasibility;
	gpu: GpuAccelerationProfile;
}

export const FREE_CLOUD_PROVIDERS: FreeCloudProviderOption[] = [
	{
		id: "openrouter-free",
		name: "OpenRouter (Free Models)",
		description: "Acessa modelos de ponta gratuitos sem cobrança de tokens.",
		freeTierNotes: "Permite usar modelos com sufixo :free (ex: deepseek/deepseek-r1:free, meta-llama/llama-3.3-70b-instruct:free).",
		recommendedModels: [
			"deepseek/deepseek-r1:free",
			"meta-llama/llama-3.3-70b-instruct:free",
			"google/gemini-2.0-flash-exp:free",
			"qwen/qwen-2.5-coder-32b-instruct:free",
		],
		requiresKey: true,
		keyHelpUrl: "https://openrouter.ai/keys",
		contextWindowTokens: 131072,
	},
	{
		id: "gemini-free",
		name: "Google AI Studio (Gemini Free Tier)",
		description: "Tier gratuito do Google com alta cota de requisições por minuto e contexto massivo de 1M tokens.",
		freeTierNotes: "Totalmente gratuito para uso individual e desenvolvimento.",
		recommendedModels: [
			"gemini-2.5-flash",
			"gemini-2.0-flash",
			"gemini-1.5-flash",
		],
		requiresKey: true,
		keyHelpUrl: "https://aistudio.google.com/app/apikey",
		contextWindowTokens: 1048576,
	},
	{
		id: "groq-free",
		name: "Groq Cloud (Free Tier)",
		description: "Velocidade extrema de inferência em chips LPU com cota gratuita para modelos abertos.",
		freeTierNotes: "Nenhuma cobrança no tier gratuito para modelos abertos Llama e Gemma.",
		recommendedModels: [
			"llama-3.3-70b-versatile",
			"llama-3.1-8b-instant",
			"qwen-2.5-coder-32b",
		],
		requiresKey: true,
		keyHelpUrl: "https://console.groq.com/keys",
		contextWindowTokens: 128000,
	},
	{
		id: "huggingface-free",
		name: "Hugging Face Inference (Free Tier)",
		description: "Milhares de modelos open source hospedados gratuitamente com endpoints serverless.",
		freeTierNotes: "Tokens gratuitos da comunidade para inferência rápida.",
		recommendedModels: [
			"meta-llama/Llama-3.1-8B-Instruct",
			"Qwen/Qwen2.5-Coder-32B-Instruct",
		],
		requiresKey: true,
		keyHelpUrl: "https://huggingface.co/settings/tokens",
		contextWindowTokens: 32768,
	},
];

export class FreeAndLocalDiscovery {
	/**
	 * Assesses host system hardware to evaluate feasibility of optional local models.
	 * Never forces model downloads.
	 */
	public inspectSystemResources(): SystemResourceProfile {
		const totalBytes = os.totalmem();
		const freeBytes = os.freemem();
		const totalRamGb = Math.round((totalBytes / (1024 * 1024 * 1024)) * 10) / 10;
		const freeRamGb = Math.round((freeBytes / (1024 * 1024 * 1024)) * 10) / 10;
		const cpus = os.cpus();
		const cpuCores = cpus.length;
		const cpuModel = cpus[0]?.model ?? "Unknown CPU";

		let localModelFeasibility: SystemResourceProfile["localModelFeasibility"] = "cloud_recommended";
		if (totalRamGb >= 32) {
			localModelFeasibility = "heavy_feasible";
		} else if (totalRamGb >= 16) {
			localModelFeasibility = "medium_feasible";
		} else if (totalRamGb >= 8) {
			localModelFeasibility = "lightweight_only";
		}

		// Quantization feasibility by RAM thresholds
		const quantization: QuantizationFeasibility = {
			q4_k_m: totalRamGb >= 8 ? "feasible" : totalRamGb >= 6 ? "tight" : "insufficient",
			q8_0: totalRamGb >= 16 ? "feasible" : totalRamGb >= 12 ? "tight" : "insufficient",
			fp16: totalRamGb >= 32 ? "feasible" : totalRamGb >= 24 ? "tight" : "insufficient",
		};

		// GPU Acceleration heuristics
		const gpu = this.detectGpuHeuristics(totalRamGb);

		return {
			totalRamGb,
			freeRamGb,
			cpuCores,
			cpuModel,
			platform: process.platform,
			localModelFeasibility,
			quantization,
			gpu,
		};
	}

	private detectGpuHeuristics(totalRamGb: number): GpuAccelerationProfile {
		if (process.platform === "darwin" && os.cpus()[0]?.model?.toLowerCase().includes("apple")) {
			return {
				hasGpu: true,
				type: "apple_metal",
				estimatedVramGb: Math.round(totalRamGb * 0.75), // Unified memory
				details: "Apple Silicon Unified Memory with Metal Acceleration",
			};
		}

		if (process.env.CUDA_VISIBLE_DEVICES !== undefined || process.env.CUDA_PATH !== undefined) {
			return {
				hasGpu: true,
				type: "nvidia_cuda",
				details: "NVIDIA CUDA Acceleration Environment Detected",
			};
		}

		if (process.env.ROCM_PATH !== undefined || process.env.HIP_VISIBLE_DEVICES !== undefined) {
			return {
				hasGpu: true,
				type: "amd_rocm",
				details: "AMD ROCm Acceleration Environment Detected",
			};
		}

		return {
			hasGpu: false,
			type: "none",
			details: "No explicit GPU accelerator environment variables detected (CPU fallback)",
		};
	}

	/**
	 * Probes common local ports in parallel with strict timeouts to see if the user already has
	 * a local server running (e.g. Ollama or LM Studio).
	 */
	public async probeLocalEndpoints(timeoutMs: number = 250): Promise<LocalEndpointCandidate[]> {
		const candidates: Array<{ name: string; url: string; type: LocalEndpointCandidate["type"] }> = [
			{ name: "Ollama (Local)", url: "http://127.0.0.1:11434/api/tags", type: "ollama" },
			{ name: "LM Studio (Local)", url: "http://127.0.0.1:1234/v1/models", type: "lm_studio" },
			{ name: "vLLM / LocalAI (Local)", url: "http://127.0.0.1:8000/v1/models", type: "vllm" },
		];

		// Parallel non-blocking probe
		const probePromises = candidates.map(async (cand) => {
			const start = Date.now();
			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

				const resp = await fetch(cand.url, {
					method: "GET",
					signal: controller.signal,
				});
				clearTimeout(timeoutId);

				if (resp.ok) {
					const data = await resp.json() as { models?: Array<{ name?: string; id?: string }>; data?: Array<{ id?: string }> };
					const models: string[] = [];

					if (Array.isArray(data.models)) {
						for (const m of data.models) {
							if (m.name) models.push(m.name);
							else if (m.id) models.push(m.id);
						}
					} else if (Array.isArray(data.data)) {
						for (const m of data.data) {
							if (m.id) models.push(m.id);
						}
					}

					return {
						name: cand.name,
						url: cand.url,
						type: cand.type,
						available: true,
						models,
						latencyMs: Date.now() - start,
					};
				}
			} catch {
				// Offline
			}

			return {
				name: cand.name,
				url: cand.url,
				type: cand.type,
				available: false,
				models: [],
			};
		});

		return Promise.all(probePromises);
	}

	/**
	 * Returns the catalog of free cloud options with zero cost for the user.
	 */
	public getFreeCloudProviders(): FreeCloudProviderOption[] {
		return FREE_CLOUD_PROVIDERS;
	}
}

let defaultDiscovery: FreeAndLocalDiscovery | null = null;

export function getFreeAndLocalDiscovery(): FreeAndLocalDiscovery {
	if (!defaultDiscovery) {
		defaultDiscovery = new FreeAndLocalDiscovery();
	}
	return defaultDiscovery;
}
