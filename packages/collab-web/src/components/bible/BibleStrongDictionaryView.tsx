import type { ReactNode } from "react";
import { useState } from "react";

export interface StrongEntry {
	number: string;
	original: string;
	transliteration: string;
	language: "Hebraico" | "Grego";
	pronunciation: string;
	definition: string;
	etymology: string;
	occurrences: number;
}

export const STRONG_DICTIONARY: Record<string, StrongEntry> = {
	G26: {
		number: "G26",
		original: "ἀγάπη",
		transliteration: "agápē",
		language: "Grego",
		pronunciation: "ah-GAH-pay",
		definition:
			"Amor benevolente, incondicional, sacrificial e divino. Não baseado em atração ou mérito, mas na natureza daquele que ama.",
		etymology: "De ἀγαπάω (G25); afeição pura, benevolência suprema na literatura cristã primitiva.",
		occurrences: 116,
	},
	G3056: {
		number: "G3056",
		original: "λόγος",
		transliteration: "lógos",
		language: "Grego",
		pronunciation: "LAH-gahs",
		definition: "Palavra, verbo, discurso, razão divina manifesta, princípio cósmico da sabedoria eterna encarnada.",
		etymology: "De λέγω (G3004); expressar inteligência por meio de pensamento articulado.",
		occurrences: 330,
	},
	H7225: {
		number: "H7225",
		original: "רֵאשִׁית",
		transliteration: "rê'shîyth",
		language: "Hebraico",
		pronunciation: "ray-SHEETH",
		definition: "Princípio, primícias, ápice, início absoluto, parte principal.",
		etymology: "De רֹאשׁ (H7218 - cabeça, cume); o início cronológico e qualitativo.",
		occurrences: 51,
	},
	H1254: {
		number: "H1254",
		original: "בָּרָא",
		transliteration: "bârâ'",
		language: "Hebraico",
		pronunciation: "baw-RAW",
		definition:
			"Criar, produzir a partir do nada, esculpir soberanamente (usado exclusivamente para a atividade criadora de Deus).",
		etymology: "Raiz primitiva; ato de moldar e trazer à existência ex nihilo.",
		occurrences: 54,
	},
	G4151: {
		number: "G4151",
		original: "πνεῦμα",
		transliteration: "pneûma",
		language: "Grego",
		pronunciation: "PNOY-mah",
		definition: "Espírito, sopro de vida, vento, princípio vital e inteligência divina.",
		etymology: "De πνέω (soprar); respiração, vento, emanação espiritual.",
		occurrences: 385,
	},
};

export function BibleStrongDictionaryView(): ReactNode {
	const [activeEntry, setActiveEntry] = useState<StrongEntry>(STRONG_DICTIONARY["G26"]!);
	const [drawerOpen, setDrawerOpen] = useState(true);

	return (
		<div
			style={{
				display: "flex",
				height: "100%",
				width: "100%",
				background: "var(--bg-deep-ocean, #0B0F19)",
				overflow: "hidden",
			}}
		>
			{/* Coluna 1: O Texto Sagrado com números de Strong clicáveis */}
			<div
				style={{
					flex: 1,
					overflowY: "auto",
					padding: "28px 36px",
					display: "flex",
					flexDirection: "column",
					gap: "24px",
				}}
			>
				{/* Header do Módulo Bíblico */}
				<div
					style={{
						background: "#1A2235",
						border: "1px solid var(--aged-gold, #D4AF37)",
						borderRadius: "12px",
						padding: "16px 20px",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						boxShadow: "0 0 20px rgba(212, 175, 55, 0.15)",
					}}
				>
					<div>
						<span
							style={{
								fontFamily: "var(--font-title, 'Space Grotesk', sans-serif)",
								fontWeight: 700,
								fontSize: "1.1rem",
								color: "var(--aged-gold, #D4AF37)",
							}}
						>
							📖 TEXTO SAGRADO & ESTUDO LEXICOGRÁFICO
						</span>
						<div style={{ fontSize: "0.8rem", color: "var(--text-muted, #94A3B8)" }}>
							Clique em qualquer palavra com número de Strong para análise filológica profunda
						</div>
					</div>
					<button
						type="button"
						onClick={() => setDrawerOpen(o => !o)}
						style={{
							background: "var(--papyrus-dark, #2C2518)",
							border: "1px solid var(--aged-gold, #D4AF37)",
							color: "var(--aged-gold, #D4AF37)",
							padding: "6px 12px",
							borderRadius: "6px",
							fontSize: "0.8rem",
							fontWeight: 600,
							cursor: "pointer",
						}}
					>
						{drawerOpen ? "Recolher Léxico" : "Expandir Léxico"}
					</button>
				</div>

				{/* Cartão de Leitura: 1 Coríntios 13 */}
				<div
					style={{
						background: "#1A2235",
						border: "1px solid var(--border, #2A3245)",
						borderRadius: "12px",
						padding: "22px",
						lineHeight: "1.8",
						fontSize: "1rem",
					}}
				>
					<div
						style={{
							fontSize: "0.85rem",
							fontWeight: 700,
							color: "var(--aged-gold, #D4AF37)",
							marginBottom: "12px",
						}}
					>
						1 CORÍNTIOS 13:4-8 (TEXTUS RECEPTUS & NA28)
					</div>
					<p style={{ color: "#E2E8F0" }}>
						O{" "}
						<strong
							onClick={() => {
								setActiveEntry(STRONG_DICTIONARY["G26"]!);
								setDrawerOpen(true);
							}}
							style={{
								color: "var(--aged-gold, #D4AF37)",
								cursor: "pointer",
								borderBottom: "1px dashed var(--aged-gold)",
							}}
							title="Clique para ver G26"
						>
							Amor (ἀγάπη · G26)
						</strong>{" "}
						é paciente, é benigno; o amor não arde em ciúmes, não se ufana, não se ensoberbe. Não se conduz
						inconvenientemente, não procura os seus interesses, não se exaspera, não se ressente do mal; não se
						alegra com a injustiça, mas regozija-se com a verdade; tudo sofre, tudo crê, tudo espera, tudo
						suporta. O amor jamais acaba.
					</p>
				</div>

				{/* Cartão de Leitura: João 1 */}
				<div
					style={{
						background: "#1A2235",
						border: "1px solid var(--border, #2A3245)",
						borderRadius: "12px",
						padding: "22px",
						lineHeight: "1.8",
						fontSize: "1rem",
					}}
				>
					<div
						style={{
							fontSize: "0.85rem",
							fontWeight: 700,
							color: "var(--aged-gold, #D4AF37)",
							marginBottom: "12px",
						}}
					>
						JOÃO 1:1-3 (PROLOGOS)
					</div>
					<p style={{ color: "#E2E8F0" }}>
						No princípio era o{" "}
						<strong
							onClick={() => {
								setActiveEntry(STRONG_DICTIONARY["G3056"]!);
								setDrawerOpen(true);
							}}
							style={{
								color: "var(--aged-gold, #D4AF37)",
								cursor: "pointer",
								borderBottom: "1px dashed var(--aged-gold)",
							}}
							title="Clique para ver G3056"
						>
							Verbo (λόγος · G3056)
						</strong>
						, e o Verbo estava com Deus, e o Verbo era Deus. Ele estava no princípio com Deus. Todas as coisas
						foram feitas por intermédio dele, e sem ele nada do que foi feito se fez.
					</p>
				</div>

				{/* Cartão de Leitura: Gênesis 1 */}
				<div
					style={{
						background: "#1A2235",
						border: "1px solid var(--border, #2A3245)",
						borderRadius: "12px",
						padding: "22px",
						lineHeight: "1.8",
						fontSize: "1rem",
					}}
				>
					<div
						style={{
							fontSize: "0.85rem",
							fontWeight: 700,
							color: "var(--aged-gold, #D4AF37)",
							marginBottom: "12px",
						}}
					>
						GÊNESIS 1:1-2 (BERESHIT)
					</div>
					<p style={{ color: "#E2E8F0" }}>
						No{" "}
						<strong
							onClick={() => {
								setActiveEntry(STRONG_DICTIONARY["H7225"]!);
								setDrawerOpen(true);
							}}
							style={{
								color: "var(--aged-gold, #D4AF37)",
								cursor: "pointer",
								borderBottom: "1px dashed var(--aged-gold)",
							}}
							title="Clique para ver H7225"
						>
							princípio (רֵאשִׁית · H7225)
						</strong>
						,{" "}
						<strong
							onClick={() => {
								setActiveEntry(STRONG_DICTIONARY["H1254"]!);
								setDrawerOpen(true);
							}}
							style={{
								color: "var(--aged-gold, #D4AF37)",
								cursor: "pointer",
								borderBottom: "1px dashed var(--aged-gold)",
							}}
							title="Clique para ver H1254"
						>
							criou (בָּרָא · H1254)
						</strong>{" "}
						Deus os céus e a terra. E a terra era sem forma e vazia; e havia trevas sobre a face do abismo; e o{" "}
						<strong
							onClick={() => {
								setActiveEntry(STRONG_DICTIONARY["G4151"]!);
								setDrawerOpen(true);
							}}
							style={{
								color: "var(--aged-gold, #D4AF37)",
								cursor: "pointer",
								borderBottom: "1px dashed var(--aged-gold)",
							}}
							title="Clique para ver G4151"
						>
							Espírito (πνεῦμα / רוּחַ)
						</strong>{" "}
						de Deus se movia sobre a face das águas.
					</p>
				</div>
			</div>

			{/* Coluna 2: Janela Lateral Deslizante do Dicionário Strong */}
			{drawerOpen && (
				<div
					style={{
						width: "380px",
						background: "#1A2235",
						borderLeft: "1px solid var(--aged-gold, #D4AF37)",
						display: "flex",
						flexDirection: "column",
						overflowY: "auto",
						padding: "24px",
						gap: "18px",
						boxShadow: "-8px 0 24px rgba(0,0,0,0.5)",
					}}
				>
					<div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
						<span
							style={{
								background: "var(--papyrus-dark, #2C2518)",
								color: "var(--aged-gold, #D4AF37)",
								border: "1px solid var(--aged-gold, #D4AF37)",
								fontWeight: 700,
								fontSize: "0.85rem",
								padding: "2px 8px",
								borderRadius: "4px",
							}}
						>
							{activeEntry.number}
						</span>
						<span style={{ fontSize: "0.8rem", color: "var(--text-muted, #94A3B8)" }}>
							{activeEntry.language} · {activeEntry.occurrences} ocorrências
						</span>
					</div>

					<div>
						<div
							style={{
								fontSize: "2rem",
								fontWeight: 700,
								color: "#FFFFFF",
								fontFamily: "serif",
								letterSpacing: "1px",
							}}
						>
							{activeEntry.original}
						</div>
						<div style={{ fontSize: "1rem", color: "var(--aged-gold, #D4AF37)", fontWeight: 600 }}>
							{activeEntry.transliteration} ({activeEntry.pronunciation})
						</div>
					</div>

					<div
						style={{
							background: "#151D2E",
							borderRadius: "8px",
							padding: "14px",
							border: "1px solid rgba(212, 175, 55, 0.2)",
						}}
					>
						<div
							style={{
								fontSize: "0.8rem",
								fontWeight: 700,
								color: "var(--aged-gold, #D4AF37)",
								marginBottom: "6px",
							}}
						>
							DEFINIÇÃO LEXICOGRÁFICA
						</div>
						<div style={{ fontSize: "0.9rem", color: "#E2E8F0", lineHeight: "1.5" }}>
							{activeEntry.definition}
						</div>
					</div>

					<div
						style={{
							background: "#151D2E",
							borderRadius: "8px",
							padding: "14px",
							border: "1px solid rgba(212, 175, 55, 0.2)",
						}}
					>
						<div
							style={{
								fontSize: "0.8rem",
								fontWeight: 700,
								color: "var(--aged-gold, #D4AF37)",
								marginBottom: "6px",
							}}
						>
							ÁRVORE ETIMOLÓGICA & ORIGEM
						</div>
						<div style={{ fontSize: "0.85rem", color: "var(--text-muted, #94A3B8)", lineHeight: "1.5" }}>
							{activeEntry.etymology}
						</div>
					</div>

					<div
						style={{
							marginTop: "auto",
							fontSize: "0.75rem",
							color: "var(--text-muted, #94A3B8)",
							textAlign: "center",
						}}
					>
						Módulo Integrado ao Bible Strong Avatar App
					</div>
				</div>
			)}
		</div>
	);
}
