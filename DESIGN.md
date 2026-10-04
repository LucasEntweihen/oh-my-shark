# Documento de Design e Especificação de UI/UX: Oh My Shark 🦈

Este documento (`DESIGN.md`) define a arquitetura visual, estrutural e interativa da plataforma **Oh My Shark**, um ecossistema avançado de IAs agênticas. O foco principal deste design é a **responsividade absoluta e fluidez em TODOS os tipos de desktop** (resoluções clássicas, Full HD, 4K e Ultrawide), integrando nativamente o sistema **Bible Strong Avatar App**.

* * *

## 1. Identidade Visual e Sistema de Cores

A identidade visual reflete o conceito de "Oceano de Dados" (profundidade, conhecimento) aliado à "Agência da IA" (velocidade, precisão, neon).

### 1.1. Paleta de Cores (Dark Mode Nativo)

* **Fundo Principal (Deep Ocean):** `#0B0F19` - Usado no *background* principal. Reduz o cansaço visual em sessões longas.
* **Fundo Secundário (Shark Skin):** `#1A2235` - Usado em painéis, *cards*, barra lateral e áreas de chat. Cria hierarquia sem alto contraste que agrida os olhos.
* **Cor Primária (Neon Cyan):** `#00F0FF` - Usada em botões de ação primária (CTAs), indicadores de IAs ativas e *links* em *hover*. Representa a "inteligência elétrica".
* **Cor Secundária (Abyssal Purple):** `#8A2BE2` - Usada em elementos secundários, bordas de foco e para diferenciar módulos específicos (como o Bible Avatar).
* **Texto Principal:** `#E2E8F0` - Branco levemente acinzentado para leitura confortável.
* **Texto Secundário (Muted):** `#94A3B8` - Para *placeholders*, datas, e textos de apoio.
* **Cores de Status (Agentes):**
  * 🟢 *Executando:* `#10B981` (Emerald)
  * 🟡 *Pensando/Processando:* `#F59E0B` (Amber)
  * 🔴 *Erro/Alerta:* `#EF4444` (Red)

### 1.2. Tipografia

* **Títulos e Cabeçalhos:** `Space Grotesk`, sans-serif. Transmite uma sensação tecnológica e moderna.
* **Corpo de Texto (Chat e Documentos):** `Inter`, sans-serif. Altamente legível em diferentes tamanhos de tela e resoluções.
* **Código e Termos Técnicos:** `JetBrains Mono`, monospace. Para blocos de código gerados pela IA ou referências técnicas.

* * *

## 2. Estrutura de Layout e Adaptação para Desktops

Para garantir que a interface funcione em **todos os tipos de desktop**, utilizaremos um sistema de *CSS Grid* e *Flexbox* altamente fluido, com larguras máximas (`max-width`) bem definidas para evitar que a interface fique esticada em telas Ultrawide.

### 2.1. O Grid Principal (App Shell)

O layout é dividido em 3 colunas principais na visualização padrão:

1. **Sidebar Esquerda (Navegação & Gerenciamento de IAs):**
  * *Largura Fixa/Flexível:* 280px (recolhível para 64px).
  * *Comportamento:* Fica ancorada à esquerda.
2. **Área Central (Workspace / Chat Agêntico):**
  * *Largura Flexível:* Ocupa o espaço restante (`flex: 1`).
  * *Comportamento:* Em monitores muito largos (> 2560px), esta área terá um `max-width` de 1200px e será centralizada, evitando linhas de texto excessivamente longas.
3. **Painel Direito (Contexto, Inspetor e Módulos Específicos):**
  * *Largura Flexível:* 350px (expansível até 500px).
  * *Comportamento:* Onde os detalhes da execução da IA e o **Bible Strong Avatar** serão renderizados.

### 2.2. Breakpoints de Desktop (Media Queries)

* **Pequenos (Laptops antigos, 1366x768):** O Painel Direito é transformado em uma aba sobreposta (Drawer) para não espremer a Área Central. O texto base é ajustado para 14px.
* **Padrão (Full HD, 1920x1080):** Layout em 3 colunas totalmente visível. Texto base em 16px.
* **Grandes (Monitores 2K/4K):** Interface escala proporcionalmente (escalabilidade de UI via `rem`). Margens laterais (Letterboxing) são aplicadas à Área Central para manter a ergonomia visual.
* **Ultrawide (21:9 ou 32:9):** O grid principal não estica infinitamente. A área útil total é travada em `max-width: 2560px` e centralizada na tela com fundo escuro expansivo ao redor.

* * *

## 3. Disposição de Elementos: Detalhamento Ultra Profundo

### 3.1. Header (Cabeçalho de Controle)

Localizado no topo da Área Central e do Painel Direito (altura de 64px, borda inferior de 1px sólida em `#2A3245`).

* **Esquerda:** Título da Sessão atual e seletor de "Modo de Agência" (Ex: *Research Mode*, *Code Mode*, *Bible Mode*).
* **Centro:** Indicador de status global ("3 Agentes Ativos - Consumo: 45 t/s").
* **Direita:** Controles de visualização (alternar painéis), configurações da conta e avatar do usuário.

### 3.2. Área Central (Workspace de Interação Agêntica)

A interface onde a mágica acontece. Não é apenas um "chat", é um ambiente de colaboração com a IA.

* **Histórico de Mensagens:**
  * Fundo transparente. Cada mensagem da IA está contida em um card sutilmente destacado (fundo `#1A2235`, borda esquerda arredondada, sombra suave de `0 4px 6px rgba(0,0,0,0.3)`).
  * **Árvore de Pensamento (Chain of Thought):** Antes da resposta final, a IA exibe blocos expansíveis ("Planejando passos...", "Buscando referências..."). O usuário pode clicar para ver o log de execução do agente.
* **Input Area (Comando Base):**
  * Localizada na parte inferior.
  * Caixa de texto expansível dinamicamente.
  * Botões internos: Anexar arquivo, Chamar Agente Específico (usando `@`), Alternar Microfone.
  * Borda ao receber foco: Brilho neon `#00F0FF` com transição suave de `0.3s ease-in-out`.

* * *

## 4. Integração do Bible Strong Avatar App

O módulo *Bible Strong Avatar App* é uma das principais instâncias de uso especializado dentro do Oh My Shark. Ele é ativado quando o usuário seleciona o modo de estudo teológico/lexicográfico.

### 4.1. Layout do Módulo Bible Avatar

A tela se reconfigura para acomodar este sistema:

* **Painel Direito (O Avatar):**
  * Em vez de exibir metadados padrão, o Painel Direito hospeda a **Interface do Avatar**.
  * Renderização WebGL/Canvas do Avatar 3D (ou 2D animado) na parte superior do painel (quadro de 350x350px).
  * O Avatar reage em tempo real (lipsync, expressões faciais) enquanto a IA agêntica explica os conceitos.
* **Área Central (O Texto Sagrado e Dicionário Strong):**
  * A área de chat se transforma em um layout de leitura em **Duas Colunas Ocultas** (ou Split-Screen).
  * *Coluna 1:* O texto bíblico principal em navegação contínua.
  * *Coluna 2:* Quando uma palavra com numeração de Strong é clicada, uma janela lateral desliza (dentro da Área Central) exibindo as raízes no Hebraico/Grego, transliteração, pronúncia em áudio e árvore etimológica.
* **Interação Agêntica:** O usuário pode dizer ou digitar: *"Analise o termo 'Ágape' em 1 Coríntios 13 em relação aos estóicos"*. A IA (representada pelo Avatar) processará a informação, cruzará referências no repositório de dicionários anexado, e narrará/explicará a resposta enquanto o texto se destaca na Área Central.

### 4.2. Estilo Específico do Módulo Bible

* Para diferenciar o modo padrão de tecnologia do modo teológico, as cores de destaque neste módulo mudam sutilmente do Neon Cyan para um **Ouro Envelhecido (Aged Gold - `#D4AF37`)** e **Papiro Escuro (`#2C2518`)** para elementos de citação de textos originais, mantendo a harmonia com o Dark Mode principal.

* * *

## 5. Micro-Interações e Acessibilidade

* **Hover States (Passar o mouse):** Botões e cards apresentam uma leve elevação (transform: `translateY(-2px)`) e alteração de brilho na borda, fornecendo feedback tátil e visual claro sobre elementos clicáveis, essencial para a experiência em desktop com mouse.
* **Animações:** Transições suaves (`200ms` a `300ms`) em aberturas de menus, envios de mensagens e expansão de painéis. O Avatar possui animações de respiração (idle) contínuas para não parecer estático.
* **Foco pelo Teclado:** Navegação total via `Tab`, garantindo que usuários de desktop que preferem atalhos de teclado possam operar toda a plataforma de agentes sem encostar no mouse.

## 6. Conclusão da Especificação

O design do *Oh My Shark* foi concebido para ser uma ferramenta de *power-user*. A interface evita o minimalismo excessivo que esconde funções vitais, optando por um **funcionalismo estético altamente organizado**. A integração do módulo *Bible Strong Avatar* demonstra a flexibilidade do grid e da arquitetura, provando que a plataforma pode abrigar desde agentes de código até assistentes acadêmicos interativos com representação visual avançada.