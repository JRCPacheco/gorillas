# Sprite do Gorila

Objetivo: substituir o `assets/gorila.png` atual por uma arte sua com mais presença, mantendo a lógica do jogo intacta.

## Formato atual esperado

- Arquivo: `assets/gorila.png`
- Layout: spritesheet horizontal
- Quadros: `3`
- Ordem dos quadros:
  - `0`: `normal`
  - `1`: `bracoEsquerdo`
  - `2`: `bracoDireito`

## Tamanho recomendado para a nova arte

- Tamanho por quadro recomendado: `96x96` ou `128x128`
- Fundo: transparente
- Altura visual do personagem:
  - ocupar cerca de `80%` a `88%` da altura do quadro
- Margem interna:
  - deixar respiro em cima e nas laterais
  - evitar encostar cabeça, punho ou pés na borda do quadro

## Encaixe no jogo

O código agora aceita sprite maior e escalado, mas o personagem precisa respeitar estes pontos:

- Pé de apoio:
  - o centro dos pés deve ficar aproximadamente no meio da base do quadro
  - isso ajuda o gorila a “sentar” no topo do prédio
- Mão de lançamento:
  - quadro `bracoEsquerdo`: mão lançadora mais alta e aberta
  - quadro `bracoDireito`: mesma ideia espelhada
- Silhueta:
  - cabeça, ombros e braços precisam ler bem mesmo em tamanho médio

## Direção visual sugerida

- Vibe:
  - arcade premium
  - remake carismático
  - menos “clipart”, mais “mascote de jogo”
- Combinar com o cenário:
  - luz quente de fim de tarde
  - volumes bem separados
  - sombra própria sob braços e tronco
- Acabamento:
  - contraste claro entre peito, braços e pernas
  - borda externa um pouco mais escura
  - highlights quentes no topo

## Checklist artístico

- pose `normal`:
  - firme, peito aberto, leitura forte no telhado
- pose `bracoEsquerdo`:
  - braço de arremesso erguido com energia
- pose `bracoDireito`:
  - equivalente para o outro lado
- rosto:
  - simples, legível e expressivo
- mãos:
  - grandes o suficiente para a banana parecer sair dali

## Evitar

- muitos detalhes finos no rosto
- pernas muito curtas
- braço lançador muito colado ao corpo
- outline fraco demais contra o céu
- proporção realista demais

## Próxima etapa quando a arte estiver pronta

1. Salvar o novo arquivo em `assets/gorila.png`
2. Me avisar o tamanho final de cada quadro
3. Eu ajusto no código:
   - `larguraQuadro`
   - `alturaQuadro`
   - `escalaDesenho`
   - ponto da mão de lançamento
   - hitbox

Se você quiser, no próximo passo eu também posso montar uma folha-guia visual por cima do quadro para te dizer exatamente onde colocar:

- cabeça
- pés
- mão de lançamento
- centro de massa
