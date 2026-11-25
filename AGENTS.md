# Regras do projeto Franlin Car Veículos

## Manual obrigatório

- Toda mudança funcional, de UI ou de dados **DEVE** atualizar `MANUAL.md` na mesma alteração.
- Inclua nessa regra: rótulos, validações, fluxos, status, estoque, pagamentos, caixa, importação, exportação, mensagens e quaisquer recursos novos ou removidos.
- Preserve um H1, seções H2 numeradas e IDs explícitos como `{#inicio}` e `{#ordens}`. Os links **Como usar** dependem desses IDs.
- Mantenha o rodapé do manual na versão do aplicativo.
- Não documente recursos inexistentes.

## Arquitetura e dependências

- Mantenha o frontend totalmente estático, com HTML, CSS e JavaScript puro em ES modules.
- Use Supabase Auth e PostgREST para login por e-mail/senha e sincronização entre dispositivos, sem SDK nem dependências de runtime.
- Não adicione dependências de runtime, build ou teste. Testes usam somente a biblioteca padrão do Node.js.
- A chave legada `fcv.store.v1` deve ser migrada somente após escolha explícita da pessoa usuária. O cache atual é separado por usuário e dispositivo.
- Preserve RLS, isolamento por `owner_id`, controle por `revision`, idempotência por `mutation_id` e resolução explícita de conflitos. Nunca sobrescreva automaticamente estoque ou financeiro.
- Mantenha alterações offline em outbox e envie quando houver conexão. O service worker pode guardar apenas o shell estático da mesma origem, nunca respostas do Supabase.
- Não altere regras de estoque ou financeiro apenas para fazer um teste passar.

## Segurança

- Escape todo dado fornecido pelo usuário antes de inseri-lo em HTML ou atributos. Use `escapeHtml`, `esc` ou `attr`.
- Não insira conteúdo não confiável com `innerHTML` sem escape.
- Sanitize links e mantenha `rel="noopener noreferrer"` em links externos.
- Não coloque senhas, tokens, credenciais, backups ou dados pessoais no repositório.
- Use somente a chave pública `anon` no navegador. A chave `service_role` é proibida no frontend.
- `config.json` e `.env` são locais e ignorados pelo Git. No GitHub Pages, gere `config.json` apenas no deploy a partir dos secrets `SUPABASE_URL` e `SUPABASE_ANON_KEY`.
- Não adicione badges ou links promocionais do Base44, Qoder ou de hospedagem.

## Qualidade e entrega

- Execute `npm test` antes de concluir qualquer alteração.
- Atualize os testes quando as regras de dados mudarem; os testes devem verificar o comportamento real.
- O CI deve bloquear alterações em `index.html`, `styles.css`, `js/*`, `assets/*`, `sw.js` ou `supabase/*.sql` sem atualização de `MANUAL.md`.
- Use somente ações oficiais do GitHub no workflow.
- Não faça commit ou push sem autorização explícita.
