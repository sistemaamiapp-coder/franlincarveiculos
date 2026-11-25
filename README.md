# Franlin Car Veículos

Sistema estático de gestão para oficina, em português brasileiro, sem login e sem dependências externas. A versão atual é **1.0.1**.

## Recursos

- Clientes, veículos, fornecedores e catálogo de peças.
- Ordens de serviço com assistente de três passos, peças, mão de obra, desconto e pagamento.
- Status Orçamento, Aprovada, Faturada e Cancelada, com baixa e estorno automático de estoque.
- Movimentações de estoque, compras, despesas, contas a receber e a pagar.
- Resumo mensal de caixa baseado nas datas de pagamento.
- Mensagens preparadas para confirmação e envio manual no WhatsApp.
- Impressão da O.S. e salvamento em PDF pelo navegador.
- Cópia de segurança JSON, restauração, limpeza e dados de exemplo.
- Manual completo incorporado ao sistema.

## Endereço de publicação

GitHub Pages: https://sistemaamiapp-coder.github.io/franlincarveiculos/

O site é público, mas os dados de cada usuário ficam somente no navegador e no dispositivo onde foram registrados. Não há sincronização entre dispositivos ou pessoas nem acesso multiusuário. Abas da mesma origem podem receber alterações salvas umas das outras.

## Prévia local

Execute os comandos a partir da raiz do projeto.

### Windows PowerShell

```powershell
.\scripts\preview.ps1
```

O script requer Python, não instala programas e serve a raiz em `http://127.0.0.1:8080`. Pressione `Ctrl+C` para encerrar.

### Python, em qualquer sistema com Python disponível

```sh
python -m http.server 8080
```

Abra `http://127.0.0.1:8080`. Use um servidor HTTP; abrir `index.html` diretamente pode bloquear módulos e o carregamento do manual.

## Dados e cópias

Os dados são armazenados no `localStorage`, na chave `fcv.store.v1`. Limpar os dados do site, usar modo privado, trocar de navegador ou trocar de dispositivo pode deixar os registros indisponíveis.

Use **Ajuda e manual > Baixar cópia** com frequência. O JSON exportado contém dados pessoais e financeiros, não é criptografado e deve ser guardado com segurança. Restaurar uma cópia ou apagar todos os dados substitui o conteúdo local.

## Manual

O manual canônico está em [`MANUAL.md`](MANUAL.md) e é carregado dentro do sistema em **Ajuda e manual**. Toda mudança funcional, de interface ou de dados deve atualizar esse arquivo na mesma alteração.

## Estrutura

```text
.
├── index.html
├── styles.css
├── MANUAL.md
├── README.md
├── AGENTS.md
├── package.json
├── .nojekyll
├── assets/
├── js/
│   ├── app.js
│   ├── store.js
│   ├── ui.js
│   └── util.js
├── scripts/
│   └── preview.ps1
├── tests/
│   └── smoke.mjs
└── .github/
    ├── dependabot.yml
    └── workflows/
        └── ci.yml
```

## Testes

Requer Node.js 20 ou superior. Não há instalação de dependências.

```sh
npm test
```

O comando executa `node tests/smoke.mjs`, com testes de formatação, armazenamento, estoque, compras, despesas, financeiro e backup. O GitHub Actions executa a mesma suíte e verifica se mudanças em `index.html`, `styles.css`, `js/*` ou `assets/*` também atualizaram `MANUAL.md`.

Não há marca d'água no sistema ou nos PDFs gerados pela impressão do navegador.
