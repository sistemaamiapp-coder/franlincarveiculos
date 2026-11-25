# Franlin Car Veículos

Sistema de gestão para oficina, em português brasileiro, com frontend estático, conta por e-mail/senha e sincronização na nuvem. A versão atual é **1.1.0**.

## Recursos

- Ordens de serviço como tela inicial e recurso principal, com assistente de três passos, peças, mão de obra, desconto e pagamento.
- Abertura de O.S. sem cliente ou veículo, ou com nome, telefone, placa e descrição informados diretamente na O.S.
- Cadastros opcionais de clientes e veículos, inclusive dentro da própria O.S.; o cadastro de cliente exige nome e telefone, mas não e-mail.
- Cadastros auxiliares de fornecedores e catálogo de peças para reutilizar dados.
- Status Orçamento, Aprovada, Faturada e Cancelada, com baixa e estorno automático de estoque.
- Movimentações de estoque, compras, despesas, contas a receber e a pagar.
- Resumo mensal de caixa baseado nas datas de pagamento.
- Mensagens preparadas para confirmação e envio manual no WhatsApp, usando o telefone informado na O.S. ou no cadastro.
- Impressão da O.S. e salvamento em PDF pelo navegador.
- Cópia de segurança JSON, restauração, limpeza e dados de exemplo.
- Interface em tema claro, com controles grandes e três tamanhos de letra.
- Manual completo incorporado ao sistema, após as ferramentas de ajuda.
- Supabase Auth, isolamento por usuário, cache local, operação offline e sincronização automática.
- Controle de concorrência por revisão, idempotência por mutation ID e resolução explícita de conflitos.

## Endereço de publicação

GitHub Pages: https://sistemaamiapp-coder.github.io/franlincarveiculos/

O site é público, mas os dados só podem ser acessados por quem entra em uma conta. A mesma conta pode usar o sistema em vários dispositivos. Contas diferentes possuem espaços de dados separados.

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

Para usar login e nuvem na prévia, copie `config.example.json` para `config.json` e preencha com a URL do projeto Supabase e a chave pública `anon`. O arquivo `config.json` é ignorado pelo Git. Sem configuração, a tela de acesso informa que a nuvem ainda não foi configurada.

## Configuração do Supabase

1. Crie um projeto no Supabase e abra o **SQL Editor**.
2. Execute o conteúdo de [`supabase/schema.sql`](supabase/schema.sql). Ele cria a tabela `fcv_workspaces`, as funções de commit e limpeza do arquivo de conflitos, e as políticas RLS.
3. Em **Authentication > URL Configuration**, cadastre o endereço publicado como Site URL e inclua os endereços de redirecionamento usados para confirmação de e-mail e recuperação de senha. Para prévia local, inclua o endereço local correspondente.
4. Copie a **Project URL** e a chave pública **anon** para `config.json` no ambiente local. Nunca use a chave `service_role` no navegador.
5. No repositório GitHub, cadastre os secrets `SUPABASE_URL` e `SUPABASE_ANON_KEY`. O workflow gera `config.json` somente no artefato de publicação da branch `main`; os valores não são gravados no Git.
6. Publique e valide criação de conta, confirmação de e-mail, recuperação de senha, isolamento entre contas e sincronização entre dois dispositivos.

O Supabase pode ter custos conforme o uso e exige internet para o primeiro acesso e para receber dados de outros dispositivos. Depois de carregar a conta uma vez, o aplicativo mantém cache local e alterações offline, mas o service worker não armazena respostas da API.

## Dados, sincronização e cópias

Cada conta possui um workspace JSONB com o estado completo da aplicação. O cliente usa a API REST do Supabase, sem SDK. O cache é separado por usuário e dispositivo; a chave legada `fcv.store.v1` é reconhecida para migração explícita.

As alterações são guardadas primeiro no dispositivo e enviadas depois. Cada envio usa uma revisão de base e um `mutation_id`; respostas perdidas podem ser repetidas sem duplicar a revisão. Se a nuvem estiver em uma revisão diferente, o aplicativo bloqueia alterações e mostra as duas opções de resolução. A versão anterior da nuvem é arquivada no servidor antes de uma substituição escolhida pela pessoa usuária.

Use **Ajuda e manual > Baixar cópia** com frequência. O JSON exportado contém dados pessoais e financeiros, não é criptografado e deve ser guardado com segurança. Restaurar uma cópia ou apagar todos os dados substitui o conteúdo da conta e sincroniza essa substituição; sem internet, a operação fica pendente.

## Manual

O manual canônico está em [`MANUAL.md`](MANUAL.md) e é carregado dentro do sistema em **Ajuda e manual**. O acesso fica no final do menu e o conteúdo completo aparece depois das ferramentas de conta e cópia de segurança, não no início da página. Toda mudança funcional, de interface ou de dados deve atualizar esse arquivo na mesma alteração.

## Estrutura

```text
.
├── index.html
├── styles.css
├── sw.js
├── MANUAL.md
├── README.md
├── agents.md
├── package.json
├── config.example.json
├── .nojekyll
├── assets/
├── js/
│   ├── app.js
│   ├── store.js
│   ├── ui.js
│   ├── util.js
│   ├── supabase.js
│   └── sync.js
├── supabase/
│   └── schema.sql
├── scripts/
│   └── preview.ps1
├── tests/
│   ├── smoke.mjs
│   ├── auth.mjs
│   ├── sync.mjs
│   └── schema.mjs
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

O comando executa testes de formatação, armazenamento, O.S. com ou sem cadastros, estoque, compras, despesas, financeiro, interface, backup, autenticação REST, sincronização offline, retry, conflitos, schema/RLS, CSP e service worker. O GitHub Actions executa a mesma suíte e verifica se mudanças em `index.html`, `styles.css`, `js/*`, `assets/*`, `sw.js` ou `supabase/*.sql` também atualizaram `MANUAL.md`.

Não há marca d'água no sistema ou nos PDFs gerados pela impressão do navegador.
