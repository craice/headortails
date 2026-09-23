# Cara ou Coroa — Design

**Data:** 2026-09-23
**Status:** aprovado

## Objetivo

Um jogo web simples de cara ou coroa, com estética cartoon, publicado no GitHub Pages como projeto open source (licença MIT). O foco é o jogo em si: não há conteúdo didático na interface.

## Requisitos

- A pessoa joga a moeda e vê o resultado. Não há aposta nem placar.
- Mostra os últimos 10 resultados da sessão.
- Interface e README em português (BR).
- Sem banco de dados, backend, analytics, cookies, `localStorage` ou qualquer tipo de log.
- Nenhum recurso carregado de terceiros (fontes, scripts, imagens): tudo fica no repositório.
- Licença MIT.
- Testes mínimos: só a lógica do sorteio.

## Fora de escopo

Aposta ou placar, efeitos sonoros, atalhos de teclado próprios, múltiplos idiomas, persistência entre sessões, estatísticas.

## Tecnologia

HTML, CSS e JavaScript puro (ES modules), sem framework e sem etapa de build. O GitHub Pages publica direto da branch `main`, a partir da raiz do repositório.

Alternativas descartadas:
- **Vite:** exigiria dependências npm, build e workflow de deploy, sem ganho para um app de uma tela.
- **Arquivo HTML único:** misturaria lógica e visual e dificultaria testar o sorteio isoladamente.

## Estrutura

```
headortails/
├── index.html              # página única, SVGs das faces inline
├── style.css               # visual cartoon + animação de giro
├── app.js                  # liga botão, animação e histórico
├── coin.js                 # lógica pura do sorteio
├── assets/fonts/           # fonte cartoon com licença OFL, hospedada localmente
├── tests/coin.test.js      # testes com node --test
├── .github/workflows/test.yml
├── LICENSE                 # MIT
└── README.md               # PT-BR
```

## Componentes

### `coin.js`
- Exporta `flipCoin()`, que retorna `"cara"` ou `"coroa"`.
- Usa `crypto.getRandomValues` para a aleatoriedade.
- Não depende do DOM e roda tanto no navegador quanto no Node.

### `app.js`
- Importa `flipCoin` e controla a interface.
- Mantém o histórico num array em memória, com no máximo 10 itens (o mais antigo sai).
- Desativa o botão enquanto a animação roda, para evitar cliques duplos.

### `index.html`
- Uma moeda com duas faces em SVG inline:
  - Cara: rostinho sorridente.
  - Coroa: uma coroa.
- Um `<button>` "Jogar moeda!". Por ser um botão nativo, Enter e Espaço já funcionam quando ele está em foco.
- Área de resultado com `aria-live="polite"`, para que leitores de tela anunciem o resultado.
- Fileira dos últimos resultados.

## Fluxo

1. A pessoa clica em "Jogar moeda!" e o botão fica desativado.
2. `flipCoin()` define o resultado antes da animação começar.
3. A moeda gira em 3D (CSS transform) por cerca de 1,5 s e para na face sorteada.
4. Aparece "Deu CARA!" ou "Deu COROA!", e o resultado entra no início do histórico.
5. O botão é reativado.

## Visual

- **Fundo:** creme/off-white neutro, com cara de papel.
- **Moeda:** dourada, com contorno preto grosso.
- **Botão:** grande e arredondado, com sombra dura deslocada e um leve pulo ao clicar.
- **Fonte:** Fredoka (licença OFL), servida pelo próprio repositório.
- **Responsividade:** layout pensado primeiro para celular.
- **Movimento reduzido:** com `prefers-reduced-motion`, a moeda troca de face sem girar.

## Testes

Os testes ficam em `tests/coin.test.js` e rodam com o executor nativo do Node (`node --test`), sem nenhuma dependência instalada.

1. `flipCoin()` só retorna `"cara"` ou `"coroa"`.
2. Em 10.000 jogadas, cada lado aparece entre 45% e 55% das vezes. A margem é larga de propósito, para o teste não falhar por acaso.

A interface é verificada manualmente no navegador.

## CI

`.github/workflows/test.yml` roda `node --test` a cada push e pull request na `main`.

## Publicação

O deploy é feito em *Settings → Pages → Deploy from branch → main / (root)*.

## Privacidade

O código não coleta nenhum dado. O README vai deixar claro que a hospedagem no GitHub Pages está sujeita aos logs de servidor do próprio GitHub, que fogem do controle do projeto.

## Riscos

- **Módulos ES não rodam via `file://`.** Abrir o `index.html` com duplo clique não funciona. Para testar localmente é preciso um servidor simples (por exemplo, `python3 -m http.server`), e o README vai documentar isso.
