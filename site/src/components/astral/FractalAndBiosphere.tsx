export function FractalAndBiosphere() {
	return (
		<div className="w-full h-full relative overflow-hidden bg-[#0B224A] select-none">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 800 540"
				className="w-full h-full object-cover"
				role="img"
				aria-label="Visor CRT: Árvore de Raciocínio Fractal sobre a Biosfera com 3 Vacas no Pasto"
			>
				<defs>
					<linearGradient id="crtSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%" stopColor="#0B224A" />
						<stop offset="35%" stopColor="#143B75" />
						<stop offset="68%" stopColor="#225799" />
						<stop offset="76%" stopColor="#3B73B5" />
						<stop offset="100%" stopColor="#1A2636" />
					</linearGradient>

					<radialGradient id="fractalCore3D" cx="50%" cy="64%" r="52%" fx="50%" fy="58%">
						<stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
						<stop offset="28%" stopColor="#EBF7FC" stopOpacity="0.96" />
						<stop offset="55%" stopColor="#A8CBE8" stopOpacity="0.85" />
						<stop offset="82%" stopColor="#5889BA" stopOpacity="0.45" />
						<stop offset="100%" stopColor="#143B75" stopOpacity="0" />
					</radialGradient>

					<linearGradient id="plumeLightTop" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
						<stop offset="60%" stopColor="#CDE4F5" stopOpacity="0.88" />
						<stop offset="100%" stopColor="#6B96C2" stopOpacity="0.65" />
					</linearGradient>

					<linearGradient id="plumeShadowBase" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%" stopColor="#8EB4D9" stopOpacity="0.75" />
						<stop offset="50%" stopColor="#527DA8" stopOpacity="0.85" />
						<stop offset="100%" stopColor="#2B507A" stopOpacity="0.9" />
					</linearGradient>

					<linearGradient id="mountainFarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%" stopColor="#253547" />
						<stop offset="100%" stopColor="#16202B" />
					</linearGradient>

					<linearGradient id="hillMidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%" stopColor="#4E5B47" />
						<stop offset="50%" stopColor="#3B4636" />
						<stop offset="100%" stopColor="#283024" />
					</linearGradient>

					<linearGradient id="steppeMeadowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%" stopColor="#8A8668" />
						<stop offset="25%" stopColor="#A8A282" />
						<stop offset="65%" stopColor="#969070" />
						<stop offset="100%" stopColor="#6E694F" />
					</linearGradient>

					<linearGradient id="cowBody3D" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%" stopColor="#FFFFFF" />
						<stop offset="55%" stopColor="#DCD8CC" />
						<stop offset="100%" stopColor="#787468" />
					</linearGradient>

					<linearGradient id="cowPatchDark" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%" stopColor="#383630" />
						<stop offset="100%" stopColor="#141310" />
					</linearGradient>

					<linearGradient id="crtGlassReflection" x1="0%" y1="0%" x2="65%" y2="100%">
						<stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
						<stop offset="28%" stopColor="#FFFFFF" stopOpacity="0.06" />
						<stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.0" />
						<stop offset="100%" stopColor="#5CE1E6" stopOpacity="0.05" />
					</linearGradient>

					<radialGradient id="crtTubeVignette" cx="50%" cy="50%" r="70%">
						<stop offset="60%" stopColor="#000000" stopOpacity="0" />
						<stop offset="92%" stopColor="#000000" stopOpacity="0.35" />
						<stop offset="100%" stopColor="#000000" stopOpacity="0.78" />
					</radialGradient>

					<pattern id="scanlinesPattern" width="4" height="4" patternUnits="userSpaceOnUse">
						<line x1="0" y1="0" x2="4" y2="0" stroke="#000000" strokeWidth="1" strokeOpacity="0.18" />
						<line x1="0" y1="2" x2="4" y2="2" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.03" />
					</pattern>
				</defs>

				{/* Fundo do Céu */}
				<rect x="0" y="0" width="800" height="540" fill="url(#crtSkyGrad)" />

				{/* Estrelas e Cometa Distante */}
				<g opacity="0.65">
					<circle cx="75" cy="52" r="1" fill="#FFFFFF" />
					<circle cx="142" cy="88" r="1.5" fill="#5CE1E6" />
					<circle cx="680" cy="45" r="1" fill="#FFFFFF" />
					<circle cx="735" cy="95" r="1.2" fill="#FFF3B0" />
					<circle cx="62" cy="190" r="1" fill="#FFFFFF" />
					<path d="M 640 78 L 745 38" stroke="url(#plumeLightTop)" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.8" />
					<circle cx="640" cy="78" r="2.5" fill="#FFFFFF" />
				</g>

				{/* Halo do Fractal */}
				<ellipse cx="400" cy="240" rx="340" ry="175" fill="url(#fractalCore3D)" />

				{/* Ramificações do Fractal de Raciocínio */}
				<g fill="url(#plumeLightTop)" stroke="#8AB4DC" strokeWidth="0.6">
					<path d="M 380 345 L 220 338 L 140 315 L 55 318 L 95 302 L 42 292 L 115 288 L 78 272 L 158 278 L 125 258 L 210 272 L 295 305 Z" />
					<path d="M 365 320 L 185 268 L 105 232 L 48 212 L 95 208 L 58 188 L 128 195 L 92 172 L 175 190 L 145 168 L 235 202 L 325 268 Z" />
					<path d="M 375 295 L 235 195 L 155 128 L 95 92 L 142 98 L 112 72 L 172 88 L 148 58 L 215 88 L 195 62 L 268 115 L 348 220 Z" />
					<path d="M 390 275 L 295 142 L 245 68 L 218 32 L 252 48 L 242 18 L 278 48 L 272 16 L 308 55 L 308 24 L 342 75 L 378 195 Z" />
					<path d="M 400 265 L 368 110 L 352 42 L 348 12 L 368 38 L 376 8 L 392 40 L 404 10 L 416 42 L 432 14 L 440 48 L 462 22 L 458 68 L 442 155 L 412 265 Z" />
					<path d="M 415 275 L 485 135 L 538 58 L 575 24 L 562 58 L 598 32 L 578 72 L 618 52 L 592 92 L 635 78 L 595 125 L 515 215 Z" />
					<path d="M 425 295 L 555 182 L 648 115 L 718 68 L 685 105 L 742 82 L 698 125 L 752 112 L 695 152 L 738 145 L 655 188 L 535 258 Z" />
					<path d="M 430 318 L 585 255 L 675 212 L 748 182 L 705 212 L 758 204 L 708 232 L 748 232 L 682 258 L 725 262 L 635 285 L 515 315 Z" />
					<path d="M 420 345 L 580 332 L 685 308 L 762 295 L 718 315 L 768 318 L 705 332 L 742 342 L 655 345 L 530 348 Z" />
				</g>

				{/* Camada de Sombra do Fractal */}
				<g fill="url(#plumeShadowBase)" opacity="0.72">
					<path d="M 400 348 C 340 310, 260 280, 190 285 C 250 260, 310 265, 360 295 C 310 230, 260 180, 210 165 C 275 165, 330 205, 375 265 C 355 190, 345 125, 335 85 C 365 125, 385 185, 400 245 C 415 185, 435 125, 465 85 C 455 125, 445 190, 425 265 C 470 205, 525 165, 590 165 C 540 180, 490 230, 440 295 C 490 265, 550 260, 610 285 C 540 280, 460 310, 400 348 Z" />
				</g>

				{/* Cristais Iluminados */}
				<g fill="#FFFFFF" opacity="0.92">
					<polygon points="400,290 365,210 382,220 375,165 395,195 400,135 405,195 425,165 418,220 435,210" />
					<polygon points="365,335 280,295 305,292 265,265 315,275 295,245 345,270 375,315" />
					<polygon points="435,335 520,295 495,292 535,265 485,275 505,245 455,270 425,315" />
					<polygon points="355,345 362,298 370,312 376,288 384,315 392,345" />
					<polygon points="408,345 416,315 424,288 430,312 438,298 445,345" />
				</g>

				{/* Terreno da Biosfera */}
				<path d="M 0 335 Q 45 322, 95 338 T 210 330 Q 265 318, 325 335 T 455 332 Q 520 315, 590 334 T 710 326 Q 755 318, 800 328 L 800 375 L 0 375 Z" fill="url(#mountainFarGrad)" />
				<path d="M 0 342 C 90 348, 160 365, 240 362 C 320 358, 390 336, 480 344 C 570 352, 660 340, 800 338 L 800 390 L 0 390 Z" fill="url(#hillMidGrad)" />
				<path d="M 0 352 C 180 368, 380 374, 580 370 C 690 368, 750 365, 800 364 L 800 516 L 0 516 Z" fill="url(#steppeMeadowGrad)" />

				{/* Linhas de Grama */}
				<g stroke="#5C5840" strokeWidth="0.6" opacity="0.45">
					<line x1="20" y1="395" x2="180" y2="395" />
					<line x1="240" y1="412" x2="490" y2="412" />
					<line x1="520" y1="402" x2="760" y2="402" />
					<line x1="60" y1="448" x2="310" y2="448" />
					<line x1="390" y1="462" x2="720" y2="462" />
					<line x1="110" y1="490" x2="640" y2="490" />
				</g>

				{/* AS 3 VACAS DO SANDBOX LOCAL */}
				{/* Vaca 1 (Esquerda Posterior) */}
				<g transform="translate(182, 412)">
					<ellipse cx="24" cy="28" rx="22" ry="4" fill="#3A3728" opacity="0.55" />
					<path d="M 10 16 L 10 27 M 15 16 L 16 26 M 32 16 L 31 27 M 36 15 L 38 26" stroke="#5A564C" strokeWidth="2.2" />
					<path d="M 6 6 C 12 3, 28 3, 38 5 C 42 6, 43 14, 38 17 C 28 19, 14 18, 8 16 Z" fill="url(#cowBody3D)" />
					<path d="M 0 8 L 6 4 L 9 11 L 2 13 Z" fill="url(#cowBody3D)" />
					<path d="M 16 4 C 22 4, 26 9, 22 13 C 18 14, 14 10, 16 4 Z" fill="url(#cowPatchDark)" />
				</g>

				{/* Vaca 2 (Esquerda Principal com Dorso Branco e Flanco Escuro) */}
				<g transform="translate(212, 408)">
					<ellipse cx="32" cy="42" rx="30" ry="5" fill="#2E2C20" opacity="0.65" />
					<path d="M 14 24 L 13 41 M 19 24 L 21 39 M 44 24 L 43 41 M 50 22 L 53 40" stroke="#2B2923" strokeWidth="2.8" strokeLinecap="round" />
					<path d="M 10 8 C 20 5, 42 5, 54 7 C 58 8, 59 20, 52 25 C 38 28, 20 27, 12 23 Z" fill="url(#cowBody3D)" />
					<path d="M 10 8 C 16 8, 22 14, 26 24 L 12 23 Z" fill="url(#cowPatchDark)" />
					<path d="M 28 11 C 38 10, 48 13, 50 24 C 40 26, 30 25, 26 20 Z" fill="url(#cowPatchDark)" />
					<path d="M 0 9 L 8 3 L 13 6 L 12 16 L 3 15 Z" fill="url(#cowPatchDark)" />
					<path d="M 2 9 L 6 5 L 7 12 L 2 13 Z" fill="#EAE6DC" />
					<path d="M 55 9 Q 60 18, 58 28" stroke="#2B2923" strokeWidth="1.5" fill="none" />
				</g>

				{/* Vaca 3 (Centro-Direita) */}
				<g transform="translate(342, 414)">
					<ellipse cx="22" cy="30" rx="20" ry="4" fill="#2E2C20" opacity="0.6" />
					<path d="M 9 16 L 9 29 M 13 16 L 15 28 M 31 16 L 30 29 M 35 15 L 37 28" stroke="#2B2923" strokeWidth="2.2" />
					<path d="M 6 6 C 15 4, 30 4, 38 6 C 41 8, 40 16, 35 19 C 25 21, 14 20, 8 17 Z" fill="url(#cowBody3D)" />
					<path d="M 14 6 C 24 6, 32 10, 34 18 C 24 20, 16 18, 12 14 Z" fill="url(#cowPatchDark)" />
					<path d="M 0 8 L 6 4 L 9 11 L 2 12 Z" fill="url(#cowBody3D)" />
				</g>

				{/* Formação Rochosa / Sonda */}
				<g transform="translate(418, 400)">
					<ellipse cx="12" cy="8" rx="14" ry="3" fill="#2E2C20" opacity="0.5" />
					<path d="M 2 7 L 6 2 L 14 3 L 18 7 Z" fill="#3A382E" />
					<path d="M 16 7 L 20 4 L 25 5 L 26 8 Z" fill="#4A473B" />
				</g>

				{/* Barras de Telemetria Internas */}
				<rect x="0" y="0" width="800" height="22" fill="#091326" fillOpacity="0.9" />
				<line x1="0" y1="22" x2="800" y2="22" stroke="#00F0FF" strokeWidth="1" strokeOpacity="0.5" />
				<text x="10" y="15" fill="#A8D8EA" fontFamily="monospace" fontSize="10" letterSpacing="1.5">
					[OMSK-ORBITAL OS v3.0] :: NÚCLEO: PI-AST/BUILTINS :: ÁRVORE-SINTÁTICA: ATIVA :: PROVEDOR: ANTHROPIC/GEMINI :: [PT-BR]
				</text>

				<rect x="0" y="516" width="800" height="24" fill="#1C2224" fillOpacity="0.92" />
				<line x1="0" y1="516" x2="800" y2="516" stroke="#8A8668" strokeWidth="1" />
				<text x="10" y="532" fill="#D8E2DC" fontFamily="monospace" fontSize="10" letterSpacing="1.2">
					STATUS: BIOSFERA ESTÁVEL | TRÍADE DOOMANIA: PRONTA | LATÊNCIA: 12ms | COMPRESSÃO-SEMÂNTICA: 42% | MODO: SEGURO
				</text>

				{/* Efeitos Ópticos do Tubo CRT */}
				<rect x="0" y="0" width="800" height="540" fill="url(#scanlinesPattern)" pointerEvents="none" />
				<path d="M 0 0 L 800 0 L 800 220 C 520 260, 240 310, 0 420 Z" fill="url(#crtGlassReflection)" style={{ mixBlendMode: "screen" }} pointerEvents="none" />
				<rect x="0" y="0" width="800" height="540" fill="url(#crtTubeVignette)" pointerEvents="none" />
			</svg>
		</div>
	);
}
