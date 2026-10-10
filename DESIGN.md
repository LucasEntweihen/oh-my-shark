YAML Front Matter - Design Tokens

version: "1.0.0"
name: "Neuro-Task Horizon: Gerenciador de Tarefas Dark Mode"
description: "Design system absoluto para um gerenciador de tarefas imersivo. Fundo escuro profundo, detalhes neons e componentes que fundem produtividade com elementos de redes neurais e cosmos."

colors:
background:
base: "#22242B" # Fundo principal da aplicação
surface: "#2A2D36" # Fundo dos cards e painéis elevados
surface_hover: "#323640"
sidebar: "#1E1F26"
text:
primary: "#FFFFFF"
secondary: "#8A8C95"
muted: "#5A5C63"
accents:
red_alert: "#E53935" # Usado no glitch e botões de pausa
yellow_warn: "#FFB300" # Progress bars, status pending
blue_info: "#1E88E5" # Tags, avatares
green_success: "#43A047" # Tasks concluídas
cyan_glitch: "#00E5FF" # Faixa sobre os olhos da estátua (Imagem 2)
galaxy:
purple_core: "#9C27B0" # Núcleo da galáxia (Imagem 3)
magenta_glow: "#E040FB"
deep_space: "#0A0514"

typography:
fontFamily:
display: "'Space Grotesk', system-ui, sans-serif"
body: "'Inter', 'Public Sans Regular', sans-serif"
mono: "'JetBrains Mono', monospace"
baseSize: "16px"
scale:
h1: "2.5rem"
h2: "1.5rem"
h3: "1.25rem"
body: "1rem"
sm: "0.875rem"
xs: "0.75rem"

spacing:
base: "8px"
half: "4px"
scales:
xs: "4px"
sm: "8px"
md: "16px"
lg: "24px"
xl: "32px"
xxl: "48px"

shapes:
radius_sm: "4px"
radius_md: "12px" # Padrão para os cards do gerenciador
radius_lg: "20px"
radius_full: "9999px" # Avatares e botões de rádio

DESIGN.md: Neuro-Task Horizon

Este documento é a especificação técnica visual, comportamental e arquitetural definitiva. Ele instrui agentes de IA a gerarem código sem desvios ("drift"), garantindo que a aplicação seja construída de forma idêntica à visão estrutural proposta pelas imagens de referência.

1. Visão Geral e Atmosfera (Mood)

O design é um Dark Mode funcional e profundo, que evita o preto absoluto (#000000) em favor de tons de grafite/chumbo (#22242B), reduzindo a fadiga visual. A atmosfera combina a produtividade de um dashboard corporativo rigoroso (Imagem 1) com áreas de imersão visual extremas — inteligência artificial representada por uma escultura clássica cibernética (Imagem 2) e um painel de metaverso galáctico (Imagem 3).

2. As Heurísticas de Nielsen Aplicadas

Visibilidade do Status do Sistema: Barras de progresso ("Task Done: 25/50" com a barra vermelha) informam instantaneamente o andamento.

Correspondência com o Mundo Real: Ícones reconhecíveis (Dashboard, Calendário, Relógio). A linguagem é direta.

Controle e Liberdade: Botões de pausa/play vermelhos nas tarefas ativas ("25m 20s" - Imagem 1) permitem interrupção imediata.

Consistência e Padrões: Todas as tags usam a mesma tipografia e bordas arredondadas. O menu lateral mantém-se estático e previsível.

Prevenção de Erros: Ações destrutivas ficam ocultas no menu de três pontos (⋮) e exigem confirmação.

Reconhecimento em vez de Memorização: O menu lateral expõe as seções abertamente em vez de escondê-las sob menus complexos.

Flexibilidade e Eficiência: O campo de busca (Search) no topo permite navegação rápida via atalhos de teclado (ex: Cmd + K).

Design Estético e Minimalista: Fundo liso, sem texturas ruidosas na UI principal. Elementos visuais densos são isolados em seus próprios contextos.

Diagnóstico e Recuperação de Erros: Estados vazios (Empty states) mostram grafismos sutis (SVGs simples) e um botão claro de "Criar nova tarefa".

Ajuda e Documentação: Ícone de sino e perfil no topo direito oferecem acesso rápido a tooltips e configurações.

3. Estrutura Visual e Lógica dos Elementos (Layout)

A interface adota um layout Masonry/Grid assimétrico.

Sidebar (Esquerda): Largura fixa de 260px. Fundo #1E1F26. Contém a logo geométrica []3, um botão primário com texto vermelho ("DASHBOARD") e itens de menu alinhados com ícones monocromáticos e texto #8A8C95.

Top Bar (Superior): Altura de 80px. Fundo transparente. Barra de busca com lupa à esquerda e ícones de ação (Sino, Avatar) à direita.

Grid Principal (Centro e Direita): Um CSS Grid com gap: 24px.

Coluna 1 (Projetos): Cards largos contendo ícones (Google, Slack), tags de progresso, barra de loading, e avatares empilhados (overlap).

Coluna 2 (Lista e Tracker): Lista enumerada (01 a 07) com botões de rádio e ícones de status amarelos. Abaixo, o tracker de tempo.

Coluna 3 (Widgets): Calendário estilizado ("Feb 2020") com botão de data ativa em vermelho sólido. Lista de mensagens com avatares circulares e texto truncado.

4. Disposição e Profundidade (Tonal Layers)

Não usaremos sombras pesadas (box-shadow). A profundidade 3D é simulada estritamente através do contraste de Camadas Tonais.
O z-index flui da seguinte forma:

z-index: 0: Background principal (#22242B).

z-index: 10: Cards da superfície (#2A2D36).

z-index: 20: Elementos interativos nos cards (Tags escuras, botões, ícones de progresso).

z-index: 30: Tooltips e Menus suspensos flutuantes flutuando (estes sim, levam uma leve box-shadow: 0 8px 32px rgba(0,0,0,0.4)).

5. Proporções e Tamanhos

O sistema obedece a uma escala rígida baseada em múltiplos de 8px.

Cards: Têm padding interno de 24px (p-6 no Tailwind).

Avatares: Tamanho fixo de 32pxx32px no grid de projetos, e 40pxx40px nas mensagens.

Barras de Progresso: Altura restrita a 4px.

Linhas separadoras (Dividers): Usam altura de 1px e cor #323640.

6. A Tipografia

Inter (Sans-serif): Usada em 90% da UI. Fornece neutralidade. Tamanhos variam de 12px (tags) a 16px (texto padrão).

JetBrains Mono: Exclusivo para cronômetros ("25m 20s") e números estritos de log ("Task Done: 30 / 30").

Espaçamento de Letras (Tracking): Labels em maiúsculas (ex: "HIGH", "COMPLETED") devem ter letter-spacing: 0.05em para melhorar a legibilidade.

7. As Cores (Aplicação Estrita)

As cores dos botões de progresso não são aleatórias:

#E53935 (Vermelho) = Atrasado, Crítico, Pausa. (Aplicado no dia "05" do calendário).

#FFB300 (Amarelo) = Em andamento, Atenção.

#43A047 (Verde) = Concluído.

Textos secundários NUNCA devem ser opacidade de branco (ex: rgba(255,255,255,0.5)). Use cores hexadecimais sólidas como #8A8C95 para evitar custos de re-renderização e garantir contraste exato.

8. Níveis de Acessibilidade

Melhorar a acessibilidade de um Dark Mode sem destruir o design requer sutileza:

Contraste (WCAG AA): O texto cinza #8A8C95 sobre fundo #2A2D36 garante uma taxa de contraste aceitável (~4.5:1).

Focus Rings: O contorno padrão do navegador deve ser substituído. Quando o usuário navegar via TAB, o elemento focado receberá um outline: 2px solid #00E5FF; outline-offset: 2px; (Ciano neon, referenciando o glitch da estátua).

ARIA Labels: Componentes visuais como a barra de progresso devem ter role="progressbar", aria-valuenow="50" e aria-valuemin="0".

Prefers-Reduced-Motion: Respeitar essa media query, desligando as animações da galáxia e dos glitches caso ativada.

9. Dados de Responsividade

Mobile (< 768px): A Sidebar se transforma em um "Hamburger Menu" oculto. O CSS Grid das tarefas vira 1 coluna única (100% de largura). Os avatares de projetos exibem no máximo 3 rostos + contador (ex: "+5").

Tablet (768px - 1024px): A Sidebar vira "Mini" (apenas ícones, sem texto, largura de 80px). O Grid passa a 2 colunas.

Desktop (> 1024px): Layout completo, sidebar fixa de 260px, grid de 3 a 4 colunas expansíveis.

10. As Animações e Eventos de Scroll

Microinterações: Botões e ícones devem ter transição de 150ms ease-in-out mudando cor ou leve transform: translateY(-2px).

Listas (Staggered Fade In): Ao carregar o dashboard, as tarefas da lista "My Tasks" devem surgir com um delay sequencial (0ms, 50ms, 100ms) deslizando levemente de baixo para cima (fade-up).

Scroll: A barra de rolagem (scrollbar) deve ser estilizada: fina (6px), track em #22242B e thumb em #323640, bordas arredondadas.

11. Componentes, Padrões e Falta de Padrões

Padrões (Do):

Avatar Stacks: Agrupamentos de usuários (ex: time do Slack) são feitos usando margem negativa à esquerda (-ml-3 no Tailwind) com uma borda sólida da cor do background (border-2 border-[#2A2D36]) para criar recorte visual (overlap perfeito).

Tags: Devem ter padding mínimo (px-2 py-1), fonte em 10px ou 12px uppercase, border de 1px com cor sutil e fundo transparente ou com opacidade de 10% da cor da borda.

Falta de Padrões / Antipatterns (Don't):

NÃO utilize degradês nos fundos dos cards. O UI design do dashboard é estritamente "Flat" com cores sólidas.

NÃO coloque textos primários brancos puros (#FFFFFF) grandes sobre o fundo puro preto. Causa halação (glow ocular) no escuro.

NÃO utilize sombras genéricas (box-shadow: 0px 4px 10px rgba(0,0,0,0.1)). Elas desaparecem em fundos #22242B.

12. Ícones e Tecnologias

Ícones: Utilizar biblioteca Lucide React ou Phosphor Icons renderizados inline como SVG, manipulados via currentColor com stroke-width: 1.5 ou 2.

Stack: Next.js (React), Tailwind CSS v4, Framer Motion (para a entrada fluida das listas) e D3.js ou Three.js caso os SVGs exijam manipulação pesada de dados (para os grafos).

13. Quantidade de Telas e Estrutura de Pastas

Quantidade: 3 Telas principais.

/dashboard (O Gerenciador Base - Imagem 1)

/neural-insights (Visualização de AI/Produtividade - Imagem 2)

/metaverse-projects (Área de projetos Blockchain/Web3 - Imagem 3).

Estrutura Lógica:

/src
  /components
    /layout (Sidebar, Header)
    /ui (Button, Badge, Avatar)
    /widgets (Calendar, TaskList, ProgressCard)
    /complex-graphics (NeuralBust, GalaxySpiral)
  /styles
    globals.css
  /lib
    utils.ts


14. A REGRA DE OURO: REPLICAÇÃO DE ELEMENTOS COMPLEXOS

O escopo exige a incorporação da Imagem 2 (Rede Neural / Estátua) e da Imagem 3 (Galáxia) de forma simultânea (como Vetor SVG intrincado e como instrução de Imagem Real).

14.1 O Busto Neural (Baseado na Imagem 2)

Esta representação visualiza o processamento algorítmico de tarefas.

A) REPLICAÇÃO EM SVG (Profundidade, Múltiplos Gradientes e Sombras)

Abaixo está o código para desenhar os cubos complexos da rede, as linhas neurais conectoras e a silhueta geométrica da estátua clássica, utilizando recursos super avançados do SVG (Filtros, Masks, Linear e Radial Gradients):

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <!-- Filtro de Ruído para o fundo do gráfico -->
    <filter id="noiseFilter">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.1 0" />
    </filter>

    <!-- Gradientes para a fita Glitch Cyan no olho da estátua -->
    <linearGradient id="glitchCyan" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00E5FF" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#1DE9B6" stop-opacity="1"/>
      <stop offset="100%" stop-color="#00B0FF" stop-opacity="0.9"/>
    </linearGradient>

    <!-- Gradiente Radial para o brilho dos Nós (Cubos) Amarelos e Laranjas -->
    <radialGradient id="nodeGlowYellow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFD600" stop-opacity="1"/>
      <stop offset="40%" stop-color="#FF9100" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#FF6D00" stop-opacity="0"/>
    </radialGradient>

    <!-- Gradiente Linear 3D para as faces dos cubos rosas/roxos -->
    <linearGradient id="cubeFaceTop" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#E040FB" />
      <stop offset="100%" stop-color="#D500F9" />
    </linearGradient>
    <linearGradient id="cubeFaceLeft" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9C27B0" />
      <stop offset="100%" stop-color="#6A1B9A" />
    </linearGradient>
    <linearGradient id="cubeFaceRight" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#4A148C" />
      <stop offset="100%" stop-color="#311B92" />
    </linearGradient>

    <!-- Filtro de Sombra (Drop Shadow) para volume 3D nas conexões -->
    <filter id="wireShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="5" stdDeviation="3" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Fundo texturizado com CSS Grid renderizado no SVG -->
  <rect width="100%" height="100%" fill="#D1D4D7" />
  <rect width="100%" height="100%" style="mix-blend-mode: multiply;" filter="url(#noiseFilter)" />

  <!-- Wireframes / Linhas de Conexão Neurais -->
  <g stroke="#333333" stroke-width="1.5" filter="url(#wireShadow)">
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

  <!-- Brilhos sob os cubos principais (Glow 3D) -->
  <circle cx="350" cy="80" r="40" fill="url(#nodeGlowYellow)" style="mix-blend-mode: screen;" />
  <circle cx="650" cy="250" r="50" fill="url(#nodeGlowYellow)" style="mix-blend-mode: screen;" />
  <circle cx="280" cy="400" r="35" fill="url(#nodeGlowYellow)" style="mix-blend-mode: screen;" />

  <!-- Componente Cubo 3D (Replicável) posicionado em X:550, Y:120 -->
  <g transform="translate(550, 120)">
    <!-- Top Face -->
    <polygon points="0,-15 15,-7 0,0 -15,-7" fill="url(#cubeFaceTop)" />
    <!-- Left Face -->
    <polygon points="-15,-7 0,0 0,15 -15,7" fill="url(#cubeFaceLeft)" />
    <!-- Right Face -->
    <polygon points="0,0 15,-7 15,7 0,15" fill="url(#cubeFaceRight)" />
    <!-- Arestas pretas para destacar o volume low-poly -->
    <polyline points="-15,-7 0,0 15,-7" fill="none" stroke="#000" stroke-width="0.5"/>
    <line x1="0" y1="0" x2="0" y2="15" stroke="#000" stroke-width="0.5"/>
  </g>
  
  <!-- Outro cubo posicionado -->
  <g transform="translate(150, 300) scale(1.2)">
    <polygon points="0,-15 15,-7 0,0 -15,-7" fill="url(#cubeFaceTop)" />
    <polygon points="-15,-7 0,0 0,15 -15,7" fill="url(#cubeFaceLeft)" />
    <polygon points="0,0 15,-7 15,7 0,15" fill="url(#cubeFaceRight)" />
  </g>

  <!-- Silhueta Geometrizada do Busto Clássico (Davi de Michelangelo estilizado) -->
  <path d="M 350 550 C 350 480, 320 450, 340 380 C 360 310, 380 280, 420 250 C 460 220, 500 240, 510 300 C 520 360, 480 400, 470 450 C 460 500, 490 550, 490 550 Z" fill="#E0E0E0" filter="url(#wireShadow)"/>
  <!-- Sombras do rosto -->
  <path d="M 380 320 C 390 350, 410 380, 400 420" fill="none" stroke="#9E9E9E" stroke-width="15" stroke-linecap="round"/>

  <!-- Faixa Glitch Ciano censurando os olhos -->
  <g transform="translate(0,0)">
    <rect x="360" y="300" width="160" height="35" fill="url(#glitchCyan)" />
    <!-- Ruído e deslocamento (Glitch effect parts) -->
    <rect x="355" y="310" width="40" height="5" fill="#E040FB" />
    <rect x="510" y="325" width="20" height="8" fill="#FFD600" />
    <rect x="420" y="295" width="30" height="5" fill="#FFFFFF" />
  </g>

  <!-- Fragmentos de Código (Textos sobrepostos) imitanto a Imagem 2 -->
  <text x="50" y="100" font-family="monospace" font-size="10" fill="#333" opacity="0.6">const body = document.querySelector('body');</text>
  <text x="50" y="115" font-family="monospace" font-size="10" fill="#333" opacity="0.6">const navLogo = document.querySelector('.nav');</text>
</svg>


B) UTILIZAÇÃO COMO IMAGEM MATRICIAL (Fallback Obrigatório)

Devido à textura granulada fotorealista da estátua e aos milhares de triângulos do wireframe na Imagem 2 original, renderizar isto via CSS/SVG pode fritar a CPU/GPU em dispositivos de baixo desempenho. É absolutamente necessário o uso de uma imagem.

Onde deve ser utilizada: Em um painel de destaque na rota /neural-insights, atuando como background expansivo (hero area) atrás dos gráficos de performance de tarefas concluídas.

Onde procurar (FORA DO DOCUMENTO): Acesse bancos de imagens premium ou plataformas de assets 3D como Shutterstock, Adobe Stock, Envato Elements ou Unsplash.

O Exato Texto de Pesquisa a ser utilizado: "Classical Greek statue bust with neon cyberpunk glitch eye bar and abstract 3D wireframe network nodes structure" ou "Vaporwave marble bust with deep learning neural network overlay concept".

Forma de Uso (Especificação):
A imagem deve ser recortada (fundo transparente .png ou .webp), colocada dentro de uma <div class="relative overflow-hidden">. A imagem deve receber no CSS mix-blend-mode: luminosity e uma sobreposição de camada <div class="absolute inset-0 bg-[#22242B] opacity-50"> para escurecê-la e encaixá-la harmoniosamente no Dark Mode do gerenciador de tarefas sem agredir a vista.

14.2 A Galáxia "Crafty Metaverse" (Baseada na Imagem 3)

Um painel etéreo e luminoso contrastando com o fundo escuro do gerenciador.

A) REPLICAÇÃO EM SVG (Espirais, Opacidade e Radial Gradients)

Simulando a refração, nuvens de poeira estelar e o núcleo supermassivo:

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500" width="100%" height="100%">
  <defs>
    <radialGradient id="spaceBg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1A0B2E" stop-opacity="1"/>
      <stop offset="100%" stop-color="#05010F" stop-opacity="1"/>
    </radialGradient>

    <!-- Núcleo galáctico hiper-brilhante -->
    <radialGradient id="galaxyCore" cx="50%" cy="50%" r="30%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1"/>
      <stop offset="15%" stop-color="#E040FB" stop-opacity="0.9"/>
      <stop offset="40%" stop-color="#9C27B0" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#311B92" stop-opacity="0"/>
    </radialGradient>

    <!-- Braços espirais em gradientes alongados -->
    <radialGradient id="spiralArm" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#D500F9" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#4A148C" stop-opacity="0"/>
    </radialGradient>
    
    <!-- Filtro Blur para criar a textura de nuvem de gás -->
    <filter id="gasBlur" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="15" />
    </filter>
  </defs>

  <!-- Fundo do Espaço Profundo -->
  <rect width="100%" height="100%" fill="url(#spaceBg)" />

  <!-- Conexões em Constelação (Fundo) -->
  <g stroke="#FFFFFF" stroke-opacity="0.1" stroke-width="1">
    <polyline points="100,50 150,120 80,180" />
    <circle cx="100" cy="50" r="2" fill="#FFF" opacity="0.3"/>
    <circle cx="150" cy="120" r="2" fill="#FFF" opacity="0.3"/>
    <circle cx="80" cy="180" r="2" fill="#FFF" opacity="0.3"/>
  </g>

  <!-- Transformação para girar e achatar a espiral (Perspectiva 3D) -->
  <g transform="translate(500, 250) scale(1, 0.4) rotate(-30)">
    
    <!-- Braço Espiral 1 -->
    <path d="M 0 0 C 100 -50, 300 0, 400 200 C 500 400, 200 500, 0 450 C -200 400, -300 200, -100 50" 
          fill="none" stroke="url(#spiralArm)" stroke-width="60" filter="url(#gasBlur)" />
          
    <!-- Braço Espiral 2 -->
    <path d="M 0 0 C -100 50, -300 0, -400 -200 C -500 -400, -200 -500, 0 -450 C 200 -400, 300 -200, 100 -50" 
          fill="none" stroke="url(#spiralArm)" stroke-width="60" filter="url(#gasBlur)" />
          
    <!-- Brilho Interno dos braços -->
    <path d="M 0 0 C 80 -40, 200 0, 300 150" fill="none" stroke="#E040FB" stroke-width="20" filter="url(#gasBlur)" opacity="0.7"/>
    <path d="M 0 0 C -80 40, -200 0, -300 -150" fill="none" stroke="#E040FB" stroke-width="20" filter="url(#gasBlur)" opacity="0.7"/>

    <!-- Núcleo da Galáxia -->
    <circle cx="0" cy="0" r="150" fill="url(#galaxyCore)" filter="url(#gasBlur)"/>
  </g>

  <!-- Partículas / Estrelas Sobrepostas (Efeito de Profundidade) -->
  <g fill="#FFFFFF">
    <!-- Tamanhos e opacidades variadas simulando estrelas -->
    <circle cx="480" cy="240" r="2" opacity="1" />
    <circle cx="520" cy="260" r="1.5" opacity="0.9" />
    <circle cx="450" cy="270" r="3" opacity="0.8" filter="url(#gasBlur)"/>
    <circle cx="550" cy="230" r="1" opacity="0.5" />
    <!-- Espalhadas no canvas -->
    <circle cx="200" cy="400" r="1.5" opacity="0.4" />
    <circle cx="800" cy="100" r="1" opacity="0.6" />
    <circle cx="700" cy="400" r="2" opacity="0.3" />
  </g>
</svg>


B) UTILIZAÇÃO COMO IMAGEM MATRICIAL (Fallback Obrigatório)

O SVG criado chega muito perto, mas a imagem 3 possui poeira estelar densa, efeitos de plasma realistas e texturas de milhares de estrelas impossíveis de vetorizar sem queda brutal de FPS. A imagem deve ser utilizada.

Onde deve ser utilizada: Como banner envolvente no topo da rota /metaverse-projects (atrás do título "Crafty Metaverse" e do botão "Invest Now").

Onde procurar (FORA DO DOCUMENTO): Plataformas como Freepik, Shutterstock, ou Adobe Stock.

O Exato Texto de Pesquisa a ser utilizado: "Glowing purple spiral galaxy in deep space with blockchain abstract network connections high resolution".

Forma de Uso (Especificação):
A imagem fotorealista .jpg (comprimida via WebP) deverá ser definida como background-image da seção Hero.
Obrigatório aplicar uma máscara CSS: mask-image: linear-gradient(to bottom, black 50%, transparent 100%); (ou equivalente -webkit-mask-image). Isso garantirá que a base da galáxia faça um fade out (esmaecimento) perfeito em direção à cor de fundo base da aplicação (#22242B), integrando o universo do metaverso ao grid rígido do gerenciador de tarefas sem cortes secos, criando uma percepção de tela imersiva 3D flutuante.