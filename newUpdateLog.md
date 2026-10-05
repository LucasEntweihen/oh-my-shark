# Fast and Furious
## Funcionalidades
- preciso que uma nova funcionalidade de otimização seja criada; para isso, quero um comando especial com as cores amarelo, dourado e branco chamado de `fastthinkworkerz` que tenta acelerar o processo da mensagem, reduzindo o nível do pensamento e o tempo de resposta
- esse comando se assemelha ao `deepseaneuron`, mas ao invés de otimizar o processo ele deve apenas acelerar, custe o que custar!
- quando chamado, **ainda** deve considerar o fluxo de agentes, apenas fazer ***TUDO QUE FOR POSSÍVEL*** para acelerar a entrega da resposta, sem comprometer *muito* o resultado (ou seja, fica subentendido que comprometerá o resultado, só não de forma muito alarmante)
Fora isso, quero que tenha uma *OUTRA* funcionalidade relacionada à velocidade de processamento e ao nível de pensamento: o `/xlr8`
Ele deve fazer:
- quando eu chamo ele ele deve acelerar, de alguma forma, o processo da mensagem (acelerando a linha de raciocínio, simplificando o código, otimizando o fluxo de pensamento, tudo o que possa fazer a mensagem acelerar mesmo)
- se eu chamar ele enquanto uma mensagem já está sendo processada, ele deve **acelerar o processamento *daquela mensagem* de forma que, independemente da mensagem e tempo que ela estiver ali, o /xlr8 é lido e acelera o processo
- suas cores devem ser cinza, azul, verde e branco

## O site
mude o site pars que todos os comando especiais (promaxthink, ultrathink, workflowz, orchestrate, deepseaneuron, fastthinkworkerz, /doomania e /xlr8) e o novo comando de instalação (e uma update em alguma parte do github) baseada nesse texto:
> Para ter um comando definitivo que você possa rodar de uma vez só sem precisar abrir o Bloco de Notas (ideal para colar no terminal e dar Enter), use este código de uma linha. Ele baixa o script, substitui a linha problemática diretamente na memória e executa a instalação automaticamente:
PowerShell
$s = (irm https://oh-my-shark.vercel.app/install.ps1); $s = $s.Replace("[System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString().ToLowerInvariant()", '"x64"'); & ([scriptblock]::Create($s))
Correção definitiva para o repositório:
Como o projeto oh-my-shark parece ser seu, o erro original acontece porque a classe [System.Runtime.InteropServices.RuntimeInformation] não é carregada nativamente no Windows PowerShell 5.1 (o padrão do Windows), apenas no PowerShell Core (versão 6+).
Para corrigir o arquivo install.ps1 oficial no seu GitHub para que qualquer usuário consiga instalar sem erros, substitua a linha 23 original por esta verificação compatível com qualquer versão do PowerShell:
PowerShell
$NativeArchitecture = $env:PROCESSOR_ARCHITECTURE.ToLowerInvariant().Replace("amd64", "x64")
Isso garante que o script identifique a arquitetura corretamente e a instalação via irm [https://oh-my-shark.vercel.app/install.ps1](https://oh-my-shark.vercel.app/install.ps1) | iex volte a funcionar perfeitamente para todo mundo.
