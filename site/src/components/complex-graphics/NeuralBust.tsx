

export function NeuralBust() {
  return (
    <div className="relative w-full max-w-[800px] aspect-[4/3] mx-auto">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
        <defs>
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
            <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.1 0" />
          </filter>

          <linearGradient id="glitchCyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.8"/>
            <stop offset="50%" stopColor="#1DE9B6" stopOpacity="1"/>
            <stop offset="100%" stopColor="#00B0FF" stopOpacity="0.9"/>
          </linearGradient>

          <radialGradient id="nodeGlowYellow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD600" stopOpacity="1"/>
            <stop offset="40%" stopColor="#FF9100" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#FF6D00" stopOpacity="0"/>
          </radialGradient>

          <linearGradient id="cubeFaceTop" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E040FB" />
            <stop offset="100%" stopColor="#D500F9" />
          </linearGradient>
          <linearGradient id="cubeFaceLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9C27B0" />
            <stop offset="100%" stopColor="#6A1B9A" />
          </linearGradient>
          <linearGradient id="cubeFaceRight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4A148C" />
            <stop offset="100%" stopColor="#311B92" />
          </linearGradient>

          <filter id="wireShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="5" stdDeviation="3" floodColor="#000000" floodOpacity="0.6"/>
          </filter>
        </defs>

        <rect width="100%" height="100%" fill="#D1D4D7" />
        <rect width="100%" height="100%" style={{ mixBlendMode: 'multiply' }} filter="url(#noiseFilter)" />

        <g stroke="#333333" strokeWidth="1.5" filter="url(#wireShadow)">
          <line x1="200" y1="150" x2="350" y2="80" />
          <line x1="350" y1="80" x2="550" y2="120" />
          <line x1="200" y1="150" x2="150" y2="300" />
          <line x1="150" y1="300" x2="280" y2="400" />
          <line x1="280" y1="400" x2="450" y2="320" />
          <line x1="550" y1="120" x2="650" y2="250" />
          <line x1="650" y1="250" x2="450" y2="320" />
          <line x1="450" y1="320" x2="350" y2="80" />
          <line x1="280" y1="400" x2="650" y2="450" />
        </g>

        <circle cx="350" cy="80" r="40" fill="url(#nodeGlowYellow)" style={{ mixBlendMode: 'screen' }} />
        <circle cx="650" cy="250" r="50" fill="url(#nodeGlowYellow)" style={{ mixBlendMode: 'screen' }} />
        <circle cx="280" cy="400" r="35" fill="url(#nodeGlowYellow)" style={{ mixBlendMode: 'screen' }} />

        <g transform="translate(550, 120)">
          <polygon points="0,-15 15,-7 0,0 -15,-7" fill="url(#cubeFaceTop)" />
          <polygon points="-15,-7 0,0 0,15 -15,7" fill="url(#cubeFaceLeft)" />
          <polygon points="0,0 15,-7 15,7 0,15" fill="url(#cubeFaceRight)" />
          <polyline points="-15,-7 0,0 15,-7" fill="none" stroke="#000" strokeWidth="0.5"/>
          <line x1="0" y1="0" x2="0" y2="15" stroke="#000" strokeWidth="0.5"/>
        </g>
        
        <g transform="translate(150, 300) scale(1.2)">
          <polygon points="0,-15 15,-7 0,0 -15,-7" fill="url(#cubeFaceTop)" />
          <polygon points="-15,-7 0,0 0,15 -15,7" fill="url(#cubeFaceLeft)" />
          <polygon points="0,0 15,-7 15,7 0,15" fill="url(#cubeFaceRight)" />
        </g>

        <path d="M 350 550 C 350 480, 320 450, 340 380 C 360 310, 380 280, 420 250 C 460 220, 500 240, 510 300 C 520 360, 480 400, 470 450 C 460 500, 490 550, 490 550 Z" fill="#E0E0E0" filter="url(#wireShadow)"/>
        <path d="M 380 320 C 390 350, 410 380, 400 420" fill="none" stroke="#9E9E9E" strokeWidth="15" strokeLinecap="round"/>

        <g transform="translate(0,0)">
          <rect x="360" y="300" width="160" height="35" fill="url(#glitchCyan)" />
          <rect x="355" y="310" width="40" height="5" fill="#E040FB" />
          <rect x="510" y="325" width="20" height="8" fill="#FFD600" />
          <rect x="420" y="295" width="30" height="5" fill="#FFFFFF" />
        </g>

        <text x="50" y="100" fontFamily="monospace" fontSize="10" fill="#333" opacity="0.6">const body = document.querySelector('body');</text>
        <text x="50" y="115" fontFamily="monospace" fontSize="10" fill="#333" opacity="0.6">const navLogo = document.querySelector('.nav');</text>
      </svg>
    </div>
  );
}
