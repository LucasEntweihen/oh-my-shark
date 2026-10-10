

export function GalaxySpiral() {
  return (
    <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden rounded-xl border border-surface-hover mx-auto">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500" width="100%" height="100%" className="absolute inset-0">
        <defs>
          <radialGradient id="spaceBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1A0B2E" stopOpacity="1"/>
            <stop offset="100%" stopColor="#05010F" stopOpacity="1"/>
          </radialGradient>

          <radialGradient id="galaxyCore" cx="50%" cy="50%" r="30%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1"/>
            <stop offset="15%" stopColor="#E040FB" stopOpacity="0.9"/>
            <stop offset="40%" stopColor="#9C27B0" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#311B92" stopOpacity="0"/>
          </radialGradient>

          <radialGradient id="spiralArm" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D500F9" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#4A148C" stopOpacity="0"/>
          </radialGradient>
          
          <filter id="gasBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="15" />
          </filter>
        </defs>

        <rect width="100%" height="100%" fill="url(#spaceBg)" />

        <g stroke="#FFFFFF" strokeOpacity="0.1" strokeWidth="1">
          <polyline points="100,50 150,120 80,180" />
          <circle cx="100" cy="50" r="2" fill="#FFF" opacity="0.3"/>
          <circle cx="150" cy="120" r="2" fill="#FFF" opacity="0.3"/>
          <circle cx="80" cy="180" r="2" fill="#FFF" opacity="0.3"/>
        </g>

        <g transform="translate(500, 250) scale(1, 0.4) rotate(-30)">
          <path d="M 0 0 C 100 -50, 300 0, 400 200 C 500 400, 200 500, 0 450 C -200 400, -300 200, -100 50" 
                fill="none" stroke="url(#spiralArm)" strokeWidth="60" filter="url(#gasBlur)" />
                
          <path d="M 0 0 C -100 50, -300 0, -400 -200 C -500 -400, -200 -500, 0 -450 C 200 -400, 300 -200, 100 -50" 
                fill="none" stroke="url(#spiralArm)" strokeWidth="60" filter="url(#gasBlur)" />
                
          <path d="M 0 0 C 80 -40, 200 0, 300 150" fill="none" stroke="#E040FB" strokeWidth="20" filter="url(#gasBlur)" opacity="0.7"/>
          <path d="M 0 0 C -80 40, -200 0, -300 -150" fill="none" stroke="#E040FB" strokeWidth="20" filter="url(#gasBlur)" opacity="0.7"/>

          <circle cx="0" cy="0" r="150" fill="url(#galaxyCore)" filter="url(#gasBlur)"/>
        </g>

        <g fill="#FFFFFF">
          <circle cx="480" cy="240" r="2" opacity="1" />
          <circle cx="520" cy="260" r="1.5" opacity="0.9" />
          <circle cx="450" cy="270" r="3" opacity="0.8" filter="url(#gasBlur)"/>
          <circle cx="550" cy="230" r="1" opacity="0.5" />
          <circle cx="200" cy="400" r="1.5" opacity="0.4" />
          <circle cx="800" cy="100" r="1" opacity="0.6" />
          <circle cx="700" cy="400" r="2" opacity="0.3" />
        </g>
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-base to-transparent pointer-events-none"></div>
    </div>
  );
}
