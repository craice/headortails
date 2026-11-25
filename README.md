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

- Feito por [Rafael Craice](https://craice.me).
- Fonte [Fredoka](https://fonts.google.com/specimen/Fredoka), licenciada sob a SIL Open Font License (veja `assets/fonts/OFL.txt`).

## Licença

[MIT](LICENSE) — use, estude, modifique e compartilhe à vontade.
