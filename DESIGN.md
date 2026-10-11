    documento: "DESIGN.md"
    produto: "Aurora AI"
    versao: "2.0.0"
    idioma: "pt-BR"
    tema: "Modo escuro com espectro cromático dinâmico"
    objetivo: "Definir a experiência, a linguagem visual e os critérios de implementação do chatbot"

# DESIGN.md — Aurora AI

## Sistema de design para um chatbot confortável, claro e visualmente singular

> **Princípio central:** a interface deve desaparecer quando o usuário estiver pensando e se tornar perceptível apenas quando puder ajudá-lo. Cor, movimento e profundidade existem para orientar — nunca para competir com a conversa.

Este documento é a referência principal para designers, desenvolvedores e agentes de programação que trabalhem no Aurora AI. Ele descreve a experiência pretendida, as regras visuais, os componentes, os estados, as animações, a acessibilidade, a responsividade e os critérios para considerar a implementação concluída.

O produto deve ser **100% em português do Brasil**, incluindo textos da interface, mensagens de estado, configurações, erros, dicas, acessibilidade e documentação visível ao usuário. Nomes técnicos de bibliotecas e identificadores de código podem permanecer em inglês quando isso for padrão do ecossistema, mas não devem aparecer na interface sem necessidade.

* * *

# 1. Visão do produto

O Aurora AI é um chatbot que combina **conforto cognitivo, clareza e personalidade visual**. A experiência não deve parecer uma cópia de mensageiros conhecidos nem mais um painel genérico de inteligência artificial. Sua identidade vem do contraste entre uma base escura, superfícies discretas e um espectro de cores inspirado na luz visível.

A interface deve transmitir três sensações:

1. **Calma:** o fundo escuro reduz distrações e cria um espaço visual estável.
2. **Clareza:** cada controle tem uma função compreensível, cada estado é comunicado e o conteúdo é fácil de acompanhar.
3. **Vitalidade:** o espectro cromático e as animações sutis dão identidade ao produto sem transformar a tela em um espetáculo permanente.

O diferencial não é simplesmente “ter animações”. É usar movimento e cor para fazer a interface parecer responsiva, viva e cuidadosa, enquanto permanece previsível, rápida e confortável.

## 1.1 Objetivos

* Criar uma experiência de conversa confortável em sessões curtas ou longas.
* Tornar o campo de mensagem o principal ponto de entrada, sem esconder funções essenciais.
* Comunicar claramente quando a IA está aguardando, processando, respondendo ou encontrou um erro.
* Usar o espectro arco-íris como assinatura visual, não como decoração indiscriminada.
* Fazer com que a interface funcione com mouse, teclado, toque e tecnologias assistivas.
* Manter desempenho consistente em computadores e celulares, inclusive em dispositivos modestos.
* Estabelecer regras específicas o bastante para que diferentes implementações preservem a mesma identidade.

## 1.2 O que o produto não deve ser

* Não deve usar o visual padrão de “IA futurista” com fundo roxo, neon azul e cartões genéricos.
* Não deve depender de brilhos intensos, partículas constantes ou gradientes em todos os elementos.
* Não deve esconder navegação, histórico ou configurações essenciais atrás de interações exclusivas de mouse.
* Não deve animar cada letra de cada mensagem em qualquer circunstância.
* Não deve sacrificar legibilidade, acessibilidade ou velocidade em nome do impacto visual.
* Não deve sugerir que a IA está pensando de forma humana ou revelar raciocínio interno. Os estados de processamento são sinais de interface, não afirmações sobre consciência.

* * *

# 2. Princípios de experiência

## 2.1 Clareza antes de ornamentação

Toda escolha visual deve responder a uma pergunta: **isso ajuda o usuário a entender, localizar, decidir ou acompanhar alguma coisa?** Se não ajudar, deve ser removida ou reduzida.

Use hierarquia tipográfica, espaçamento e agrupamento para organizar o conteúdo. Não dependa apenas de cor para diferenciar ações ou estados.

## 2.2 Uma ação principal por contexto

Na tela inicial, a ação principal é escrever uma mensagem. Durante uma conversa, o foco é ler a resposta e decidir o próximo passo. Ações secundárias, como anexar arquivos, consultar o histórico ou abrir configurações, devem estar disponíveis sem disputar atenção com o campo de mensagem.

A Lei de Hick é uma referência útil: reduzir escolhas simultâneas pode facilitar decisões. Isso não significa esconder opções necessárias; significa organizá-las em grupos claros.

## 2.3 Movimento com significado

Cada animação deve cumprir ao menos uma função:

* **Orientar:** indicar onde uma mensagem nova apareceu.
* **Confirmar:** mostrar que uma ação foi aceita.
* **Explicar:** tornar perceptível que uma resposta está sendo preparada.
* **Conectar:** suavizar a mudança entre dois estados da interface.
* **Personalizar:** reforçar a identidade do Aurora sem interromper o fluxo.

Movimentos sem propósito devem ser evitados. Nenhuma animação essencial pode impedir o usuário de interagir.

## 2.4 A interface respeita o ritmo do usuário

Não force rolagem automática se a pessoa estiver lendo mensagens anteriores. Não mova o campo de texto de forma inesperada. Não faça o espectro piscar para chamar atenção. O produto deve acompanhar o usuário, não exigir que ele acompanhe a interface.

## 2.5 Cor como linguagem

O espectro identifica a personalidade do Aurora e ajuda a comunicar estados. Cada cor deve manter contraste suficiente e não ser a única maneira de transmitir uma informação. Estados importantes também precisam de texto, ícone ou forma.

* * *

# 3. Direção de arte

## 3.1 Conceito: “luz sobre veludo”

A base visual é escura, neutra e levemente aquecida. Sobre ela, o espectro aparece como uma refração luminosa: uma linha, um contorno, um pequeno núcleo ou uma área de luz difusa. O resultado deve parecer deliberado e refinado, não um fundo de tela gamer.

A interface combina:

* superfícies quase pretas com pequenas diferenças de luminosidade;
* tipografia clara, mas não branca absoluta;
* bordas finas e discretas;
* sombras profundas e controladas;
* pontos de cor com função clara;
* textura granulada muito sutil apenas nos elementos de identidade;
* animações suaves, curtas e interrompíveis.

## 3.2 Referências de sensação

A experiência deve lembrar um ambiente silencioso e bem iluminado para trabalhar: escuro, acolhedor e preciso. A metáfora da aurora deve aparecer na transição de cores e no movimento lento da luz, não em ilustrações literais de céu, estrelas ou paisagens.

## 3.3 Composição

A composição precisa criar espaço para o conteúdo. A área da conversa deve ser a região mais importante da tela. O espectro aparece como assinatura ao redor do núcleo da IA, em estados ativos e em detalhes pontuais. Não aplicar um arco-íris completo a todos os botões, títulos ou cartões.

* * *

# 4. Tokens de design

Os tokens são a fonte única de verdade para cores, tipografia, espaçamento, bordas, sombras e movimento. Implementações devem reutilizá-los em vez de criar valores isolados sem justificativa.

## 4.1 Cores

| Token | Valor | Uso |
| --- | --- | --- |
| `--cor-fundo` | `#0A0A0C` | Fundo principal |
| `--cor-superficie` | `#121216` | Área da conversa e painéis |
| `--cor-superficie-elevada` | `#19191F` | Menus, popovers e cartões elevados |
| `--cor-campo` | `#1A1A20` | Campo de mensagem |
| `--cor-borda` | `rgba(255,255,255,.09)` | Separadores e contornos discretos |
| `--cor-borda-foco` | `#A5B4FC` | Foco visível de teclado |
| `--texto-principal` | `#F2F2F5` | Texto principal |
| `--texto-secundario` | `#B0B0BA` | Metadados e texto de apoio |
| `--texto-terciario` | `#858590` | Dicas e rótulos menos importantes |
| `--texto-placeholder` | `#85858F` | Texto de exemplo no campo |
| `--cor-usuario` | `#27272A` | Superfície da mensagem do usuário |
| `--cor-sucesso` | `#34D399` | Confirmação e conclusão |
| `--cor-aviso` | `#FBBF24` | Atenção não crítica |
| `--cor-erro` | `#FB7185` | Erros e ações destrutivas |
| `--espectro-violeta` | `#A78BFA` | Espectro |
| `--espectro-azul` | `#60A5FA` | Espectro |
| `--espectro-ciano` | `#22D3EE` | Espectro |
| `--espectro-verde` | `#34D399` | Espectro |
| `--espectro-amarelo` | `#FCD34D` | Espectro |
| `--espectro-laranja` | `#FB923C` | Espectro |
| `--espectro-vermelho` | `#FB7185` | Espectro |

Os tons do espectro acima são cores de acento. Para textos pequenos, prefira os tokens de texto; não use automaticamente as cores mais vivas do espectro em parágrafos longos.

### Gradiente de assinatura

    :root {
      --espectro-aurora: linear-gradient(
        115deg,
        #A78BFA 0%,
        #60A5FA 18%,
        #22D3EE 34%,
        #34D399 50%,
        #FCD34D 67%,
        #FB923C 82%,
        #FB7185 100%
      );
    }

O gradiente é aplicado principalmente a bordas especiais, ao núcleo visual do Aurora e a pequenos detalhes de estado. Não deve ser usado como fundo de grandes áreas com texto.

## 4.2 Contraste e uso seguro de cores

* Texto normal deve buscar contraste mínimo de 4,5:1 em relação ao fundo.
* Texto grande e componentes gráficos essenciais devem buscar ao menos 3:1.
* O espectro não substitui rótulos, ícones ou mensagens de estado.
* Não use texto fino sobre regiões coloridas em movimento.
* Se o contraste não puder ser garantido sobre um gradiente, coloque o texto em uma superfície sólida.
* Verifique contraste com as cores reais renderizadas, não apenas com os valores teóricos.

Esses valores são metas de implementação a validar; não declare conformidade sem testar os componentes reais.

## 4.3 Tipografia

**Família principal:** Inter, com alternativas `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI` e `sans-serif`.

**Família monoespaçada:** JetBrains Mono, com alternativa `ui-monospace`, `SFMono-Regular`, `Consolas` e `monospace`.

| Token | Tamanho | Aplicação |
| --- | --- | --- |
| `--texto-muito-grande` | `2.5rem` | Boas-vindas em telas amplas |
| `--texto-titulo` | `1.75rem` | Títulos de seção |
| `--texto-subtitulo` | `1.25rem` | Títulos menores |
| `--texto-destaque` | `1.125rem` | Introduções e chamadas |
| `--texto-corpo` | `1rem` | Conversa e controles |
| `--texto-legenda` | `.875rem` | Horários, dicas e metadados |
| `--texto-minimo` | `.8125rem` | Metadados compactos, quando necessário |

Regras:

* Texto de conversa com altura de linha entre `1.6` e `1.75`.
* Controles com altura de linha entre `1.35` e `1.5`.
* Pesos principais: `400`, `500`, `600` e `700`.
* Não use caixa alta em frases longas.
* Permita zoom de texto sem quebrar a interface.
* Evite linhas excessivamente largas; a coluna de leitura deve ficar entre aproximadamente 60 e 80 caracteres quando possível.

## 4.4 Espaçamento

Use uma escala consistente baseada em múltiplos de 4 px.

| Token | Valor | Uso típico |
| --- | --- | --- |
| `--espaco-1` | `4px` | Ajustes mínimos |
| `--espaco-2` | `8px` | Ícone e rótulo |
| `--espaco-3` | `12px` | Espaçamento interno compacto |
| `--espaco-4` | `16px` | Padding padrão |
| `--espaco-6` | `24px` | Separação entre blocos |
| `--espaco-8` | `32px` | Separação entre grupos |
| `--espaco-12` | `48px` | Respiro em áreas principais |
| `--espaco-16` | `64px` | Composição de tela inicial |

Evite valores arbitrários quando um token existente atender à necessidade.

## 4.5 Bordas, raios e profundidade

| Elemento | Raio recomendado |
| --- | --- |
| Campo de mensagem | `24px` a `30px` |
| Mensagem do usuário | `20px 4px 20px 20px` |
| Cartão | `20px` |
| Menu e popover | `16px` |
| Botão pequeno | `12px` |
| Núcleo do Aurora | `50%` |

A profundidade vem de camadas tonais, bordas discretas e sombras. Não aplique sombras pesadas em cada elemento.

    .superficie-elevada {
      background: #19191F;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow:
        0 2px 4px rgba(0, 0, 0, 0.22),
        0 12px 32px rgba(0, 0, 0, 0.24),
        inset 0 1px 0 rgba(255, 255, 255, 0.035);
    }

## 4.6 Movimento

| Token | Duração | Uso |
| --- | --- | --- |
| `--duracao-rapida` | `140ms` | Hover e feedback simples |
| `--duracao-padrao` | `220ms` | Abertura de menus e botões |
| `--duracao-suave` | `360ms` | Entrada de blocos |
| `--duracao-longa` | `600ms` | Transições de composição |
| `--duracao-ambiente` | `4000ms` | Movimento decorativo lento |

Curvas:

    :root {
      --movimento-preciso: cubic-bezier(0.2, 0, 0, 1);
      --movimento-elastico: cubic-bezier(0.175, 0.885, 0.32, 1.275);
      --movimento-suave: cubic-bezier(0.25, 0.1, 0.25, 1);
    }

Movimentos elásticos devem ser raros e pequenos. Para ações cotidianas, prefira curvas suaves e previsíveis.

* * *

# 5. Arquitetura da tela

## 5.1 Estrutura principal

A experiência é uma aplicação de página única, com regiões claras:

1. **Barra superior:** identidade Aurora, nome da conversa e acesso a ações essenciais.
2. **Área de conversa:** mensagens, respostas, anexos e estados.
3. **Área de composição:** campo de texto e ferramentas para enviar conteúdo.
4. **Navegação lateral opcional:** histórico e conversas, recolhível em telas pequenas.
5. **Camadas contextuais:** menus, configurações, avisos e diálogos.

A barra superior não deve desaparecer de forma imprevisível. Em telas com pouco espaço, pode reduzir sua altura durante a rolagem, desde que os controles continuem localizáveis e acessíveis.

## 5.2 Tela inicial sem mensagens

A tela inicial deve orientar sem sobrecarregar:

* núcleo visual do Aurora em tamanho moderado;
* título curto, em português, como **“O que vamos explorar hoje?”**;
* explicação opcional de uma linha;
* campo de mensagem como elemento de maior destaque;
* sugestões de início opcionais, curtas e removíveis.

As sugestões devem ajudar a começar, não parecer anúncios ou atalhos obrigatórios. Limite a quantidade visível a três ou quatro.

## 5.3 Conversa em andamento

* A coluna de conversa deve ter largura máxima de aproximadamente `800px`, ajustável ao tipo de conteúdo.
* Mensagens da IA são blocos de leitura sem uma bolha pesada.
* Mensagens do usuário ficam em uma superfície cinza discreta para distinguir entrada de resposta.
* Todas as mensagens permanecem em uma ordem linear, com autoria claramente indicada por ícone, rótulo acessível ou estrutura semântica.
* Evite alinhar tudo à direita ou depender apenas de cor para distinguir autores.
* Use divisões de grupo e espaço vertical para separar mensagens sem criar uma sequência de cartões.

## 5.4 Barra superior

A barra superior contém, conforme o contexto:

* símbolo do Aurora;
* nome da conversa;
* botão para nova conversa;
* acesso ao histórico, quando houver navegação lateral;
* menu de configurações;
* menu de opções da conversa.

Não esconda ações importantes apenas em `hover`. Em dispositivos de toque, os controles devem estar visíveis ou acessíveis por um botão explícito.

## 5.5 Campo de mensagem

O campo é um dos componentes centrais do produto.

* Altura inicial mínima de `56px`.
* Crescimento automático conforme o texto, com limite recomendado de `200px`; depois disso, o conteúdo pode rolar dentro do campo.
* Texto com tamanho legível, placeholder com contraste adequado e padding confortável.
* Envio pelo botão e, opcionalmente, por `Enter`, com `Shift + Enter` para nova linha. Essa regra deve ser explicada em uma dica discreta e respeitar configurações do usuário.
* O botão de envio só fica habilitado quando há conteúdo válido ou um anexo pronto.
* Durante a geração, o botão pode assumir a função **“Parar resposta”**, mantendo um ícone e um rótulo acessível claros.
* O botão de anexar, se existir, deve explicar os formatos aceitos.
* Não apague o texto do usuário se o envio falhar.

O campo deve manter um foco visual nítido, sem exigir que a pessoa perceba um brilho sutil para saber onde está digitando.

## 5.6 Mensagens e ações

Cada resposta da IA pode incluir ações contextuais como copiar, avaliar, regenerar ou continuar. Elas aparecem em uma área discreta e devem ter rótulos acessíveis.

As ações secundárias podem surgir ao focar ou passar o mouse sobre a mensagem, mas também precisam ser alcançáveis por teclado e toque. Não esconda funções essenciais em interações de hover.

Mensagens longas devem suportar:

* títulos e subtítulos;
* listas;
* links;
* blocos de código com botão de copiar;
* tabelas responsivas;
* citações;
* avisos e observações;
* estados de erro legíveis.

O estilo do conteúdo deve privilegiar leitura e hierarquia sem criar uma “caixa” para cada parágrafo.

* * *

# 6. Identidade cromática e núcleo Aurora

## 6.1 O núcleo visual

O núcleo Aurora é o principal elemento de reconhecimento da IA. Ele pode ser representado por uma forma fluida, circular ou levemente orgânica, preenchida pelo espectro e com volume luminoso discreto.

Requisitos:

* deve permanecer legível em tamanhos pequenos;
* não pode depender de detalhes muito finos;
* não deve ocupar espaço excessivo na conversa;
* deve ter uma versão estática para baixo desempenho e movimento reduzido;
* deve manter uma silhueta reconhecível mesmo sem animação;
* não deve parecer um rosto humano ou sugerir emoções que o sistema não pode garantir.

## 6.2 Estados visuais do núcleo

| Estado | Tratamento |
| --- | --- |
| Ocioso | Espectro estável, brilho muito leve |
| Campo focado | Pequeno aumento de luminosidade, sem pulsação intensa |
| Processando | Ondulação lenta ou deslocamento interno do gradiente |
| Respondendo | Pulso suave sincronizado com o início da resposta |
| Concluído | Um breve brilho que retorna ao estado ocioso |
| Erro | Acento de erro separado do espectro, acompanhado de mensagem |
| Movimento reduzido | Forma estática com transições mínimas |

A cor nunca deve ser o único indicador de estado. A interface também apresenta texto, ícone ou anúncio acessível.

## 6.3 Textura e ruído

O ruído visual é opcional e deve ser muito sutil. Ele pode dar textura ao núcleo, mas não deve ser aplicado a grandes superfícies, texto ou controles. Se a textura reduzir a nitidez ou aumentar o custo de renderização, deve ser removida.

* * *

# 7. Sistema de animações

As animações abaixo definem a personalidade do produto. Elas devem parecer surpreendentemente cuidadosas, mas continuar discretas o suficiente para uso diário. “Impactante” significa uma transição bem resolvida e memorável — não movimento constante ou exagerado.

## 7.1 Respiração do espectro

**Objetivo:** indicar atividade sem recorrer a um indicador de carregamento agressivo.

Comportamento:

* um brilho difuso aparece próximo ao núcleo ou à resposta em andamento;
* a opacidade varia lentamente;
* a escala muda muito pouco;
* a animação não altera o layout nem desloca o texto;
* o efeito termina assim que o estado de processamento muda.

Não usar grandes halos que cubram o conteúdo ou causem desconforto. O brilho deve ser percebido de forma periférica.

## 7.2 Revelação progressiva da resposta

A resposta pode aparecer progressivamente, em pequenos blocos de texto, para transmitir continuidade. Evite animar cada caractere de forma independente como regra geral: isso pode prejudicar a leitura, a seleção de texto, a acessibilidade e o desempenho.

Recomendação:

* revelar por blocos ou pequenos segmentos;
* usar deslocamento vertical máximo de `4px`;
* limitar a duração da entrada de cada bloco;
* não atrasar conteúdo importante artificialmente;
* permitir que o texto seja selecionado e lido por leitores de tela durante a geração;
* ao receber muito texto, priorizar a exibição imediata em vez de manter uma animação longa.

## 7.3 Transformação do botão de envio

Ao iniciar uma resposta, o botão de envio pode se transformar no controle de interrupção. A mudança deve usar transição de opacidade, escala leve ou transformação de ícone, sem deformação exagerada.

* Antes do envio: ícone de enviar.
* Durante a geração: ícone de parar.
* Ao terminar: retorno ao estado de envio.
* O rótulo acessível deve refletir sempre a ação atual.
* O botão não deve mudar de posição nem de tamanho de forma inesperada.

## 7.4 Entrada de mensagens

Novas mensagens entram com opacidade progressiva e deslocamento curto. A animação deve ser rápida o bastante para não fazer a pessoa esperar. Mensagens anteriores não devem reanimar a cada renderização.

## 7.5 Foco no campo de mensagem

Quando o campo recebe foco, a borda fica mais nítida e o espectro pode aparecer como um traço estreito. Não fazer o campo pulsar continuamente enquanto a pessoa digita.

## 7.6 Menus e painéis

Menus e painéis podem surgir com opacidade e deslocamento de `4px` a `8px`. Eles devem abrir próximos ao controle que os acionou, manter foco adequado e fechar com `Escape` quando aplicável.

## 7.7 Retorno ao fim da conversa

Se a pessoa rolar para cima, não forçar o retorno automático ao final. Exiba um controle discreto **“Ir para a mensagem mais recente”** quando houver novas mensagens fora da área visível. Ao acioná-lo, role de maneira suave se o usuário não tiver solicitado movimento reduzido.

## 7.8 Fundo topográfico

Uma malha topográfica ou de conexões pode aparecer como textura de fundo com opacidade extremamente baixa. Deve permanecer quase imperceptível e nunca competir com o texto. Desative-a em dispositivos de baixo desempenho, telas pequenas quando houver ruído visual excessivo ou movimento reduzido.

## 7.9 Regras gerais de movimento

* Nunca piscar rapidamente.
* Não usar parallax que dificulte leitura ou cause enjoo.
* Não bloquear entrada de texto enquanto uma transição termina.
* Não animar todos os elementos simultaneamente.
* Evitar loops contínuos fora dos estados ativos.
* Usar `transform` e `opacity` sempre que possível.
* Cancelar ou simplificar animações quando o componente sair de cena.
* Respeitar `prefers-reduced-motion`.
* Testar em celulares reais e em dispositivos com GPU modesta.

### Movimento reduzido

    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
        transition-duration: 0.01ms !important;
      }
    }

Essa regra é uma base de segurança. Componentes complexos também devem oferecer estados estáticos apropriados, em vez de depender apenas de zerar a duração das animações.

* * *

# 8. Microtextos e linguagem da interface

Toda a interface visível deve estar em português brasileiro natural, objetivo e acolhedor. Evite traduções literais, frases grandiosas e promessas vagas.

## 8.1 Tom de voz

* Direto, respeitoso e tranquilo.
* Inteligente sem soar arrogante.
* Próximo sem fingir intimidade.
* Claro sobre limites, erros e incertezas.
* Sem excesso de exclamações, emojis ou frases de marketing.

## 8.2 Textos recomendados

| Contexto | Texto |
| --- | --- |
| Boas-vindas | “O que vamos explorar hoje?” |
| Campo vazio | “Escreva sua mensagem…” |
| Dica de teclado | “Pressione Enter para enviar · Shift + Enter para pular uma linha” |
| Processamento | “Preparando uma resposta…” |
| Resposta concluída | “Resposta concluída” |
| Interromper geração | “Parar resposta” |
| Copiar | “Copiar resposta” |
| Conteúdo copiado | “Resposta copiada” |
| Nova conversa | “Nova conversa” |
| Histórico | “Conversas anteriores” |
| Retorno ao fim | “Ir para a mensagem mais recente” |
| Erro de envio | “Não foi possível enviar. Tente novamente.” |
| Falha de conexão | “A conexão foi interrompida. Sua mensagem continua aqui.” |
| Resposta indisponível | “Não foi possível gerar uma resposta agora.” |
| Campo sem conteúdo | “Escreva uma mensagem antes de enviar.” |
| Anexo em processamento | “Preparando arquivo…” |
| Anexo recusado | “Este tipo de arquivo não é aceito.” |
| Configurações | “Configurações” |
| Fechar | “Fechar” |
| Cancelar | “Cancelar” |
| Confirmar | “Confirmar” |

Os textos são exemplos e podem ser adaptados ao fluxo real. Não exiba mensagens de sucesso se a ação não tiver sido confirmada pelo sistema.

## 8.3 Erros

Mensagens de erro devem explicar o que aconteceu e, quando possível, o que fazer a seguir. Não mostrar pilhas técnicas, códigos internos ou detalhes de infraestrutura na interface comum. Esses detalhes podem estar disponíveis em registros de desenvolvimento.

* * *

# 9. Componentes e comportamento

## 9.1 Botões

Tipos:

* **Primário:** ação principal do contexto, com contraste forte.
* **Secundário:** ação frequente que não deve competir com a principal.
* **Discreto:** ações como copiar, avaliar ou abrir opções.
* **Destrutivo:** apagar ou excluir, com confirmação quando a ação for irreversível.

Estados obrigatórios: padrão, hover, foco por teclado, pressionado, desabilitado e carregando. O estado desabilitado deve continuar legível.

## 9.2 Campo de texto

Deve incluir rótulo acessível, foco visível, placeholder, estado desabilitado e mensagens de erro quando necessárias. Não use apenas o placeholder como rótulo permanente.

## 9.3 Mensagem da IA

Deve suportar texto formatado, listas, links, tabelas e código. As ações secundárias ficam agrupadas, com nomes acessíveis. Se a resposta estiver sendo gerada, o estado deve ser comunicado sem interferir na leitura.

## 9.4 Mensagem do usuário

Usa superfície cinza escura, espaçamento confortável e largura limitada à extensão do conteúdo, respeitando uma largura máxima. Mensagens muito longas podem ocupar mais largura para não criar quebras excessivas.

## 9.5 Indicador de processamento

Combina o núcleo Aurora e o texto “Preparando uma resposta…”. Não usar animação como único feedback. O indicador deve desaparecer ao concluir, cancelar ou falhar.

## 9.6 Blocos de código

* Usar fonte monoespaçada.
* Separar o código do texto explicativo.
* Permitir rolagem horizontal quando inevitável.
* Disponibilizar botão de copiar com feedback textual.
* Preservar indentação e caracteres.
* Não aplicar o gradiente arco-íris à sintaxe inteira; usar cores de sintaxe com contraste suficiente.

## 9.7 Diálogos e confirmações

Diálogos devem ter título claro, explicação curta, ação principal e opção de cancelar. O foco deve permanecer dentro do diálogo enquanto estiver aberto e retornar ao controle de origem ao fechar. A tecla `Escape` deve fechar diálogos não críticos.

## 9.8 Estados vazios

Um estado vazio deve explicar o que a pessoa pode fazer, sem parecer uma tela de erro. Use uma frase curta e, quando útil, uma ação principal. Evite ilustrações enormes que empurrem o campo de mensagem para fora da área inicial.

* * *

# 10. Responsividade

## 10.1 Celulares — até 767 px

* A conversa ocupa toda a largura disponível.
* Padding lateral de `16px`, podendo reduzir para `12px` em telas muito estreitas.
* Campo de mensagem fixado à parte inferior, respeitando a área segura do dispositivo.
* Controles adequados ao toque, com alvo recomendado de pelo menos `44 × 44px`.
* Menus laterais viram painéis ou folhas modais.
* Não depender de hover.
* Não deixar o teclado virtual cobrir o campo de mensagem.
* Evitar que o campo fixo esconda a última linha da conversa.

## 10.2 Tablets — 768 px a 1023 px

* Coluna de leitura centralizada.
* Margens adaptáveis e painel lateral recolhível.
* Campo de mensagem com largura controlada, sem ocupar a tela inteira quando isso prejudicar a composição.
* Menus e controles devem manter alvos de toque confortáveis.

## 10.3 Desktop — a partir de 1024 px

* Coluna de conversa com largura máxima aproximada de `800px`.
* Campo de mensagem em formato de cápsula, flutuando visualmente sobre a base da página.
* Histórico lateral opcional, sem reduzir excessivamente a área de leitura.
* Atalhos de teclado e estados de hover disponíveis, mas não exclusivos.
* Uso moderado de espaço vazio para criar foco, sem afastar demais as mensagens do campo de composição.

## 10.4 Telas muito largas

Não esticar parágrafos por toda a tela. Use uma coluna de leitura central e reserve o espaço extra para navegação ou painéis contextuais quando necessários. A largura de conteúdo deve continuar confortável.

## 10.5 Área segura e teclado virtual

Em dispositivos móveis, considerar `env(safe-area-inset-bottom)` e mudanças de viewport causadas pelo teclado virtual. O campo deve permanecer acessível sem saltos bruscos.

* * *

# 11. Acessibilidade

A acessibilidade faz parte da identidade do Aurora, não é uma etapa opcional.

## 11.1 Teclado

* Todos os controles devem ser alcançáveis por teclado.
* A ordem de foco deve seguir a ordem visual e lógica.
* O foco precisa ser visível em fundo escuro.
* `Escape` fecha menus e diálogos compatíveis.
* Não criar armadilhas de teclado.
* Não usar `tabindex` positivo para forçar uma ordem artificial.

## 11.2 Leitores de tela

* Usar HTML semântico sempre que possível.
* Identificar botões apenas com ícone por meio de nomes acessíveis.
* Anunciar mudanças de estado sem ler novamente toda a conversa.
* A área de novas respostas pode usar uma região viva com anúncio moderado; evite colocar toda a conversa em uma região que gere anúncios repetidos.
* Marcar elementos puramente decorativos como ocultos para tecnologias assistivas.
* Garantir que mensagens de erro e confirmações sejam anunciadas.

## 11.3 Movimento e sensibilidade visual

* Respeitar `prefers-reduced-motion`.
* Não usar flashes.
* Evitar grandes áreas com brilho pulsante.
* Permitir uma experiência plenamente utilizável sem animações.
* O espectro decorativo não pode ser necessário para entender um estado.

## 11.4 Contraste e legibilidade

* Validar contraste em texto, botões, ícones e bordas importantes.
* Não usar apenas cinza muito escuro para texto essencial.
* Não comunicar erro apenas com vermelho ou sucesso apenas com verde.
* Permitir zoom e ampliação sem perda de funcionalidades.
* Testar quebra de linha em português, URLs longas, tabelas e código.

## 11.5 Semântica de estado

Os estados de carregamento, sucesso, erro e desabilitado devem ser representados semanticamente, não apenas por estilos visuais. Componentes devem informar sua função e estado a tecnologias assistivas.

* * *

# 12. Desempenho e robustez

A interface precisa continuar fluida quando houver conversas longas, respostas extensas ou animações simultâneas.

* Preferir SVG e CSS para o núcleo visual quando forem suficientes.
* Evitar filtros de desfoque grandes em várias camadas ao mesmo tempo.
* Limitar `backdrop-filter` a superfícies pontuais.
* Evitar animações de propriedades que provoquem recálculo constante de layout.
* Carregar recursos de fonte de forma eficiente e incluir alternativas.
* Não renderizar novamente todas as mensagens quando apenas uma muda.
* Considerar virtualização para históricos muito extensos.
* Interromper animações fora da área visível quando possível.
* Tratar falhas de rede e respostas interrompidas sem perder o texto digitado.
* Garantir que a interface funcione sem a textura topográfica e sem efeitos decorativos.

## 12.1 Degradação elegante

Se o dispositivo não suportar bem os efeitos:

1. remover textura e desfoque;
2. reduzir o movimento do fundo;
3. substituir o núcleo animado por SVG estático;
4. preservar cores, hierarquia e estados;
5. manter todas as funções disponíveis.

A versão simplificada deve parecer uma escolha visual deliberada, não uma interface quebrada.

* * *

# 13. Tecnologia e arquitetura de implementação

A stack sugerida para uma implementação web moderna é:

* **React com Next.js App Router** para interface e organização da aplicação;
* **Tailwind CSS** para utilitários de layout, combinado com tokens CSS próprios;
* **Framer Motion** para transições que realmente precisem de coordenação;
* **Radix UI** para primitivas acessíveis de menus, diálogos e popovers, quando apropriado;
* **SVG e CSS** para o núcleo visual e efeitos leves.

Essas tecnologias são recomendações, não exigências absolutas. Caso o projeto já tenha uma stack definida, preserve a arquitetura existente e reproduza os mesmos princípios de design.

## 13.1 Separação de responsabilidades

* **Layout:** estrutura geral e áreas responsivas.
* **Componentes visuais:** botões, campo, mensagens, menus e núcleo Aurora.
* **Tokens:** cores, espaçamento, tipografia, raios e movimento.
* **Lógica de conversa:** envio, recebimento, cancelamento, tentativas e erros.
* **Acessibilidade:** semântica, foco, anúncios e movimento reduzido.
* **Animações:** variantes e utilitários reutilizáveis.
* **Testes:** comportamento, responsividade, acessibilidade e desempenho.

## 13.2 Estrutura de pastas sugerida

    src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── globals.css
    ├── components/
    │   ├── chat/
    │   │   ├── ChatLayout.tsx
    │   │   ├── ChatHeader.tsx
    │   │   ├── MessageList.tsx
    │   │   ├── MessageItem.tsx
    │   │   ├── MessageActions.tsx
    │   │   ├── MessageComposer.tsx
    │   │   └── ProcessingIndicator.tsx
    │   ├── aurora/
    │   │   ├── AuroraCore.tsx
    │   │   └── AuroraCoreStatic.tsx
    │   └── ui/
    │       ├── Button.tsx
    │       ├── Dialog.tsx
    │       ├── Tooltip.tsx
    │       └── VisuallyHidden.tsx
    ├── lib/
    │   ├── animations.ts
    │   ├── accessibility.ts
    │   └── utils.ts
    └── styles/
        └── design-tokens.css

A estrutura pode mudar de acordo com o projeto. O objetivo é manter responsabilidades claras, componentes reutilizáveis e uma única origem para os tokens visuais.

* * *

# 14. Referências de implementação visual

## 14.1 Tokens CSS iniciais

    :root {
      color-scheme: dark;
    
      --cor-fundo: #0A0A0C;
      --cor-superficie: #121216;
      --cor-superficie-elevada: #19191F;
      --cor-campo: #1A1A20;
      --cor-borda: rgba(255, 255, 255, 0.09);
    
      --texto-principal: #F2F2F5;
      --texto-secundario: #B0B0BA;
      --texto-terciario: #858590;
      --texto-placeholder: #85858F;
    
      --cor-usuario: #27272A;
      --cor-erro: #FB7185;
      --cor-sucesso: #34D399;
      --cor-aviso: #FBBF24;
    
      --espectro-aurora: linear-gradient(
        115deg,
        #A78BFA,
        #60A5FA,
        #22D3EE,
        #34D399,
        #FCD34D,
        #FB923C,
        #FB7185
      );
    
      --fonte-interface: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
      --fonte-codigo: "JetBrains Mono", ui-monospace, monospace;
    
      --raio-campo: 28px;
      --raio-cartao: 20px;
    
      --duracao-rapida: 140ms;
      --duracao-padrao: 220ms;
      --duracao-suave: 360ms;
      --curva-suave: cubic-bezier(0.25, 0.1, 0.25, 1);
    
      --largura-conversa: 800px;
    }
    
    html {
      color-scheme: dark;
      background: var(--cor-fundo);
    }
    
    body {
      margin: 0;
      background: var(--cor-fundo);
      color: var(--texto-principal);
      font-family: var(--fonte-interface);
      font-size: 16px;
      line-height: 1.65;
      text-rendering: optimizeLegibility;
    }
    
    :focus-visible {
      outline: 2px solid #A5B4FC;
      outline-offset: 3px;
    }
    
    ::selection {
      color: #FFFFFF;
      background: rgba(96, 165, 250, 0.32);
    }

## 14.2 Exemplo de campo de mensagem

    .compositor {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      width: 100%;
      padding: 12px;
      border: 1px solid var(--cor-borda);
      border-radius: var(--raio-campo);
      background: var(--cor-campo);
      transition:
        border-color var(--duracao-padrao) var(--curva-suave),
        box-shadow var(--duracao-padrao) var(--curva-suave);
    }
    
    .compositor:focus-within {
      border-color: rgba(165, 180, 252, 0.8);
      box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.09);
    }
    
    .compositor textarea {
      flex: 1;
      min-width: 0;
      min-height: 32px;
      max-height: 200px;
      resize: none;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--texto-principal);
      font: inherit;
    }
    
    .compositor textarea::placeholder {
      color: var(--texto-placeholder);
    }

## 14.3 Exemplo de mensagem da IA

    .mensagem-ia {
      color: var(--texto-principal);
      font-size: 1rem;
      line-height: 1.7;
      overflow-wrap: anywhere;
    }
    
    .mensagem-ia p {
      margin: 0 0 1rem;
    }
    
    .mensagem-ia h2,
    .mensagem-ia h3 {
      margin: 1.5rem 0 0.65rem;
      line-height: 1.3;
    }
    
    .mensagem-usuario {
      width: fit-content;
      max-width: min(88%, 680px);
      margin-left: auto;
      padding: 12px 16px;
      border-radius: 20px 4px 20px 20px;
      background: var(--cor-usuario);
      color: var(--texto-principal);
      overflow-wrap: anywhere;
    }

## 14.4 Exemplo de animação do núcleo

    .nucleo-aurora {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      border-radius: 50%;
      background: var(--espectro-aurora);
    }
    
    .nucleo-aurora::after {
      content: "";
      position: absolute;
      inset: -20%;
      border-radius: inherit;
      background: radial-gradient(
        circle at 35% 30%,
        rgba(255, 255, 255, 0.42),
        transparent 48%
      );
      opacity: 0.65;
      pointer-events: none;
    }
    
    .nucleo-aurora[data-estado="processando"] {
      animation: aurora-respira 4s ease-in-out infinite;
    }
    
    @keyframes aurora-respira {
      0%, 100% {
        transform: scale(1);
        filter: saturate(0.96);
      }
      50% {
        transform: scale(1.025);
        filter: saturate(1.08);
      }
    }
    
    @media (prefers-reduced-motion: reduce) {
      .nucleo-aurora[data-estado="processando"] {
        animation: none;
      }
    }

Esse exemplo é apenas uma base. O núcleo final deve ser validado em tamanhos pequenos, com movimento reduzido e em dispositivos de baixo desempenho.

* * *

# 15. Ícones, ilustrações e recursos gráficos

* Preferir ícones simples, consistentes e reconhecíveis.
* Manter espessura de traço e proporção coerentes.
* Ícones sem texto devem ter nomes acessíveis.
* Não usar emojis como substitutos de todos os ícones de interface.
* O núcleo Aurora é o principal elemento de identidade; não criar vários mascotes ou símbolos concorrentes sem uma necessidade clara.
* Ilustrações, quando utilizadas, devem ser pontuais e não ocupar o espaço destinado à conversa.
* Evitar imagens rasterizadas grandes para efeitos que podem ser feitos de maneira leve com SVG ou CSS.
* Se houver imagem de fallback, fornecer alternativa estática otimizada e respeitar a proporção.

* * *

# 16. Interações e regras de estado

## 16.1 Envio de mensagem

1. A pessoa digita uma mensagem.
2. O botão de envio fica habilitado quando há conteúdo válido.
3. Ao enviar, a mensagem é preservada e exibida na conversa.
4. O campo é preparado para a próxima mensagem, sem perder dados em caso de falha.
5. O indicador de processamento aparece com texto acessível.
6. A resposta chega progressivamente ou de uma só vez, conforme a capacidade técnica.
7. A interface comunica a conclusão e apresenta ações secundárias.

## 16.2 Interromper uma resposta

* O controle de interrupção deve estar disponível enquanto houver geração ativa.
* Ao acioná-lo, a interface informa que a resposta foi interrompida.
* Não indicar conclusão normal se a geração foi cancelada.
* Preservar o conteúdo já recebido quando tecnicamente possível.

## 16.3 Falha e nova tentativa

* Informar a falha em linguagem clara.
* Manter a mensagem original disponível.
* Oferecer nova tentativa quando fizer sentido.
* Evitar duplicar mensagens ao tentar novamente.
* Não inventar sucesso quando a conexão ainda não confirmou a operação.

## 16.4 Rolagem

* A rolagem automática só deve acompanhar novas mensagens quando a pessoa já estiver próxima do fim da conversa.
* Se a pessoa estiver lendo conteúdo anterior, preservar sua posição.
* Oferecer um atalho claro para a mensagem mais recente.
* Não usar encaixe obrigatório de rolagem que impeça leitura livre.

## 16.5 Persistência visual

O estado do campo, a mensagem em edição e os indicadores de geração devem sobreviver a atualizações de interface sempre que a arquitetura permitir. Falhas não devem causar perda silenciosa de conteúdo.

* * *

# 17. Segurança, privacidade e confiança visual

O design não deve prometer privacidade, criptografia ou retenção de dados que não tenham sido implementadas e verificadas. Se houver configurações de histórico, exclusão ou armazenamento, descreva seu efeito real com linguagem clara.

* Pedir permissões apenas quando forem necessárias.
* Explicar por que um arquivo ou recurso está sendo solicitado.
* Confirmar ações destrutivas.
* Não imitar indicadores de segurança inexistentes.
* Não usar animações ou cores para mascarar falhas.
* Diferenciar claramente respostas da IA, mensagens do usuário e avisos do sistema.

* * *

# 18. Critérios de aceitação

A implementação só deve ser considerada concluída quando os seguintes pontos forem verificados.

## Identidade visual

* [ ] O modo escuro é aplicado em todas as telas e estados.
* [ ] A paleta cromática usa os tokens definidos.
* [ ] O espectro aparece como assinatura visual, sem dominar o conteúdo.
* [ ] A interface não se parece com um modelo genérico de chatbot.
* [ ] A tipografia e o espaçamento permanecem consistentes.

## Idioma

* [ ] Todos os textos visíveis ao usuário estão em português brasileiro.
* [ ] Erros, menus, dicas, rótulos acessíveis e estados também estão traduzidos.
* [ ] Não existem textos provisórios em inglês na interface final.

## Usabilidade

* [ ] É possível iniciar uma conversa sem procurar configurações.
* [ ] O campo de mensagem funciona com teclado e toque.
* [ ] As ações essenciais não dependem exclusivamente de hover.
* [ ] O usuário consegue interromper uma geração ativa.
* [ ] Erros não apagam silenciosamente a mensagem digitada.
* [ ] A rolagem não tira o usuário de uma mensagem que esteja lendo.

## Animações

* [ ] Cada animação tem uma finalidade perceptível.
* [ ] O movimento não bloqueia interação nem leitura.
* [ ] A interface respeita movimento reduzido.
* [ ] Não há flashes ou pulsação intensa.
* [ ] Os efeitos permanecem fluidos em dispositivos modestos.
* [ ] Existe uma alternativa estática para os efeitos decorativos.

## Acessibilidade

* [ ] Foco de teclado visível.
* [ ] Botões de ícone têm nomes acessíveis.
* [ ] Estados importantes não dependem apenas de cor.
* [ ] Contraste validado em componentes reais.
* [ ] Diálogos e menus gerenciam o foco corretamente.
* [ ] Leitores de tela recebem anúncios úteis, sem repetições excessivas.

## Responsividade e desempenho

* [ ] Layout validado em celular, tablet, desktop e telas largas.
* [ ] O campo não fica encoberto pelo teclado virtual.
* [ ] O histórico extenso não degrada toda a interface.
* [ ] Desfoques e animações não causam travamentos perceptíveis.
* [ ] A aplicação continua utilizável sem efeitos decorativos.

* * *

# 19. Ordem recomendada de implementação

Para evitar que a equipe comece pelos efeitos antes de resolver a experiência básica, implemente nesta ordem:

1. **Estrutura e layout:** cabeçalho, conversa, campo de mensagem e navegação.
2. **Tokens:** cores, tipografia, espaçamento, bordas e foco.
3. **Componentes funcionais:** mensagens, envio, cancelamento, erros e menus.
4. **Responsividade:** celular, tablet e desktop.
5. **Acessibilidade:** semântica, teclado, leitores de tela e movimento reduzido.
6. **Núcleo Aurora:** primeiro estático; depois, animação leve.
7. **Microinterações:** foco, entrada de mensagens, menus e transformação do botão.
8. **Efeitos ambientais:** textura e brilho, apenas se não prejudicarem leitura ou desempenho.
9. **Validação:** testes visuais, funcionais, de contraste, acessibilidade e desempenho.

Não iniciar pela animação do núcleo ou pelo fundo decorativo. A identidade visual precisa complementar uma interface que já seja clara e funcional.

* * *

# 20. Diretriz final

O Aurora AI deve ser reconhecido pela combinação de **escuridão confortável, espectro luminoso controlado, tipografia legível e movimento com propósito**. Sua singularidade não depende de colocar efeitos em todos os lugares, mas de fazer cada detalhe parecer intencional.

O fundo oferece silêncio visual. O texto oferece clareza. O espectro oferece identidade. As animações oferecem feedback. A acessibilidade garante que a experiência continue funcionando para pessoas e dispositivos diferentes.

**Regra final para qualquer decisão de design:** se um efeito deixar a interface mais bonita, mas menos legível, previsível, acessível ou rápida, o efeito deve ser simplificado ou removido. O objetivo não é criar uma demonstração visual impressionante por alguns segundos; é criar um lugar no qual as pessoas queiram conversar, pensar e trabalhar por muito tempo.