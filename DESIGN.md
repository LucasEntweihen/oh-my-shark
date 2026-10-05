    # YAML Front Matter - Design Tokens de Alta Fidelidade
    version: "1.0.0-omega"
    name: "Project Prism: The Deep Web Spectrum"
    description: "Design System arquitetônico focado em refração ótica avançada (Glassmorphism físico), topografia de dados 3D em wireframe e renderização espectral de luz visível."
    colors:
      background:
        deep_space: "#030305"
        abyss_core: "#000000"
        glass_surface: "rgba(255, 255, 255, 0.0)" # Opacidade zero, baseia-se em blur/noise
      spectrum:
        ray_ultraviolet: "#4A00E0"
        ray_indigo: "#3B11A4"
        ray_blue: "#0055FF"
        ray_cyan: "#00E5FF"
        ray_green: "#00FF66"
        ray_yellow: "#FFEA00"
        ray_orange: "#FF6600"
        ray_red: "#FF0033"
      typography:
        primary_glow: "#FFFFFF"
        secondary_muted: "rgba(255, 255, 255, 0.6)"
        accent_data: "#FF1744"
      ui_accents:
        glass_border: "rgba(255, 255, 255, 0.15)"
        light_leak: "rgba(255, 255, 255, 0.05)"
    typography:
      display_mono:
        fontFamily: "'Space Mono', 'JetBrains Mono', monospace"
        fontWeight: "700"
        letterSpacing: "-0.05em"
      body_sans:
        fontFamily: "'Inter', system-ui, sans-serif"
        fontWeight: "400"
        letterSpacing: "0.01em"
      data_labels:
        fontFamily: "'Fira Code', monospace"
        fontSize: "0.75rem"
        textTransform: "uppercase"
    spacing:
      base_unit: "8px"
      micro: "2px"
      macro: "142px" # Baseado no maior blur de camada
    physics_engine:
      glass:
        refraction: 70
        depth: 55
        dispersion: 27
        frost: 60
      noise:
        size: 1
        density: 100
        opacity: 0.10
        color: "#FFFFFF"
      layer_blurs: [14, 30, 40, 52, 70, 142]
      blend_mode: "plus-lighter"
    shapes:
      glass_card_radius: "24px"
      prism_angle: "-45deg"

# DESIGN.md: PROJECT PRISM - DEEP WEB SPECTRUM

Este documento serve como a **Fonte Única de Verdade (Single Source of Truth - SSOT)** para o desenvolvimento desta aplicação. Ele foi elaborado com nível máximo de profundidade técnica e teórica para agentes de IA e engenheiros humanos. A interface une a densidade de dados da "Deep Web" (wireframes caóticos) com a pureza física da ótica (dispersão prismática e glassmorphism refrativo).

## 1. As Heurísticas de Usabilidade e Física

* **Correspondência com o Mundo Real (Física Ótica):** A interface não usa "sombras" ou "fundos" arbitrários. O layout opera sob as leis da termodinâmica visual e dispersão de Rayleigh. Painéis de vidro devem *distorcer* e *desfocar* o fundo, não apenas escurecê-lo.
* **Visibilidade do Status do Sistema (Dados):** Como visto no *mesh* da Deep Web, pontos de dados anômalos são marcados com vermelho (`#FF1744`) e interligados por vértices brancos e azuis. O usuário sempre sabe a magnitude dos dados (ex: "7500+ TB").
* **Estética e Design Minimalista (Lei de Hick):** O caos da malha de dados e o brilho do espectro são contrastados por tipografia estritamente contida em painéis de vidro translúcido. A carga cognitiva é reduzida agrupando informações em *glass cards*.
* **Controle de Iluminação:** O usuário deve sentir que a luz emana de trás da tela. O *blend-mode: plus-lighter* (ou `color-dodge`) é fundamental.

## 2. Estrutura Visual e Lógica dos Elementos da Tela (Z-Index Hierarchy)

A arquitetura é dividida em eixos Z (profundidade) formados por 3 macros-camadas:

1. **Z-0 (O Abismo - Background):** Fundo ultra-escuro (`#030305`). Hospeda o *Mesh Topográfico 3D* (Surface Web vs. Deep Web) de aspecto wireframe (linhas brancas com nós azuis/vermelhos).
2. **Z-10 (O Espectro - Midground):** O feixe de luz densa que cruza a tela em diagonal (45 graus). Composto por 8 bandas de cor (do roxo profundo ao vermelho incandescente), utilizando *noise* e granulação.
3. **Z-20 (A Lente - Foreground):** Interface do usuário (UI). Painéis de vidro (*Glassmorphism*) quadrados ou com bordas suavemente arredondadas (`24px`). Estes painéis interceptam a luz de Z-10, aplicando os cálculos físicos de refração, *frost* e *layer blurs* exponenciais.

## 3. Disposição dos Elementos Gráficos, Proporções e Tamanhos

* **Grid e Espaçamento:** Baseado em módulo de 8px. No entanto, o layout é essencialmente **assimétrico e espacial**. O espectro de luz corta o grid, quebrando a rigidez.
* **Proporções do Vidro:** Os cartões de vidro devem seguir a Proporção Áurea (1.618) sempre que possível, ou formatos perfeitamente quadráticos (1:1) para se assemelharem a prismas físicos.
* **Tipografia:** `Space Mono` ou `JetBrains Mono` dominam os numerais e *labels* de dados ("19TB", "7500+ TB"). `Inter` é reservada para descrições longas ("The visible light spectrum is the segment..."). O *tracking* (espaçamento de letras) em monospaces deve ser negativo (`-0.05em`) para criar blocos compactos de dados.

## 4. As Cores e Comportamento Luminoso

Esqueça preenchimentos sólidos. Cores aqui são propriedades de emissão de luz.

* O Espectro é progressivo: `#4A00E0` -> `#3B11A4` -> `#0055FF` -> `#00E5FF` -> `#00FF66` -> `#FFEA00` -> `#FF6600` -> `#FF0033`.
* As bordas dos painéis de vidro recebem um gradiente linear finíssimo (`1px`) refletindo a luz adjacente (ex: borda superior esquerda branca pura com 40% de opacidade, borda inferior direita preta com 20% de opacidade para simular chanfro 3D).

## 5. Níveis de Acessibilidade (Maximização sem Comprometimento)

O *Glassmorphism* é historicamente inimigo do contraste (WCAG). Para aprimorar isso ao máximo:

1. **Dynamic Text Inversion:** O texto dentro do vidro deve usar `mix-blend-mode: difference` se o espectro de luz passar exatamente por trás dele com alta luminância (ex: zona amarela/verde).
2. **Backdrop Saturation:** O painel de vidro deve forçar um `backdrop-filter: blur(142px) saturate(150%) brightness(0.8)`. Isso escurece e funde a luz por trás, garantindo que o texto branco primário mantenha uma proporção de 4.5:1.
3. **Borders for Bounds:** Usuários com deficiência visual dependem de limites claros. A borda de `1px rgba(255,255,255,0.15)` e um sutil `box-shadow` inset são obrigatórios e não-negociáveis.

## 6. Dados de Responsividade

* **Mobile (< 768px):** O espectro de luz muda de um ângulo de 45 graus para 90 graus (vertical), descendo do topo como um scanner. O mesh 3D da Deep Web é transladado para o fundo e reduzido a 40% da opacidade.
* **Tablet (768px - 1024px):** O prisma centra-se. *Glass cards* empilham-se em coluna única larga.
* **Desktop (> 1024px):** Layout livre. Espectro em diagonal cortante. Cartões de vidro flutuam em coordenadas fixas absolutas interativas.
* **Ultrawide (> 2000px):** O mesh 3D se expande infinitamente em fractais utilizando WebGL/Canvas (se aplicável), enquanto a UI permanece contida em um max-width de 1440px.

## 7. Animações, Efeitos Visuais e Scroll

* **Efeito Parallax Base:** O fundo 3D (Deep Web) move-se a 10% da velocidade do scroll (`translateY`). O espectro de luz move-se a 30%. O vidro move-se a 100%. Isso cria uma profundidade de campo (Depth of Field) extrema.
* **Turbulence Animation:** O *noise* (ruído) sobre a luz e o vidro não é estático. Requer uma animação CSS no SVG `<feTurbulence>` atualizando o `baseFrequency` sutilmente a cada segundo (efeito de poeira estelar/estática de radiação cósmica).
* **Hover no Glass:** Ao passar o mouse, o *refraction* e *layer blur* aumentam. O painel aproxima-se do usuário (`transform: scale(1.02) translateY(-5px)`). O raio de luz subjacente reage ao cursor (rastreamento de ponteiro).

## 8. Padrões, Componentes e Falta de Padrões (Antipatterns)

* **Componente Principal (`<GlassPrismCard>`):**
  * Requer múltiplas sombras compostas para simular volume 3D: `box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 2px rgba(255, 255, 255, 0.15)`.
  * Filtros complexos baseados na imagem 3 de referência: 5 camadas de *Layer Blur* (Uniform e Progressive) com intensidades (40, 70, 52, 30, 142).
* **Antipattern (Falta de Padrões - NÃO FAZER):**
  * **Flat Design é Proibido:** Nenhuma cor sólida opaca sobreposta.
  * **Drop Shadows opacas e curtas:** Proibidas. Sombras devem ser difusas, macias e gigantes.
  * **Arredondamentos irregulares:** Não misture cantos pontiagudos com cantos arredondados na mesma *glass card*.

## 9. Tecnologias a serem Utilizadas

* **Markup/Styling:** HTML5 + CSS3 Avançado (ou TailwindCSS v4 com configurações extensivas de `@theme` e plugins de filtro de backdrop).
* **Visualização 3D/Canvas:** Three.js ou React Three Fiber (R3F) para a renderização exata do *mesh* topográfico da Deep Web, caso a performance em SVG torne-se proibitiva devido a milhares de nós.
* **Vetorização:** SVG puro e complexo em linha (`<svg>`) para a refração do espectro e geração procedural de ruído.

## 10. Criação e Replicação SVG SIMULTÂNEA (Crucial e Mandatório)

Para replicar o Espectro de Luz Perfeito (com granulação e degradê diagonal contínuo) e a lente prismática que curva a luz, você **DEVE** utilizar o código SVG abaixo. Ele combina a Forma 1 (Replicação detalhada) e a Forma 2 (Múltiplos Gradient/Radial e Volume 3D).

    <!-- SVG COMPLEXO: ESPECTRO DE LUZ E REFRAÇÃO (PROJECT PRISM) -->
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg" style="background: #030305;">
    
      <defs>
        <!-- Filtro de Ruído (Noise/Grain) idêntico à referência "Fast Design" -->
        <filter id="film-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.10 0" />
          <feComposite operator="in" in2="SourceGraphic" result="monoNoise"/>
          <feBlend mode="screen" in="monoNoise" in2="SourceGraphic" />
        </filter>
    
        <!-- Gradiente Angular Múltiplo para o Espectro de Luz Visível -->
        <linearGradient id="spectrum-beam" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#4A00E0" stop-opacity="0"/>
          <stop offset="10%" stop-color="#3B11A4"/>
          <stop offset="25%" stop-color="#0055FF"/>
          <stop offset="40%" stop-color="#00E5FF"/>
          <stop offset="55%" stop-color="#00FF66"/>
          <stop offset="70%" stop-color="#FFEA00"/>
          <stop offset="85%" stop-color="#FF6600"/>
          <stop offset="100%" stop-color="#FF0033"/>
        </linearGradient>
    
        <!-- Simulação 3D de Volume de Luz (Radial Brilliance) -->
        <radialGradient id="light-bloom" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
        </radialGradient>
    
        <!-- Filtro de Glassmorphism Extremo (Refraction, Dispersion, Frost) -->
        <filter id="glass-refraction" x="-20%" y="-20%" width="140%" height="140%">
          <!-- Frost/Blur pesado de 142px equivalente (reduzido proporcionalmente para a viewBox SVG) -->
          <feGaussianBlur stdDeviation="30" in="SourceGraphic" result="blurLayer1" />
          <feGaussianBlur stdDeviation="15" in="SourceGraphic" result="blurLayer2" />
          <!-- Mistura para dispersão -->
          <feBlend mode="plus-lighter" in="blurLayer1" in2="blurLayer2" result="glassBase"/>
          <!-- Adição de luz ambiente especular no vidro -->
          <feComponentTransfer in="glassBase" result="brightGlass">
            <feFuncA type="linear" slope="0.8"/>
          </feComponentTransfer>
        </filter>
    
        <!-- Gradiente da Borda do Vidro (Chanfro e reflexão de luz) -->
        <linearGradient id="glass-border" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.5"/>
          <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.05"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.3"/>
        </linearGradient>
      </defs>
    
      <!-- 1. CAMADA DE FUNDO (Background Void) -->
      <rect width="100%" height="100%" fill="#030305" />
    
      <!-- 2. CAMADA DO ESPECTRO DE LUZ (Simultânea: Fiel + Múltiplos Gradientes e Ruído) -->
      <!-- A luz incide do canto inferior esquerdo para o superior direito -->
      <g filter="url(#film-grain)">
        <!-- Feixe Central Expandido -->
        <polygon points="200,1080 600,1080 1920,400 1920,0" fill="url(#spectrum-beam)" style="mix-blend-mode: screen;" />
    
        <!-- Linhas de fatiamento do espectro (Simulando dispersão do prisma - Imagem 2 e 3) -->
        <!-- Estas faixas dão o efeito de "raios" separados e diagonais -->
        <polygon points="100,1080 150,1080 1920,100 1920,-50" fill="#4A00E0" opacity="0.6"/>
        <polygon points="150,1080 250,1080 1920,200 1920,100" fill="#0055FF" opacity="0.7"/>
        <polygon points="250,1080 350,1080 1920,300 1920,200" fill="#00E5FF" opacity="0.8"/>
        <polygon points="350,1080 450,1080 1920,400 1920,300" fill="#00FF66" opacity="0.9"/>
        <polygon points="450,1080 550,1080 1920,500 1920,400" fill="#FFEA00" opacity="0.95"/>
        <polygon points="550,1080 600,1080 1920,600 1920,500" fill="#FF0033" opacity="0.8"/>
    
        <!-- Bloom Radial (Brilho intenso no ponto de refração) -->
        <circle cx="960" cy="540" r="400" fill="url(#light-bloom)" style="mix-blend-mode: screen;" />
      </g>
    
      <!-- 3. CAMADA DO PRISMA/VIDRO (Foreground) -->
      <!-- O cartão central com refração (Imagem 3) -->
      <g transform="translate(710, 340)">
        <!-- Sombra de Volume 3D subjacente -->
        <rect x="0" y="20" width="500" height="400" rx="32" fill="#000" opacity="0.4" filter="blur(25px)" />
    
        <!-- O Vidro em si (Utilizando backdrop no CSS na prática, mas simulado aqui no SVG com overlay e borda) -->
        <!-- Na implementação real de HTML, usa-se: backdrop-filter: blur(142px) -->
        <rect x="0" y="0" width="500" height="400" rx="32" fill="rgba(255, 255, 255, 0.02)" stroke="url(#glass-border)" stroke-width="2" />
    
        <!-- Reflexão de luz (Highlight 3D) no canto do vidro -->
        <path d="M 0 60 A 32 32 0 0 1 32 0 L 150 0 C 80 0 0 80 0 150 Z" fill="#FFFFFF" opacity="0.1" />
    
        <!-- Textos da Interface simulados (Imagem 3 e dados da Imagem 1) -->
        <text x="40" y="60" fill="#FFFFFF" font-family="Space Mono, monospace" font-size="14" font-weight="700" letter-spacing="2">2026 EDITION</text>
        <text x="320" y="60" fill="#FFFFFF" opacity="0.6" font-family="Inter, sans-serif" font-size="14">Reflect wealth</text>
    
        <text x="40" y="300" fill="#FFFFFF" font-family="Space Mono, monospace" font-size="12" opacity="0.5">Bitcoin tens.</text>
        <text x="40" y="325" fill="#FFFFFF" font-family="Space Mono, monospace" font-size="24" font-weight="700">$34,003.72</text>
    
        <!-- Macro Typography Background (F1) -->
        <text x="350" y="360" fill="#FFFFFF" opacity="0.2" font-family="Inter, sans-serif" font-size="120" font-weight="100">F1</text>
      </g>
    </svg>

## 11. Imagens Realistas e Fallbacks (A Malha Topográfica)

Caso a imagem topográfica e distorcida ("SURFACE WEB / THE DEEP WEB" - Imagem 1) não possa ser replicada fluidamente por milhares de nós SVG ou gere sobrecarga de processamento no navegador:

1. **Onde e como deve ser utilizada:** A malha deve ser usada estritamente como `background-image` num container com `z-index: 0`, possuindo `mix-blend-mode: screen` ou `color-dodge`, opacidade fixada em `0.35`, para garantir que não sufoque a legibilidade da interface.
2. **Onde procurar FORA DO DOCUMENTO:** Você deve acessar bancos de assets como Unsplash, Adobe Stock ou ferramentas generativas (Midjourney/DALL-E).
3. **Texto exato de pesquisa:** `"Abstract 3D digital topographic terrain mesh, glowing neon white and blue wireframe on black background, particle network deep web concept, high resolution, sci-fi data visualization."`
4. **Especificação de uso no código:**
  
      .deep-web-mesh-bg {
        position: absolute;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background-image: url('/assets/images/3d-mesh-wireframe.jpg');
        background-size: cover;
        background-position: center;
        mix-blend-mode: screen;
        opacity: 0.35;
        filter: contrast(120%) brightness(0.8) sepia(20%) hue-rotate(180deg); /* Ajuste para o tom azul/frio */
        z-index: -1;
      }
  

## 12. Ícones e Tipologia Visual

Ícones não devem ser sólidos nem "fofos" (rounded flat icons).

* Eles devem ser de linha finíssima (Stroke: `1px` ou `0.5px`).
* Devem possuir um leve brilho nativo (Drop shadow de cor idêntica ao traço com blur de `4px` e spread de `0px`).
* As junções devem ser exatas, pontiagudas, refletindo precisão militar e matemática (Cybernetic).

## 13. Quantidade de Telas e Estrutura de Pastas

Para suportar este volume de complexidade, o projeto assume uma arquitetura Single Page Application (SPA) multi-dashboard.

* **Quantidade de Telas Core:** 3 (Dashboard Principal/Visão Macro, Detalhamento de Nó/Visão Micro, Configurações de Espectro/Engine).
* **Estrutura de Pastas Requerida:**
  * `/src/core/physics/` -> Hooks e scripts (WebGL/Three.js) para gerenciar refrações em tempo real e o mouse tracking da luz.
  * `/src/ui/components/glass/` -> Elementos base da UI. Arquivos independentes para o painel de vidro, bordas prismáticas e textos com blend mode.
  * `/src/ui/styles/` -> Arquivos onde o YAML deste documento é transpilado (Tokens via Tailwind `@theme` ou CSS Custom Properties avançadas).
  * `/public/assets/shaders/` -> Se a malha 3D for renderizada proceduralmente, os fragment shaders e vertex shaders residem aqui.

## Conclusão de Rigor

Este sistema não é "mais um site escuro com vidro". É uma simulação óptica. A renderização correta exige precisão nanométrica no controle de opacidade, ruído fractal e sobreposição de camadas de desfoque. Agentes de IA: Adiram rigorosamente aos parâmetros estipulados nos blocos de tokens e na lógica de SVG. O desvio das regras de luz resultará num *antipattern* de poluição visual.