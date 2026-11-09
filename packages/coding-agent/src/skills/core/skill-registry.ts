/**
 * Universal Skills Engine - Registry
 *
 * Central in-memory and persisted registry managing discovered, installed, and active skills.
 */
import { discoverAllLocalSkills } from "../discovery/local-discovery";
import { CURATED_75_SKILLS } from "../discovery/marketplace-discovery";
import type { UniversalSkill } from "../types";

export class UniversalSkillRegistry {
	private skillsById = new Map<string, UniversalSkill>();
	private initialized = false;

	/**
	 * Clears registry state.
	 */
	clear(): void {
		this.skillsById.clear();
		this.initialized = false;
	}

	/**
	 * Registers a skill into the registry respecting precedence:
	 * project > user > installed > builtin.
	 */
	register(skill: UniversalSkill): boolean {
		const existing = this.skillsById.get(skill.id);
		if (!existing) {
			this.skillsById.set(skill.id, skill);
			return true;
		}

		// Precedence hierarchy
		const hierarchy: Record<string, number> = {
			project: 4,
			user: 3,
			installed: 2,
			builtin: 1,
		};

		const existingPriority = hierarchy[existing.level] || 0;
		const newPriority = hierarchy[skill.level] || 0;

		if (newPriority > existingPriority) {
			this.skillsById.set(skill.id, skill);
			return true;
		}

		return false;
	}

	/**
	 * Retrieves a skill by ID or alias.
	 */
	get(idOrName: string): UniversalSkill | undefined {
		const normalized = idOrName.toLowerCase().trim();
		const direct = this.skillsById.get(normalized);
		if (direct) return direct;

		for (const skill of this.skillsById.values()) {
			if (skill.name.toLowerCase() === normalized) {
				return skill;
			}
		}
		return undefined;
	}

	/**
	 * Returns all registered skills.
	 */
	getAll(): UniversalSkill[] {
		return Array.from(this.skillsById.values());
	}

	/**
	 * Returns skills visible to the model (not hidden).
	 */
	getDiscoverable(): UniversalSkill[] {
		return this.getAll().filter(s => !s.hide);
	}

	/**
	 * Populates the registry by scanning local and installed environments.
	 */
	async refresh(options: { cwd?: string; home?: string } = {}): Promise<void> {
		this.clear();
		const discovered = await discoverAllLocalSkills(options);
		for (const skill of discovered) {
			this.register(skill);
		}
		this.initialized = true;
	}

	/**
	 * Ensures the registry has been initialized.
	 */
	async ensureInitialized(options: { cwd?: string; home?: string } = {}): Promise<void> {
		if (!this.initialized) {
			await this.refresh(options);
		}
	}
}

// Process-wide global registry instance
let globalRegistry: UniversalSkillRegistry | null = null;

export function getUniversalSkillRegistry(): UniversalSkillRegistry {
	if (!globalRegistry) {
		globalRegistry = new UniversalSkillRegistry();
	}
	return globalRegistry;
}
