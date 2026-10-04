    # YAML Front Matter - Design Tokens e Valores de Máquina
    version: "1.0.0-rc"
    name: "Cosmic Refraction & Galactic Cartography System"
    description: "Design system estruturado para uma interface desktop imersiva, unindo mapeamento de dados astronômicos (estilo sci-fi/HUD) com estética ultra-moderna de refração de luz e glassmorphism texturizado."
    colors:
      space_black: "#030305"
      core_white: "#FFFFFF"
      neon_orange: "#FF5500"
      burnt_orange: "#CC4400"
      stellar_blue: "#00E5FF"
      glass_surface: "rgba(255, 255, 255, 0.05)"
      glass_border: "rgba(255, 255, 255, 0.2)"
      spectrum:
        violet: "#4B0082"
        indigo: "#5C24FF"
        blue: "#007BFF"
        cyan: "#00E5FF"
        green: "#00FF44"
        yellow: "#FFEA00"
        orange: "#FF8C00"
        red: "#FF0040"
    typography:
      display:
        fontFamily: "'Helvetica Neue', 'Inter', sans-serif"
        fontWeight: "700"
        letterSpacing: "-0.04em"
      hud_data:
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
        fontWeight: "400"
        letterSpacing: "0.05em"
        textTransform: "uppercase"
      body:
        fontFamily: "'Inter', sans-serif"
        fontSize: "14px"
        lineHeight: "1.6"
    spacing:
      base: "4px"
      scale: ["4px", "8px", "16px", "24px", "32px", "48px", "64px", "128px"]
      grid_gap: "24px"
    shapes:
      radius_glass: "24px"
      radius_hud: "2px"
      radius_planet: "9999px"
    effects:
      blur_glass: "backdrop-filter: blur(40px) saturate(150%)"
      noise_overlay: "url(#noise-filter)"

# DESIGN.md: Cosmic Refraction & Galactic Cartography

Este documento é a Fonte Única de Verdade (SSOT) para a recriação programática e visual das interfaces anexadas. Ele instrui agentes de IA (Claude, Cursor, Stitch) e desenvolvedores a construir um sistema que funde mapas estelares tridimensionais, feixes de luz espectral e painéis translúcidos (*glassmorphism*), garantindo fidelidade sub-pixel.

## 1. As Heurísticas

A interface obedece a heurísticas estritas para balancear carga visual pesada com usabilidade técnica:

* **Relação Sinal-Ruído (Estética vs. Dados):** O ruído visual (granulação) e os feixes de luz são elementos de fundo. A interface de dados (HUD) deve estar na camada mais alta do eixo Z, utilizando fontes monoespaçadas de alto contraste.
* **Lei de Prägnanz (Simplicidade na Complexidade):** Apesar das órbitas elípticas complexas e da nuvem de pontos estelares, os dados vitais (nomes de planetas, setores galácticos) são alinhados a eixos invisíveis e seguem uma hierarquia de tamanho rígida.
* **Feedback de Estado Sistêmico:** Interações com o prisma de vidro ou com setores galácticos devem gerar micro-alterações na refração da luz e na opacidade das órbitas, confirmando a ação do usuário sem poluir a tela.

## 2. A Estrutura Visual e Lógica dos Elementos da Tela

A aplicação desktop é dividida lógicamente em camadas de profundidade (Depth Layers):

* **Layer 0 (Void):** Fundo `#030305` absoluto.
* **Layer 1 (Cosmos/Spectrum):** Feixes de luz arco-íris diagonais (baseados na referência *Fast Design*) ou o núcleo galáctico branco/laranja brilhante.
* **Layer 2 (Cartography):** Malha de elipses concêntricas, pontos de dados (planetas/estrelas) e text-labels (ex: *Trantor, Terminus, E-Eridani*).
* **Layer 3 (Atmosphere):** Filtro de ruído progressivo (Noise) cobrindo os quadrantes vazios.
* **Layer 4 (UI/Glass):** Componentes de interação de usuário flutuantes, usando cartões de *glassmorphism* altamente refratários que distorcem o que está nas Layers 1 a 3.

## 3. Disposição dos Elementos Gráficos e Proporções

* **Layout Imersivo (Edge-to-Edge):** O design não possui "margins" de página clássicas. Os mapas galácticos e os feixes de luz vazam pelas bordas da viewport (100vw x 100vh).
* **Centro de Massa:** O núcleo das galáxias ou a origem do feixe de luz atua como o ponto focal âncora, posicionado geralmente no centro-físico (50% 50%) ou em composição de regra dos terços (ex: feixe nascendo em 20% X, 80% Y).
* **Painel Glass:** O componente UI principal (cartão de leitura de espectro/wallet) possui proporção geométrica próxima a 1:1 (quadrado) com raios de borda acentuados (`24px`).

## 4. As Cores

* **Espectro Visível Contínuo:** A transição do arco-íris não usa cores web seguras, mas misturas vibrantes com *blend-mode: plus-lighter* ou *screen*. Ordem estrita: Rosa/Vermelho -> Laranja -> Amarelo -> Verde neon -> Azul -> Anil -> Roxo profundo.
* **Fogo Estelar (Galáxias):** O núcleo é sempre `#FFFFFF` cercado por gradientes radiais de amarelos e laranjas neons (`#FF5500`), com decaimento exponencial de opacidade para o preto.

## 5. A Tipografia e Tamanhos

* **Titulação e Textos Explicativos:** `Helvetica Neue` ou `Inter`, pesos mistos (Light e Bold). O texto explicativo sobre o espectro eletromagnético usa 14px, alinhado à direita, com tracking levemente solto.
* **Cartografia (Nomes de Planetas):** `JetBrains Mono` a 10px ou 12px, cor `#00E5FF` (cyan) ou `#FFFFFF`, com linhas guias de 1px conectando o texto ao nó estelar.
* **UI do Painel:** Utiliza pesos ultrafinos para valores de dados (ex: `$34,000.72`) e pesos densos para numeração de quadrantes (ex: `F1`).

## 6. Componentes

* **Glass Card (O Prisma):** O componente principal. Possui desfoque de fundo (backdrop-filter) complexo: a luz branca entra e se dispersa. Requer múltiplas sombras internas brancas (0.1 opacidade) para simular o volume do vidro.
* **Painel de Engenharia (Settings UI):** Como visto na referência, janelas flutuantes com fundo cinza escuro sólido (`#111`), controles deslizantes (sliders) azuis e inputs de texto para configurar ruído, refração e dispersão.
* **Nós Galácticos (Stellar Nodes):** Círculos perfeitos (2px a 8px) com brilho externo (box-shadow ou `feDropShadow`), codificados por cor dependendo do tipo de astro.

## 7. Os Padrões e a Falta de Padrões (Antipatterns/Invariantes)

* **DO (Padrões):** Use `mix-blend-mode: screen` ou `color-dodge` para todas as interseções de luzes e camadas estelares. Use ruído (noise) para quebrar o "banding" (marcas de transição) dos gradientes.
* **DON'T (Falta de Padrões Rejeitada):**
  * **NÃO USE** fundos brancos opacos para a UI de dados astronômicos.
  * **NÃO USE** drop-shadows pretos genéricos. No espaço, a profundidade é dada por opacidade, tamanho, sobreposição e intensidade de luz, não por sombras projetadas no vácuo.
  * **NÃO REDUZA** o mapa galáctico a um formato mobile de coluna única. Este é um design imersivo.

## 8. Níveis de Acessibilidade (e como aprimorar)

* Melhorar o contraste extremo entre as finas linhas de órbita (opacidade 10%) e o fundo escuro sem destruir o design requer um **"High Contrast Toggle"**, que aumentará a opacidade da base para 60% e tornará as fontes 1.2em maiores, preservando as heurísticas visuais originais para usuários comuns.
* Os SVG galácticos complexos DEVEM conter tags `<title>` e `<desc>` e usar `role="img"`. Para os painéis UI e configurações, a semântica ARIA correta é inegociável.

## 9. Dados de Responsividade

* **Foco Exclusivo Desktop/Ultrawide:** Breakpoint mínimo operacional: `1280px`. Abaixo disso, o sistema entra em modo *Terminal Fallback* (apenas dados em texto, suprimindo o mapa 3D).
* Em resoluções Ultrawide (21:9), o mapa galáctico sofre expansão radial natural. O layout usa coordenadas absolutas baseadas em porcentagem (`%` ou `vw/vh`) em vez de pixels fixos, ancoradas a partir do centro (50% 50%).

## 10. Animações, Efeitos Visuais e Scroll

* **Eventos de Scroll:** O scroll tradicional da página é abolido. A rolagem atua como eixo Z (Zoom In/Out) na galáxia, manipulando a propriedade `transform: scale()` e transladando parâmetros de `perspective()`.
* **Animações:** Rotação elíptica perpétua extremamente lenta para as órbitas (CSS `@keyframes rotate { from { transform: rotateZ(0deg) } to { transform: rotateZ(360deg) } }`, duração de 300s).
* **Progressive Layer Blur:** O desfoque ao redor da luz ou do núcleo não é linear. Exige o empilhamento de múltiplos filtros de desfoque (como demonstrado na referência de UI) com raios crescentes (ex: 14, 30, 52, 70, 142) para criar um cauda de luz orgânica.

## 11. Tecnologias, Ícones e Ferramentas

* **Tecnologias:** HTML5 puro, CSS3 (variáveis, `backdrop-filter`, `mix-blend-mode`, `@property` para gradientes animados), SVGs avançados criados via código (DOM). Nenhuma biblioteca pesada de WebGL (Three.js) será usada se o SVG der conta, otimizando SEO e DOM reading.
* **Ícones:** Ícones geométricos estritos baseados em SVG inline. Ícones de UI de software de design (layers, blend modes, eye icon).
* **Criação de Ferramentas:** Para replicar o painel de propriedades, use inputs HTML nativos `<input type="range">` estilizados radicalmente via CSS `::-webkit-slider-thumb`.

## 12. Telas e Estrutura de Pastas e Arquivos

* **Quantidade de Telas:** Apenas 1 tela imersiva (Single Page Application dashboard), com modais flutuantes.
* **Estrutura:**
  * `/index.html` (Estrutura DOM semântica e SVGs inline)
  * `/DESIGN.md` (Este arquivo)
  * *Nota estrutural: A aplicação usará Shadow DOM para encapsular o CSS dos painéis de UI, evitando vazamento de estilos.*

* * *

## 13. ENGENHARIA REVERSA: REPLICAÇÃO DE ELEMENTOS VISUAIS E CURVAS (SVG AVANÇADO)

Conforme a exigência absoluta de recriar as curvas, formatos e refrações aos mínimos detalhes, utilizaremos a **Forma Simultânea** para tratar visuais complexos: representação vetorial em SVG nativo de profundidade 3D.

### A. Replicando o "Cosmic Glassmorphism & Light Spectrum"

O feixe de luz arco-íris, o ruído e o prisma de vidro refratário (`Fast Design.jpg` e `download (28).jpg`) devem ser gerados com o seguinte bloco SVG rigoroso, simulando profundidade, desfoque progressivo e volume 3D:

    <!-- Injetar diretamente no HTML -->
    <svg width="100vw" height="100vh" viewBox="0 0 1920 1080" style="background: #0d0d12;" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Filtro de Ruído Profundo e Progressivo -->
        <filter id="hyper-noise" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.15 0" in="noise" result="coloredNoise" />
          <feComposite operator="in" in="coloredNoise" in2="SourceGraphic" result="compositeNoise"/>
          <feBlend mode="screen" in="compositeNoise" in2="SourceGraphic" />
        </filter>
    
        <!-- Gradiente do Feixe de Luz Principal (Branco intenso) -->
        <linearGradient id="main-beam" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9" />
          <stop offset="30%" stop-color="#FFFFFF" stop-opacity="1" />
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.0" />
        </linearGradient>
    
        <!-- Desfoque Progressivo (Simulando dispersão física) -->
        <filter id="progressive-blur" x="-50%" y="-50%" width="200%" height="200%">
           <feGaussianBlur stdDeviation="40" result="blur1" />
           <feGaussianBlur stdDeviation="70" result="blur2" />
           <feGaussianBlur stdDeviation="142" result="blur3" />
           <feMerge>
             <feMergeNode in="blur3" />
             <feMergeNode in="blur2" />
             <feMergeNode in="blur1" />
             <feMergeNode in="SourceGraphic" />
           </feMerge>
        </filter>
      </defs>
    
      <!-- Fundo com Ruído -->
      <rect width="100%" height="100%" fill="#0d0d12" filter="url(#hyper-noise)" />
    
      <!-- Feixe de Luz Branca de Entrada (Incidência) -->
      <polygon points="0,1080 300,1080 800,500 500,500" fill="url(#main-beam)" filter="url(#progressive-blur)" style="mix-blend-mode: plus-lighter;" />
    
      <!-- ESPECTRO REFRATADO (Rays) - Recriação Exata das Curvas Retas de Dispersão -->
      <g transform="translate(700, 450)" style="mix-blend-mode: plus-lighter;" filter="url(#progressive-blur)">
        <!-- As cores do arco-íris se dispersando angularmente -->
        <polygon points="0,0 1000,-400 1200,-350 0,50" fill="#FF0040" />
        <polygon points="0,50 1200,-350 1200,-250 0,100" fill="#FF8C00" />
        <polygon points="0,100 1200,-250 1200,-150 0,150" fill="#FFEA00" />
        <polygon points="0,150 1200,-150 1200,-50 0,200" fill="#00FF44" />
        <polygon points="0,200 1200,-50 1200,50 0,250" fill="#00E5FF" />
        <polygon points="0,250 1200,50 1200,150 0,300" fill="#007BFF" />
        <polygon points="0,300 1200,150 1200,250 0,350" fill="#4B0082" />
      </g>
    </svg>

*Sobreposição HTML/CSS (O Cartão de Vidro):* O cartão central que causa a refração será posicionado sobre o SVG via CSS:

    .glass-card {
      position: absolute;
      top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 400px; height: 400px;
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(55px) saturate(120%);
      border-radius: 32px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.05),
                  0 30px 60px rgba(0, 0, 0, 0.5);
      /* A textura de ruído sobre o vidro é aplicada aqui via pseudo-elemento ::before */
    }

### B. Replicando os "Mapas Galácticos Estelares e Solares"

Para as imagens `download (32).jpg` e `download (31).jpg`, a geometria elíptica tridimensional é mapeada achatando o eixo Y e rotacionando as órbitas, iluminadas por múltiplos `radialGradient` que emulam o fogo cósmico.

    <svg width="100%" height="100%" viewBox="-1000 -500 2000 1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Fogo do Núcleo Galáctico 3D (Branco para Laranja para Transparente) -->
        <radialGradient id="galactic-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1" />
          <stop offset="15%" stop-color="#FFF5CC" stop-opacity="0.9" />
          <stop offset="40%" stop-color="#FF5500" stop-opacity="0.6" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
    
        <!-- Gradiente para órbitas (Fade out nas pontas) -->
        <linearGradient id="orbit-fade" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#FFF" stop-opacity="0.0" />
          <stop offset="50%" stop-color="#FFF" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#FFF" stop-opacity="0.0" />
        </linearGradient>
      </defs>
    
      <!-- Universo de fundo -->
      <rect x="-1000" y="-500" width="2000" height="1000" fill="#010103" />
    
      <!-- Camada de Órbitas Elípticas (Mapeamento 3D) -->
      <g transform="rotate(-5) scale(1, 0.35)">
        <!-- O scale(1, 0.35) achata os círculos perfeitos, transformando-os em elipses 3D exatas -->
        <circle cx="0" cy="0" r="300" fill="none" stroke="url(#orbit-fade)" stroke-width="2" />
        <circle cx="0" cy="0" r="500" fill="none" stroke="url(#orbit-fade)" stroke-width="1.5" />
        <circle cx="0" cy="0" r="750" fill="none" stroke="url(#orbit-fade)" stroke-width="1" />
        <circle cx="0" cy="0" r="950" fill="none" stroke="url(#orbit-fade)" stroke-width="0.5" />
    
        <!-- Linhas Divisórias de Setores Galácticos (Reference: Imagem 32) -->
        <line x1="0" y1="0" x2="900" y2="-300" stroke="#FFF" stroke-width="0.5" stroke-opacity="0.3" stroke-dasharray="5,5" />
        <line x1="0" y1="0" x2="-800" y2="-400" stroke="#FFF" stroke-width="0.5" stroke-opacity="0.3" stroke-dasharray="5,5" />
        <line x1="0" y1="0" x2="-200" y2="950" stroke="#FFF" stroke-width="0.5" stroke-opacity="0.3" stroke-dasharray="5,5" />
    
        <!-- Partículas de Estrelas (Representação amostral) -->
        <circle cx="350" cy="150" r="6" fill="#00E5FF" filter="drop-shadow(0 0 10px #00E5FF)" />
        <circle cx="-450" cy="-200" r="4" fill="#FFEA00" filter="drop-shadow(0 0 8px #FFEA00)" />
        <circle cx="600" cy="-300" r="5" fill="#FFFFFF" />
      </g>
    
      <!-- Núcleo Galáctico (Renderizado pós-órbitas para ficar no topo) -->
      <circle cx="0" cy="0" r="250" fill="url(#galactic-core)" style="mix-blend-mode: screen;" />
    
      <!-- Labels de Dados (Achatamento revertido) -->
      <text x="350" y="50" fill="#00E5FF" font-family="JetBrains Mono" font-size="12" letter-spacing="1">TERMINUS</text>
      <text x="-450" y="-70" fill="#FFEA00" font-family="JetBrains Mono" font-size="12" letter-spacing="1">TRANTOR</text>
    </svg>

* * *

## 14. Tratamento de Imagens Realistas e Fallbacks (Procedimentos Mandatórios)

Caso o agente ou desenvolvedor identifique que os SVGs intrincados geram sobrecarga de renderização no DOM do cliente (Performance Bottleneck) ou se texturas cósmicas reais (fotos do telescópio James Webb ou fractais fotorealistas) precisem substituir o `<filter>` de ruído, o uso de imagens rasterizadas (.jpg/.webp) é permitido **EXCLUSIVAMENTE** seguindo este roteiro:

1. **Onde, Como e Porque:** A imagem deve ser utilizada **apenas como camada base (background-image)** no CSS, na "Layer 0" da arquitetura visual. O objetivo é economizar memória de GPU que seria gasta calculando ruídos de SVG complexos `feTurbulence` em telas 4K. A imagem receberá por cima o HTML/CSS de órbitas vetoriais SVG e os cartões de Glassmorphism.
2. **Onde procurar a imagem FORA DO DOCUMENTO:** O desenvolvedor deve acessar repositórios de imagens astrofotográficas de alta resolução, especificamente o portal **NASA Image and Video Library** ou acervos sem direitos autorais no **Unsplash** (categoria: texturas 3D render e astrofotografia).
3. **O exato texto de pesquisa:**
  * Para o fundo galáctico: `"Milky Way galaxy core high resolution dark space telescope"` ou `"Abstract 3D neon solar system infographic map"`.
  * Para a refração de luz: `"Optical prism light refraction rainbow spectrum noise texture"`.
4. **Forma de utilização especificada no modelo (Implementação):**A imagem rasterizada não deve ser inserida via tag `<img>`. Ela será acoplada como camada pseudo-elemento em CSS, coberta por um `overlay` escuro para não ofuscar os dados de texto vetoriais:
  
      .galaxy-viewport::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: url('assets/hi-res-galaxy-core.webp');
        background-size: cover;
        background-position: center;
        opacity: 0.85; /* Nunca opacidade 1, para manter o tom 'dark theme' */
        mix-blend-mode: screen;
        z-index: 0;
      }
  

Este DESIGN.md garante que nenhuma curva de elipse, dispersão espectral de cor ou profundidade simulada seja perdida entre a idealização do layout e o código entregue por humanos ou agentes de codificação em IA.