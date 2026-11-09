/**
 * Universal Skills Engine - Activation Engine
 *
 * Implements the 3-Tier Intelligent Activation System:
 * - Tier 1 (Discovery): Compact summary (name + description + triggers) always in index
 * - Tier 2 (Activation): On-demand full SKILL.md body injection upon trigger/intent
 * - Tier 3 (Resources): Lazy access to sub-templates, scripts, and examples
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { UniversalSkill } from "../types";

export interface Tier1DiscoveryItem {
	id: string;
	name: string;
	description: string;
	triggers: string[];
	filePath: string;
}

export interface ActivatedSkillContext {
	skill: UniversalSkill;
	content: string;
	activatedAt: string;
	tier: 2 | 3;
}

export class ActivationEngine {
	private activeSkills = new Map<string, ActivatedSkillContext>();

	/**
	 * Generates Tier 1 Discovery metadata for all available skills.
	 * Compact format suitable for system prompts or fast tool completions.
	 */
	getTier1DiscoveryIndex(skills: readonly UniversalSkill[]): Tier1DiscoveryItem[] {
		return skills
			.filter(s => !s.hide)
			.map(skill => ({
				id: skill.id,
				name: skill.name,
				description: skill.description,
				triggers: skill.frontmatter.triggers || [],
				filePath: skill.filePath,
			}));
	}

	/**
	 * Activates a skill to Tier 2 (full content loaded into active working context).
	 */
	async activateSkill(skill: UniversalSkill): Promise<ActivatedSkillContext> {
		const existing = this.activeSkills.get(skill.id);
		if (existing) {
			return existing;
		}

		let content = skill.content;
		if (!content) {
			try {
				content = await fs.readFile(skill.filePath, "utf8");
			} catch {
				content = "";
			}
		}

		const activated: ActivatedSkillContext = {
			skill,
			content,
			activatedAt: new Date().toISOString(),
			tier: 2,
		};

		this.activeSkills.set(skill.id, activated);
		return activated;
	}

	/**
	 * Resolves a Tier 3 local resource file relative to the skill's base directory.
	 */
	async resolveTier3Resource(skill: UniversalSkill, relativePath: string): Promise<string> {
		const targetPath = path.resolve(skill.baseDir, relativePath);
		const relative = path.relative(skill.baseDir, targetPath);

		// Security check: Containment within skill directory
		if (relative.startsWith("..") || path.isAbsolute(relative)) {
			throw new Error(`Access denied: path "${relativePath}" escapes skill root ${skill.baseDir}`);
		}

		return await fs.readFile(targetPath, "utf8");
	}

	/**
	 * Returns currently active skills in this session.
	 */
	getActiveSkills(): ActivatedSkillContext[] {
		return Array.from(this.activeSkills.values());
	}

	/**
	 * Clears active skills for session reset.
	 */
	reset(): void {
		this.activeSkills.clear();
	}
}

let globalActivationEngine: ActivationEngine | null = null;

export function getActivationEngine(): ActivationEngine {
	if (!globalActivationEngine) {
		globalActivationEngine = new ActivationEngine();
	}
	return globalActivationEngine;
}
