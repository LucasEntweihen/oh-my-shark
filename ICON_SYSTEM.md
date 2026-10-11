    documento: "ICON_SYSTEM.md"
    produto: "Aurora AI"
    versao: "1.0.0"
    idioma: "pt-BR"
    tema: "Ícones de Linha Fluida (Lightbeams) no Modo Escuro"
    objetivo: "Definir a anatomia, geometria, comportamento e implementação da iconografia do sistema"
    dependencia: "DESIGN.md"

# ICON_SYSTEM.md — Aurora AI

## Sistema de Iconografia: A Linguagem de Feixes de Luz

> **Princípio central da Iconografia:** No ecossistema escuro do Aurora AI, um ícone não é um desenho impresso; é um feixe de luz isolado, preciso e momentâneo. Ele orienta sem gritar, informa sem poluir e reage de forma fluida.

Este documento é a Fonte Única de Verdade (SSOT) para a criação, animação e implementação de todos os ícones do Aurora AI. Ele detalha a geometria estrita, as microinterações obrigatórias e as regras de acessibilidade que garantem que a iconografia pareça parte viva do sistema.

* * *

## 1. Tokens de Iconografia (YAML Front Matter Contextual)

    icon_tokens:
      grid:
        viewBox: "0 0 24 24"
        live_area: "20x20"
        safe_zone: "2px"
      sizes:
        sm: "16px"   # Ações inline, metadados
        md: "20px"   # Botões secundários, menus
        base: "24px" # Ações primárias, navegação
        lg: "32px"   # Estados vazios, modais
      geometry:
        stroke_width: "1.5px"
        stroke_linecap: "round"
        stroke_linejoin: "round"
        corner_radius_internal: "2px"
        corner_radius_external: "4px"
      colors:
        default: "var(--texto-secundario)" # #B0B0BA
        hover: "var(--texto-principal)"    # #F2F2F5
        disabled: "var(--texto-terciario)" # #858590
        active: "var(--texto-principal)"
        accent: "currentColor"             # Herda cor semântica do wrapper
      transitions:
        hover_duration: "var(--duracao-rapida)" # 140ms
        morph_duration: "var(--duracao-suave)"  # 360ms

* * *

## 2. Anatomia e Geometria do Ícone

A iconografia do Aurora AI é estritamente linear (Outlined). Formas preenchidas (Solid/Filled) são proibidas, exceto para denotar um estado de "Ativado/Ligado" (Toggle Active) altamente específico, onde o preenchimento deve usar opacidade reduzida.

### 2.1 O Grid Base (24x24)

Todos os ícones devem ser desenhados em um `viewBox="0 0 24 24"`.

* **Área de Segurança (Padding):** Os limites do desenho nunca devem tocar as bordas do viewBox. Deve haver um respiro de `2px` em todos os lados.
* **Live Area:** A arte real deve ocupar o espaço de `20x20px`.
* **Alinhamento:** Formas geométricas básicas (círculos, quadrados) devem ser centralizadas com precisão matemática para evitar *sub-pixel rendering* borrado em monitores de baixa resolução.

### 2.2 Espessura e Terminações (Stroke)

* **Stroke Width:** A espessura oficial da linha é **`1.5px`**. Linhas de `1px` parecem frágeis no modo escuro, e `2px` parecem pesadas demais, competindo com a tipografia. A espessura `1.5px` oferece a exata sensação de "luz contida".
* **Terminações (Caps & Joins):** Obrigatoriamente redondas (`stroke-linecap="round"` e `stroke-linejoin="round"`). Pontas quadradas ou agudas (miter) são antagônicas à sensação de "conforto" exigida no `DESIGN.md`.

### 2.3 Curvaturas

Sempre que possível, ângulos de 90 graus devem ter um raio de arredondamento.

* Raios externos de caixas/contêineres no ícone: `3px` a `4px`.
* Raios internos: `1px` a `2px`.

* * *

## 3. Comportamento e Cores

Ícones nunca devem possuir códigos de cor hexadecimais embutidos no código SVG (hardcoded). O preenchimento/traço deve ser sempre `currentColor`.

### 3.1 Estados de Interação

1. **Repouso (Default):** O ícone assume a cor `--texto-secundario` (`#B0B0BA`). Ele repousa de forma calma na superfície `#121216`.
2. **Foco/Hover:** O ícone transiciona para `--texto-principal` (`#F2F2F5`) em 140ms (`var(--duracao-rapida)`). A iluminação do ícone aumenta, chamando para a ação.
3. **Desabilitado (Disabled):** O ícone cai para `--texto-terciario` (`#858590`) e a opacidade do elemento pai pode ser reduzida.
4. **Estado Crítico/Semântico:** Ao acionar uma ação destrutiva ou de atenção, o wrapper do ícone altera a cor (ex: `text-red-400`), e o ícone herda essa cor através do `currentColor`.

### 3.2 O Espectro no Ícone

Ícones comuns de UI *nunca* devem ser desenhados usando o gradiente do espectro Aurora (`--espectro-aurora`). O arco-íris é reservado para o "Núcleo da IA" e estados de processamento. Ícones de ações humanas (copiar, editar, excluir) são sempre monocromáticos.

* * *

## 4. Animações e Microinterações (Morphing)

Este é o diferencial técnico do Aurora AI. Ícones não mudam simplesmente de estado trocando o SVG; eles *morforizam* (morphing) suas geometrias para comunicar a transição de forma orgânica.

### 4.1 A Transição Enviar / Parar (Exigência do DESIGN.md)

Quando o usuário envia uma mensagem, o ícone de "Seta de Envio" (Paperplane/Arrow) se transforma no ícone de "Parar Processamento" (Square).

**Regras para o Morphing:**

* Ambos os ícones devem ter o *mesmo número de âncoras* (pontos no path) se for usada uma animação nativa de SVG, ou utilizar Framer Motion com interpoladores de path.
* **Curva de Animação:** `var(--movimento-elastico)` (`cubic-bezier(0.175, 0.885, 0.32, 1.275)`).
* **Duração:** `360ms` (`var(--duracao-suave)`).

**Exemplo de Implementação com Framer Motion (`SendToStopIcon.tsx`):**

    import { motion } from "framer-motion";
    
    const sendPath = "M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"; // Seta estilizada
    const stopPath = "M6 6H18V18H6V6Z"; // Quadrado perfeito
    
    export const SendToStopIcon = ({ isGenerating }) => {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
             strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <motion.path
            animate={{ d: isGenerating ? stopPath : sendPath }}
            transition={{ duration: 0.36, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </svg>
      );
    };

### 4.2 Feedback Tátil (Scale)

Todo ícone contido em um botão deve ter um efeito sutil de `scale(0.95)` durante o estado `:active` (quando clicado/pressionado), criando a sensação física de pressionar um botão de baixo perfil, acompanhado de uma transição muito rápida de `50ms`.

* * *

## 5. Estrutura Semântica e Categorias

Para facilitar o uso e a escalabilidade, o sistema de ícones é dividido em 4 categorias lógicas. Desenvolvedores devem buscar os ícones por essas nomenclaturas:

1. **Ação (Action):** `Send`, `Copy`, `Edit`, `Delete`, `Refresh`, `Stop`, `Plus`. Representam ações diretas do usuário.
2. **Navegação (Navigation):** `ChevronLeft`, `ChevronRight`, `ArrowUp`, `Menu`, `Close`. Orientam a movimentação na interface.
3. **Estado & Feedback (State):** `Check`, `AlertCircle`, `Info`, `Lock`. Ícones que comunicam contexto, geralmente acompanhados de cor semântica.
4. **Aurora Especial (AI Core):** `Sparkles`, `Brain`, `Nodes`. Ícones associados ao raciocínio da IA. São os únicos permitidos a terem animações de "Glow" ou respiração sutil constante.

* * *

## 6. Acessibilidade (A11y) Exigida

Ícones vazios de significado semântico são barreiras para tecnologias assistivas. O Aurora AI é rigoroso com o WCAG.

### 6.1 Ícones Decorativos

Se o ícone estiver ao lado de um texto claro (Ex: Um botão que diz `[Ícone Lixeira] Excluir Conversa`), o ícone é considerado **puramente decorativo**.

* **Obrigatório:** Adicionar `aria-hidden="true"` e `focusable="false"` no `<svg>`.

### 6.2 Ícones Interativos (Standalone)

Se o botão for composto *apenas* pelo ícone (Ex: Botão de configurações no topo), ele deve ser inserido de maneira que a tecnologia assistiva compreenda a ação.

* **Obrigatório:** O botão (`<button>`) que envolve o ícone deve ter uma `aria-label` clara e em português, ou usar um elemento filho `<span class="sr-only">`.

**Exemplo correto:**

    <button 
      className="p-2 text-texto-secundario hover:text-texto-principal transition-colors rounded-12px"
      aria-label="Copiar resposta da inteligência artificial"
    >
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" ...>
         <!-- path -->
      </svg>
    </button>

* * *

## 7. Arquitetura de Componentes React

Não use dezenas de bibliotecas de ícones ou cole imagens estáticas.

1. **Biblioteca Padrão Recomendada:** Lucide React (lucide-react). Seus ícones seguem perfeitamente os requisitos deste documento (1.5px, caps round).
2. **Wrapper de Ícone (IconWrapper.tsx):** Crie um componente que padronize o tamanho e a espessura para garantir que ninguém importe um ícone com `stroke-width="2"` acidentalmente.

    // Exemplo de abstração do sistema no React
    import { LucideIcon } from 'lucide-react';
    
    interface IconProps {
      icon: LucideIcon;
      size?: 'sm' | 'md' | 'base' | 'lg';
      className?: string;
    }
    
    const sizeMap = { sm: 16, md: 20, base: 24, lg: 32 };
    
    export function Icon({ icon: IconComponent, size = 'base', className }: IconProps) {
      return (
        <IconComponent 
          size={sizeMap[size]} 
          strokeWidth={1.5} 
          className={`text-currentColor shrink-0 ${className}`} 
          aria-hidden="true"
        />
      );
    }

* * *

## 8. Do's and Don'ts (Guia Definitivo)

### O que fazer (Do):

* **Faça** com que o ícone acompanhe a cor do texto ao qual pertence.
* **Faça** o alinhamento central (Optical Alignment) se o centro de massa do ícone for assimétrico (como o ícone de 'Play').
* **Faça** uso de `stroke-linejoin="round"` para evitar arestas "espetadas" que pareçam agressivas no tema escuro.
* **Faça** ícones que representem conceitos de I.A. parecerem etéreos (usando estrelas de 4 pontas ou nós brilhantes), evitando ilustrações humanizadas complexas de "cérebros brilhantes".

### O que NÃO fazer (Don't):

* **Não** preencha os ícones com cores sólidas para criar peso visual. Confie no contraste do modo escuro.
* **Não** exporte SVGs do Figma que contenham `<filter>`, `<drop-shadow>` ou `<mask>` se não forem os SVGs complexos de topografia do *Aurora Core*. Ícones de UI devem ser puros e matemáticos.
* **Não** modifique o tamanho do ícone redimensionando o `<svg>` livremente no CSS (ex: `width: 50%`). Use as classes base predefinidas (`w-4`, `w-5`, `w-6`, `w-8`).
* **Não** use ícones com múltiplas cores (multicolor icons) na interface geral.

* * *

## Conclusão da Implementação de Ícones

A iconografia do Aurora AI é tratada como tipografia: matemática, padronizada e invisível até ser necessária. Qualquer novo ícone adicionado ao sistema deve ser testado sobre a cor `--cor-superficie` (`#121216`) e verificar se a espessura de 1.5px não se perde visualmente. O foco é a leitura rápida (Scanability) sem forçar os olhos.