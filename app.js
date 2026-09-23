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
