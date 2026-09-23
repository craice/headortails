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
