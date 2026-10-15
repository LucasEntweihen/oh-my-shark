export function ExoplanetCodebaseDome() {
	return (
		<div className="w-full h-full relative overflow-hidden bg-[#041026] select-none">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 800 450"
				className="w-full h-full object-cover"
				role="img"
				aria-label="Centro de Controle Orbital: Domo do Exoplaneta-Repositório e Rastreador de Cometa"
			>
				<defs>
					<radialGradient id="planetSphere3D" cx="48%" cy="38%" r="62%" fx="45%" fy="28%">
						<stop offset="0%" stopColor="#FFFFFF" />
						<stop offset="45%" stopColor="#F2EFE9" />
						<stop offset="75%" stopColor="#C8C2B4" />
						<stop offset="92%" stopColor="#3A4A3E" />
						<stop offset="100%" stopColor="#0A140E" />
					</radialGradient>

					<linearGradient id="orbitalAtmosphere" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%" stopColor="#07224C" />
						<stop offset="50%" stopColor="#14468C" />
						<stop offset="100%" stopColor="#041026" />
					</linearGradient>

					<radialGradient id="emeraldBeacon3D" cx="35%" cy="35%" r="65%">
						<stop offset="0%" stopColor="#68FF96" />
						<stop offset="55%" stopColor="#00A838" />
						<stop offset="100%" stopColor="#00521B" />
					</radialGradient>
				</defs>

				<rect x="2" y="2" width="796" height="446" fill="url(#orbitalAtmosphere)" stroke="#968244" strokeWidth="4" />
				<path d="M 2 28 L 28 2 M 772 2 L 798 28" stroke="#D4B85E" strokeWidth="3" fill="none" />

				<clipPath id="planetHorizonClip">
					<path d="M 4 190 A 680 680 0 0 1 796 190 L 796 446 L 4 446 Z" />
				</clipPath>

				<g clipPath="url(#planetHorizonClip)">
					<path d="M 4 190 A 680 680 0 0 1 796 190 L 796 446 L 4 446 Z" fill="url(#planetSphere3D)" />
					<path d="M 0 240 L 140 210 L 110 290 L 195 270 L 245 340 L 310 310 L 365 446 L 0 446 Z" fill="#132916" />
					<path d="M 800 220 L 620 195 L 675 265 L 550 285 L 640 365 L 490 385 L 560 446 L 800 446 Z" fill="#0B170D" />

					{/* Crateras / Lagos de Código */}
					<g fill="#1E56A0" opacity="0.88">
						<circle cx="320" cy="145" r="8" /><circle cx="342" cy="138" r="12" /><circle cx="368" cy="152" r="9" />
						<circle cx="285" cy="168" r="11" /><circle cx="315" cy="175" r="14" /><circle cx="355" cy="182" r="10" />
						<circle cx="395" cy="165" r="13" /><circle cx="428" cy="158" r="9" /><circle cx="455" cy="175" r="11" />
						<circle cx="255" cy="205" r="12" /><circle cx="295" cy="212" r="8" /><circle cx="340" cy="218" r="15" />
						<circle cx="385" cy="208" r="11" /><circle cx="420" cy="222" r="14" /><circle cx="468" cy="205" r="10" />
					</g>

					{/* Anomalias de Erro */}
					<g fill="#D91E26">
						<rect x="422" y="168" width="9" height="9" rx="2" />
						<rect x="488" y="218" width="10" height="10" rx="2" />
						<rect x="448" y="254" width="11" height="11" rx="2" />
						<path d="M 340 285 L 365 278 L 372 308 L 345 312 Z" opacity="0.85" />
					</g>

					{/* Marcador Esmeralda de Build/Deploy Estável */}
					<circle cx="572" cy="172" r="18" fill="url(#emeraldBeacon3D)" stroke="#0A2912" strokeWidth="1.5" />
				</g>

				{/* Limbo Atmosférico */}
				<path d="M 4 190 A 680 680 0 0 1 796 190" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.65" />

				{/* Rastreador de Cometa Inferior Direito */}
				<g transform="translate(620, 280)">
					<rect x="0" y="0" width="160" height="150" fill="#020307" stroke="#968244" strokeWidth="2.5" />
					<g stroke="#E62229" strokeWidth="2" strokeOpacity="0.85">
						<line x1="76" y1="82" x2="22" y2="18" />
						<line x1="76" y1="82" x2="118" y2="10" />
						<line x1="76" y1="82" x2="152" y2="54" />
						<line x1="76" y1="82" x2="138" y2="142" />
						<line x1="76" y1="82" x2="32" y2="144" />
					</g>
					<ellipse cx="76" cy="82" rx="8" ry="12" transform="rotate(-15 76 82)" fill="#FFFFFF" />
					<polygon points="74,98 92,98 88,108" fill="#5A626A" />
				</g>

				<text x="780" y="28" textAnchor="end" fill="#D4B85E" fontFamily="monospace" fontSize="11">
					ÓRBITA: SÍNCRONA // CRATES: PI-AST &amp; BUILTINS CARREGADOS
				</text>
			</svg>
		</div>
	);
}
