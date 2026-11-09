/**
 * Universal Skills Engine - Trust Manager
 *
 * Evaluates provenance and assigns granular trust tiers to skills.
 */
import type { SkillTrustLevel, UniversalSkill } from "../types";

const VERIFIED_REPOSITORIES: Record<string, true> = {
	"obra/superpowers": true,
	"anthropics/skills": true,
	"vercel-labs/agent-skills": true,
	"addyosmani/agent-skills": true,
	"wshobson/agents": true,
};

/**
 * Assigns a trust tier to a skill based on its origin and installation state.
 */
export function evaluateSkillTrust(skill: Partial<UniversalSkill>): SkillTrustLevel {
	if (skill.level === "builtin" || skill.level === "project" || skill.level === "user") {
		return "trusted";
	}

	if (skill.repository) {
		const normalizedRepo = skill.repository.toLowerCase().trim();
		if (VERIFIED_REPOSITORIES[normalizedRepo]) {
			return "verified";
		}
		return "community";
	}

	return "community";
}

/**
 * Checks whether a skill requires user confirmation before execution or resource access.
 */
export function requiresConfirmation(trust: SkillTrustLevel): boolean {
	return trust === "community" || trust === "untrusted";
}
