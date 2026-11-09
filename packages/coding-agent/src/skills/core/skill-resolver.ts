/**
 * Universal Skills Engine - Resolver
 *
 * Matches user intent, context keywords, and explicit requests to relevant skills.
 * Resolves dependency chains recursively.
 */
import type { UniversalSkill } from "../types";
import type { UniversalSkillRegistry } from "./skill-registry";

export interface ResolvedSkillMatch {
	skill: UniversalSkill;
	score: number;
	reasons: string[];
}

const STOP_WORDS: Record<string, true> = {
	a: true,
	o: true,
	e: true,
	de: true,
	do: true,
	da: true,
	em: true,
	um: true,
	uma: true,
	para: true,
	com: true,
	the: true,
	and: true,
	to: true,
	of: true,
	in: true,
	for: true,
	with: true,
	on: true,
	at: true,
	by: true,
};

/**
 * Tokenizes text into search keywords, removing common stop words.
 */
function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, " ")
		.split(/\s+/)
		.filter(t => t.length > 1 && !STOP_WORDS[t]);
}

/**
 * Resolves skills matching a user prompt or task specification.
 */
export function resolveSkillsForPrompt(
	prompt: string,
	registry: UniversalSkillRegistry,
	options: { maxResults?: number; minScore?: number } = {},
): ResolvedSkillMatch[] {
	const maxResults = options.maxResults ?? 6;
	const minScore = options.minScore ?? 2;
	const tokens = tokenize(prompt);
	const matches: ResolvedSkillMatch[] = [];

	const availableSkills = registry.getAll();

	for (const skill of availableSkills) {
		let score = 0;
		const reasons: string[] = [];

		// 1. Direct ID or Name mention
		const normalizedPrompt = prompt.toLowerCase();
		if (
			normalizedPrompt.includes(`@skill:${skill.id}`) ||
			normalizedPrompt.includes(`/skill:${skill.id}`) ||
			normalizedPrompt.includes(`@${skill.id}`)
		) {
			score += 100;
			reasons.push("Explicit skill trigger");
		} else if (normalizedPrompt.includes(skill.id) || normalizedPrompt.includes(skill.name.toLowerCase())) {
			score += 15;
			reasons.push("Direct name match in prompt");
		}

		// 2. Keyword tokens matching skill tags and triggers
		const tags = (skill.frontmatter.tags || []).map(t => t.toLowerCase());
		const triggers = (skill.frontmatter.triggers || []).map(t => t.toLowerCase());

		for (const token of tokens) {
			if (tags.includes(token)) {
				score += 5;
				reasons.push(`Tag match: "${token}"`);
			}
			if (triggers.includes(token)) {
				score += 8;
				reasons.push(`Trigger match: "${token}"`);
			}
			if (skill.description.toLowerCase().includes(token)) {
				score += 2;
			}
		}

		if (score >= minScore) {
			matches.push({ skill, score, reasons });
		}
	}

	matches.sort((a, b) => b.score - a.score);
	const topMatches = matches.slice(0, maxResults);

	// Resolve dependencies for top matches
	const resolvedSkills = new Map<string, ResolvedSkillMatch>();
	for (const m of topMatches) {
		resolvedSkills.set(m.skill.id, m);
		for (const depId of m.skill.dependencies) {
			const dep = registry.get(depId);
			if (dep && !resolvedSkills.has(dep.id)) {
				resolvedSkills.set(dep.id, {
					skill: dep,
					score: m.score - 1,
					reasons: [`Dependency of ${m.skill.id}`],
				});
			}
		}
	}

	return Array.from(resolvedSkills.values());
}
