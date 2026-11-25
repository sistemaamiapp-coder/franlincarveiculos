# Regras do projeto Franlin Car Veículos

## Manual obrigatório

- Toda mudança funcional, de UI ou de dados **DEVE** atualizar `MANUAL.md` na mesma alteração.
- Inclua nessa regra: rótulos, validações, fluxos, status, estoque, pagamentos, caixa, importação, exportação, mensagens e quaisquer recursos novos ou removidos.
- Preserve um H1, seções H2 numeradas e IDs explícitos como `{#inicio}` e `{#ordens}`. Os links **Como usar** dependem desses IDs.
- Mantenha o rodapé do manual na versão do aplicativo.
- Não documente recursos inexistentes.

## Arquitetura e dependências

- Mantenha o aplicativo totalmente estático, sem login, backend ou serviço externo.
- Use HTML, CSS e JavaScript puro com ES modules.
- Não adicione dependências de runtime, build ou teste. Testes usam somente a biblioteca padrão do Node.js.
- Os dados locais usam a chave `fcv.store.v1` e não são sincronizados entre dispositivos ou pessoas. Abas da mesma origem podem recarregar alterações salvas; não transforme isso em sincronização em nuvem ou acesso multiusuário.
- Não altere regras de estoque ou financeiro apenas para fazer um teste passar.

## Segurança

- Escape todo dado fornecido pelo usuário antes de inseri-lo em HTML ou atributos. Use `escapeHtml`, `esc` ou `attr`.
- Não insira conteúdo não confiável com `innerHTML` sem escape.
- Sanitize links e mantenha `rel="noopener noreferrer"` em links externos.
- Não coloque senhas, tokens, credenciais, backups ou dados pessoais no repositório.
- Não adicione badges ou links promocionais do Base44, Qoder ou de hospedagem.

## Qualidade e entrega

- Execute `npm test` antes de concluir qualquer alteração.
- Atualize os testes quando as regras de dados mudarem; os testes devem verificar o comportamento real.
- O CI deve bloquear alterações em `index.html`, `styles.css`, `js/*` ou `assets/*` sem atualização de `MANUAL.md`.
- Use somente ações oficiais do GitHub no workflow.
- Não faça commit ou push sem autorização explícita.
