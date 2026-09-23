# Cara ou Coroa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jogo web de cara ou coroa com estética cartoon, estático, publicável no GitHub Pages.

**Architecture:** Site estático sem build. `coin.js` contém só a lógica pura do sorteio (testável no Node); `app.js` liga a lógica à interface (botão, animação 3D via CSS, histórico em memória). As artes das faces são símbolos SVG inline reutilizados na moeda e no histórico.

**Tech Stack:** HTML, CSS, JavaScript (ES modules), `node:test` (Node ≥ 20), GitHub Actions, GitHub Pages (deploy from branch).

**Spec:** `docs/superpowers/specs/2026-09-23-cara-ou-coroa-design.md`

## Global Constraints

- Nenhuma dependência npm; `package.json` existe só para `"type": "module"` e o script `test`.
- Nenhum recurso de terceiros carregado pela página (fontes, scripts, imagens, CDNs).
- Sem `localStorage`, `sessionStorage`, cookies, analytics ou qualquer log.
- Todo texto de interface e README em português (BR). Os valores de resultado são exatamente `"cara"` e `"coroa"`.
- Histórico: no máximo 10 itens, mais recente primeiro, só em memória.
- Fundo creme `#f6efe1`; fonte Fredoka (OFL) servida de `assets/fonts/`.
- Duração do giro: 1500 ms; com `prefers-reduced-motion: reduce`, sem giro e resultado imediato.
- Licença MIT, titular "Rafael Craice".

## Review Focus

1. Cliques rápidos repetidos ou Espaço segurado durante a animação → só uma jogada acontece; as demais são ignoradas.
2. Pessoa usando só teclado → após o resultado, o foco continua no botão e Espaço/Enter joga de novo (por isso o botão usa `aria-disabled`, não `disabled`, que tiraria o foco).
3. Mesmo resultado duas vezes seguidas → a moeda ainda gira visivelmente (a rotação é acumulada, nunca repete o mesmo valor de `transform`).
4. `prefers-reduced-motion: reduce` ativo → sem giro nem pulo; resultado aparece na hora.
5. Tela estreita (320 px) → nada estoura na horizontal; moeda, botão e histórico cabem.

Esses cinco pontos são de interface; conforme o pedido de manter só os testes necessários, eles são verificados por checagem manual explícita na Task 3 (Step 4), não por testes automatizados.

---

### Task 1: Repositório, lógica do sorteio e CI

**Files:**
- Create: `package.json`
- Create: `coin.js`
- Create: `tests/coin.test.js`
- Create: `.github/workflows/test.yml`
- Create: `.nojekyll`

**Interfaces:**
- Consumes: nada.
- Produces: `flipCoin(): "cara" | "coroa"` exportado de `coin.js` (ES module, sem dependência do DOM).

- [ ] **Step 1: Inicializar o repositório git na branch `main`**

```bash
cd /mnt/c/projects/headortails
git init -b main
```

- [ ] **Step 2: Criar `package.json`**

```json
{
  "name": "headortails",
  "private": true,
  "description": "Jogo de cara ou coroa com estética cartoon.",
  "license": "MIT",
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

`node --test` sem argumentos encontra automaticamente arquivos `*.test.js`.

- [ ] **Step 3: Escrever os testes que devem falhar — `tests/coin.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flipCoin } from '../coin.js';

test('flipCoin retorna apenas "cara" ou "coroa"', () => {
  for (let i = 0; i < 1000; i++) {
    assert.ok(['cara', 'coroa'].includes(flipCoin()));
  }
});

test('flipCoin fica perto de 50/50 em 10.000 jogadas', () => {
  const total = 10_000;
  let caras = 0;
  for (let i = 0; i < total; i++) {
    if (flipCoin() === 'cara') caras++;
  }
  const proporcao = caras / total;
  // Margem larga (±5%) para o teste nunca falhar por puro acaso.
  assert.ok(proporcao > 0.45 && proporcao < 0.55, `proporção de caras: ${proporcao}`);
});
```

- [ ] **Step 4: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL com erro de módulo não encontrado (`Cannot find module ... coin.js`).

- [ ] **Step 5: Implementar `coin.js`**

```js
// Sorteia um lado da moeda usando o gerador aleatório criptográfico do navegador.
// 256 valores possíveis divididos em pares/ímpares: exatamente 50% para cada lado.
export function flipCoin() {
  const [byte] = crypto.getRandomValues(new Uint8Array(1));
  return byte % 2 === 0 ? 'cara' : 'coroa';
}
```

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `npm test`
Expected: PASS, `# pass 2`, `# fail 0`.

- [ ] **Step 7: Criar o workflow de CI — `.github/workflows/test.yml`**

```yaml
name: Testes

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm test
```

- [ ] **Step 8: Criar `.nojekyll` vazio**

```bash
touch .nojekyll
```

Faz o GitHub Pages servir os arquivos como estão, sem passar pelo Jekyll.

- [ ] **Step 9: Commit (inclui a spec e este plano)**

```bash
git add package.json coin.js tests/coin.test.js .github/workflows/test.yml .nojekyll docs/
git commit -m "feat: lógica do sorteio com testes e CI"
```

---

### Task 2: Página estática e visual cartoon

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `assets/fonts/fredoka-latin-400-normal.woff2`
- Create: `assets/fonts/fredoka-latin-700-normal.woff2`
- Create: `assets/fonts/OFL.txt`

**Interfaces:**
- Consumes: nada (o `<script>` aponta para `app.js`, criado na Task 3; até lá o console mostra 404 desse arquivo, o que é esperado).
- Produces para a Task 3 (IDs e classes exatos):
  - `#coin-stage` — contêiner da moeda; recebe a classe `is-tossing` para o pulo.
  - `#coin` — elemento que gira via `style.transform = rotateY(...)`.
  - `#result` — parágrafo `aria-live` do texto de resultado.
  - `#flip-button` — botão; estado ocupado via atributo `aria-disabled="true"`.
  - `#history-list` — `<ol>` vazio do histórico.
  - Símbolos SVG `#art-cara` e `#art-coroa` (viewBox `0 0 100 100`).
  - Classes CSS `history-item` e `visually-hidden`.

- [ ] **Step 1: Baixar a fonte Fredoka e a licença OFL para dentro do repo**

```bash
mkdir -p assets/fonts
curl -fsSL -o assets/fonts/fredoka-latin-400-normal.woff2 https://cdn.jsdelivr.net/npm/@fontsource/fredoka/files/fredoka-latin-400-normal.woff2
curl -fsSL -o assets/fonts/fredoka-latin-700-normal.woff2 https://cdn.jsdelivr.net/npm/@fontsource/fredoka/files/fredoka-latin-700-normal.woff2
curl -fsSL -o assets/fonts/OFL.txt https://raw.githubusercontent.com/google/fonts/main/ofl/fredoka/OFL.txt
file assets/fonts/*
```

Expected: os dois `.woff2` identificados como `Web Open Font Format (Version 2)` e `OFL.txt` como texto. (O download acontece só agora, na construção; a página publicada não acessa nenhum CDN.)

- [ ] **Step 2: Criar `index.html`**

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cara ou Coroa</title>
  <meta name="description" content="Jogue uma moeda: cara ou coroa?">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='44' fill='%23f7c531' stroke='%232b2118' stroke-width='8'/></svg>">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- Artes das faces, reutilizadas na moeda e no histórico via <use>. -->
  <svg class="sprite" aria-hidden="true">
    <symbol id="art-cara" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" fill="none" stroke="#2b2118" stroke-width="3" stroke-dasharray="1 7" stroke-linecap="round"/>
      <circle cx="28" cy="58" r="6" fill="#f28b6b" opacity="0.7"/>
      <circle cx="72" cy="58" r="6" fill="#f28b6b" opacity="0.7"/>
      <circle cx="37" cy="42" r="6" fill="#2b2118"/>
      <circle cx="63" cy="42" r="6" fill="#2b2118"/>
      <path d="M35 60 Q50 76 65 60" fill="none" stroke="#2b2118" stroke-width="6" stroke-linecap="round"/>
    </symbol>
    <symbol id="art-coroa" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" fill="none" stroke="#2b2118" stroke-width="3" stroke-dasharray="1 7" stroke-linecap="round"/>
      <path d="M28 66 L24 38 L39 51 L50 31 L61 51 L76 38 L72 66 Z" fill="#e0a21b" stroke="#2b2118" stroke-width="5" stroke-linejoin="round"/>
      <rect x="27" y="64" width="46" height="9" rx="3" fill="#e0a21b" stroke="#2b2118" stroke-width="5" stroke-linejoin="round"/>
      <circle cx="24" cy="35" r="4.5" fill="#2b2118"/>
      <circle cx="50" cy="28" r="4.5" fill="#2b2118"/>
      <circle cx="76" cy="35" r="4.5" fill="#2b2118"/>
    </symbol>
  </svg>

  <main class="game">
    <h1 class="title">Cara ou Coroa</h1>

    <div class="coin-stage" id="coin-stage">
      <div class="coin" id="coin" aria-hidden="true">
        <div class="coin-face coin-face--cara">
          <svg class="coin-art" viewBox="0 0 100 100"><use href="#art-cara"></use></svg>
        </div>
        <div class="coin-face coin-face--coroa">
          <svg class="coin-art" viewBox="0 0 100 100"><use href="#art-coroa"></use></svg>
        </div>
      </div>
    </div>

    <p class="result" id="result" aria-live="polite">Clique no botão para jogar!</p>

    <button class="flip-button" id="flip-button" type="button">Jogar moeda!</button>

    <section class="history" aria-labelledby="history-title">
      <h2 class="history-title" id="history-title">Últimos resultados</h2>
      <ol class="history-list" id="history-list"></ol>
    </section>
  </main>

  <noscript><p class="noscript">Este jogo precisa de JavaScript ativado para funcionar.</p></noscript>

  <script type="module" src="app.js"></script>
</body>
</html>
```

Obs.: `<ol ...></ol>` deve ficar sem espaço interno, para o seletor `:empty` funcionar.

- [ ] **Step 3: Criar `style.css`**

```css
@font-face {
  font-family: "Fredoka";
  src: url("assets/fonts/fredoka-latin-400-normal.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "Fredoka";
  src: url("assets/fonts/fredoka-latin-700-normal.woff2") format("woff2");
  font-weight: 700;
  font-display: swap;
}

:root {
  --bg: #f6efe1;          /* creme, fundo neutro */
  --ink: #2b2118;         /* contornos e texto */
  --muted: #7a6a58;       /* textos secundários */
  --coin: #f7c531;        /* dourado da moeda */
  --coin-dark: #e0a21b;   /* sombra do dourado */
  --button: #e8553a;
  --button-text: #fffaf0;
  --outline: 4px;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  background: var(--bg);
  color: var(--ink);
  font-family: "Fredoka", system-ui, sans-serif;
}

.sprite {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

.game {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  text-align: center;
}

.title {
  margin: 0;
  font-size: clamp(2rem, 9vw, 3rem);
  font-weight: 700;
}

/* ---------- Moeda ---------- */

.coin-stage {
  padding-top: 16px;
  perspective: 800px;
}

.coin-stage.is-tossing {
  animation: toss 1500ms ease-in-out;
}

@keyframes toss {
  0%, 100% { transform: translateY(0); }
  45%      { transform: translateY(-70px); }
}

.coin {
  position: relative;
  width: 180px;
  height: 180px;
  transform-style: preserve-3d;
}

.coin-face {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border: var(--outline) solid var(--ink);
  border-radius: 50%;
  background: var(--coin);
  box-shadow: inset -10px -10px 0 var(--coin-dark);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.coin-face--coroa {
  transform: rotateY(180deg);
}

.coin-art {
  width: 100%;
  height: 100%;
}

/* ---------- Resultado e botão ---------- */

.result {
  margin: 0;
  min-height: 1.3em;
  font-size: 1.75rem;
  font-weight: 700;
}

.flip-button {
  padding: 14px 36px;
  border: var(--outline) solid var(--ink);
  border-radius: 999px;
  background: var(--button);
  color: var(--button-text);
  font: inherit;
  font-size: 1.4rem;
  font-weight: 700;
  box-shadow: 5px 5px 0 var(--ink);
  cursor: pointer;
  transition: transform 100ms, box-shadow 100ms;
}

.flip-button:hover {
  transform: translate(-1px, -1px);
  box-shadow: 6px 6px 0 var(--ink);
}

.flip-button:active {
  transform: translate(4px, 4px);
  box-shadow: 1px 1px 0 var(--ink);
}

.flip-button[aria-disabled="true"] {
  opacity: 0.6;
  cursor: wait;
  transform: none;
  box-shadow: 5px 5px 0 var(--ink);
}

.flip-button:focus-visible {
  outline: 3px dashed var(--ink);
  outline-offset: 6px;
}

/* ---------- Histórico ---------- */

.history {
  width: 100%;
}

.history-title {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 1rem;
  font-weight: 700;
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.history-list:empty::before {
  content: "Nenhuma jogada ainda";
  color: var(--muted);
}

.history-item {
  width: 40px;
  height: 40px;
  border: 3px solid var(--ink);
  border-radius: 50%;
  background: var(--coin);
}

.history-item svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* ---------- Utilitários ---------- */

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.noscript {
  margin: 0;
  padding: 16px;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .coin-stage.is-tossing {
    animation: none;
  }
}
```

- [ ] **Step 4: Verificar a página servida localmente**

```bash
python3 -m http.server 8000 &
sleep 1
for p in / /style.css /assets/fonts/fredoka-latin-400-normal.woff2 /assets/fonts/fredoka-latin-700-normal.woff2; do
  echo "$p $(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000$p)"
done
kill %1
```

Expected: todas as linhas terminando em `200`.

Depois, abrir `http://localhost:8000` no navegador e conferir: fundo creme, título em Fredoka, moeda dourada com o rostinho e contorno preto, botão coral com sombra dura, e "Nenhuma jogada ainda" no histórico. (O botão ainda não faz nada; isso vem na Task 3.)

- [ ] **Step 5: Commit**

```bash
git add index.html style.css assets/
git commit -m "feat: página e visual cartoon da moeda"
```

---

### Task 3: Interação — jogar, animar e registrar histórico

**Files:**
- Create: `app.js`

**Interfaces:**
- Consumes: `flipCoin()` de `./coin.js` (Task 1); IDs `coin-stage`, `coin`, `result`, `flip-button`, `history-list`, símbolos `#art-cara`/`#art-coroa` e classes `history-item`, `visually-hidden`, `is-tossing` (Task 2).
- Produces: nada consumido por outras tasks.

- [ ] **Step 1: Criar `app.js`**

```js
import { flipCoin } from './coin.js';

const FLIP_DURATION_MS = 1500;
const MAX_HISTORY = 10;
const FULL_SPINS = 5;
const LABELS = { cara: 'Cara', coroa: 'Coroa' };

const stage = document.getElementById('coin-stage');
const coin = document.getElementById('coin');
const resultText = document.getElementById('result');
const button = document.getElementById('flip-button');
const historyList = document.getElementById('history-list');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// A rotação é acumulada para a moeda sempre girar para a frente,
// inclusive quando o mesmo lado sai duas vezes seguidas.
let rotation = 0;
let flipping = false;

// Próxima rotação: algumas voltas completas, parando na face sorteada
// (0° mostra a cara, 180° mostra a coroa).
function nextRotation(result) {
  const spun = rotation + FULL_SPINS * 360;
  const faceAngle = result === 'cara' ? 0 : 180;
  return spun - (spun % 360) + faceAngle;
}

function addToHistory(result) {
  const item = document.createElement('li');
  item.className = 'history-item';
  item.title = LABELS[result];
  item.innerHTML =
    `<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#art-${result}"></use></svg>` +
    `<span class="visually-hidden">${LABELS[result]}</span>`;

  historyList.prepend(item);
  while (historyList.children.length > MAX_HISTORY) {
    historyList.lastElementChild.remove();
  }
}

function showResult(result) {
  resultText.textContent = `Deu ${LABELS[result].toUpperCase()}!`;
  addToHistory(result);
  flipping = false;
  button.removeAttribute('aria-disabled');
}

function flip() {
  // Ignora cliques enquanto a moeda ainda está girando.
  if (flipping) return;
  flipping = true;
  // aria-disabled em vez de disabled: mantém o foco no botão para quem usa teclado.
  button.setAttribute('aria-disabled', 'true');

  const result = flipCoin();
  const animate = !reducedMotion.matches;
  rotation = nextRotation(result);

  coin.style.transition = animate
    ? `transform ${FLIP_DURATION_MS}ms cubic-bezier(0.2, 0.7, 0.3, 1)`
    : 'none';
  coin.style.transform = `rotateY(${rotation}deg)`;

  if (!animate) {
    showResult(result);
    return;
  }

  resultText.textContent = 'Girando...';
  // Remove e recoloca a classe para reiniciar a animação de pulo.
  stage.classList.remove('is-tossing');
  void stage.offsetWidth;
  stage.classList.add('is-tossing');

  setTimeout(() => showResult(result), FLIP_DURATION_MS);
}

button.addEventListener('click', flip);
```

- [ ] **Step 2: Garantir que os testes automatizados continuam passando**

Run: `npm test`
Expected: PASS, `# pass 2`, `# fail 0`.

- [ ] **Step 3: Subir o servidor local**

```bash
python3 -m http.server 8000
```

Abrir `http://localhost:8000` e confirmar que o console do navegador não mostra erros.

- [ ] **Step 4: Checagem manual (cobre a Review Focus)**

Com a página aberta, verificar cada item:

1. Clicar em "Jogar moeda!" → a moeda pula e gira ~1,5 s, aparece "Girando..." e depois "Deu CARA!" ou "Deu COROA!"; a face visível bate com o texto; um item entra no início do histórico.
2. Clicar várias vezes rapidamente durante o giro → só uma jogada é registrada no histórico.
3. Pressionar Tab até o botão e jogar com Espaço; ao terminar, apertar Espaço de novo sem clicar em nada → joga novamente (foco não se perdeu).
4. Jogar até sair o mesmo lado duas vezes seguidas → a moeda gira nas duas vezes.
5. Jogar 12 vezes → o histórico mostra exatamente 10 itens, o mais recente à esquerda.
6. Ativar "reduzir movimento" (DevTools → Rendering → Emulate CSS `prefers-reduced-motion: reduce`) → a moeda troca de face sem girar/pular e o resultado aparece na hora.
7. DevTools em modo responsivo a 320 px de largura → sem rolagem horizontal; tudo visível.
8. Recarregar a página → histórico volta a "Nenhuma jogada ainda" (nada é persistido).

Se algum item falhar, corrigir `app.js`/`style.css` antes do commit.

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat: jogar moeda com animação e histórico"
```

---

### Task 4: README e licença

**Files:**
- Create: `LICENSE`
- Create: `README.md`

**Interfaces:**
- Consumes: estrutura de arquivos das Tasks 1–3.
- Produces: nada.

- [ ] **Step 1: Criar `LICENSE` (MIT)**

```text
MIT License

Copyright (c) 2026 Rafael Craice

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: Criar `README.md`**

````markdown
# 🪙 Cara ou Coroa

Um jogo simples de cara ou coroa com visual cartoon. Clique no botão, veja a moeda girar e descubra o resultado.

**Jogue agora:** https://craice.github.io/headortails/

## Como funciona

- O sorteio usa `crypto.getRandomValues`, o gerador aleatório do próprio navegador, com chance exata de 50% para cada lado.
- Os últimos 10 resultados aparecem abaixo do botão e somem ao recarregar a página.
- Feito com HTML, CSS e JavaScript puro — sem frameworks, sem dependências e sem etapa de build.

## Rodando localmente

Como o projeto usa módulos JavaScript, abrir o `index.html` direto (duplo clique) não funciona. Use um servidor local simples:

```bash
python3 -m http.server 8000
```

E acesse http://localhost:8000.

## Testes

Os testes cobrem a lógica do sorteio e usam o executor nativo do Node (versão 20 ou superior), sem instalar nada:

```bash
npm test
```

Eles também rodam automaticamente no GitHub a cada push e pull request.

## Estrutura

| Arquivo | Função |
|---|---|
| `index.html` | Página e desenhos das faces da moeda (SVG) |
| `style.css` | Visual cartoon e animação |
| `app.js` | Liga o botão, a animação e o histórico |
| `coin.js` | Lógica do sorteio |
| `tests/` | Testes do sorteio |

## Privacidade

Este projeto não coleta nenhum dado: sem cookies, sem analytics, sem armazenamento e sem requisições a serviços de terceiros. A hospedagem é feita pelo GitHub Pages, que mantém seus próprios registros de acesso conforme a [política de privacidade do GitHub](https://docs.github.com/pt/site-policy/privacy-policies/github-general-privacy-statement).

## Créditos

- Fonte [Fredoka](https://fonts.google.com/specimen/Fredoka), licenciada sob a SIL Open Font License (veja `assets/fonts/OFL.txt`).

## Licença

[MIT](LICENSE) — use, estude, modifique e compartilhe à vontade.
````

- [ ] **Step 3: Conferir que tudo está versionado e os testes passam**

Run: `npm test && git status --short`
Expected: testes PASS; `git status` mostrando apenas `LICENSE` e `README.md` como novos.

- [ ] **Step 4: Commit**

```bash
git add LICENSE README.md
git commit -m "docs: README em português e licença MIT"
```

---

## Publicação (manual, fora do escopo de execução)

Feita pelo Rafael após revisar, ou por Claude com confirmação explícita:

1. Criar o repositório público `craice/headortails` no GitHub.
2. `git remote add origin git@github.com:craice/headortails.git && git push -u origin main`
3. No GitHub: *Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save*.
4. Aguardar ~1 min e abrir https://craice.github.io/headortails/.
