// Sorteia um lado da moeda usando o gerador aleatório criptográfico do navegador.
// 256 valores possíveis divididos em pares/ímpares: exatamente 50% para cada lado.
export function flipCoin() {
  const [byte] = crypto.getRandomValues(new Uint8Array(1));
  return byte % 2 === 0 ? 'cara' : 'coroa';
}
