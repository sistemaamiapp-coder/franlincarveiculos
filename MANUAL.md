# Manual do Franlin Car Veículos

Bem-vindo ao manual do **Franlin Car Veículos**, versão **1.4.0**. O sistema organiza as **ordens de serviço**, chamadas de **O.S.**, e o **estoque da loja** de forma simples e direta.

Os dados da conta ficam salvos na nuvem e também em cache no dispositivo. Com internet, as alterações aparecem nos outros computadores que usam a mesma conta. Contas diferentes têm dados separados.

## 1. Início e primeiros passos {#inicio}

### O que o sistema faz

- Abre e acompanha ordens de serviço com peças, mão de obra, desconto, observações e pagamento.
- Permite identificar cliente e veículo diretamente na O.S., sem cadastro obrigatório.
- Oferece cadastros opcionais de cliente e veículo dentro da própria O.S. para reutilizar dados.
- Acompanha os status **Orçamento**, **Aprovada**, **Faturada** e **Cancelada**.
- Oferece uma área independente de estoque com peças, entradas, saídas, estoque mínimo e histórico.
- Baixa automaticamente as peças usadas ao aprovar uma O.S. e faz os estornos necessários.
- Prepara mensagens para envio manual pelo WhatsApp.
- Imprime a O.S. ou permite salvá-la em PDF pelo navegador.
- Sincroniza os dados entre dispositivos e mantém alterações offline até a conexão voltar.

Além das O.S., o sistema possui a tela **Estoque**. Cliente e veículo continuam opcionais e são identificados diretamente na ordem ou por cadastros abertos dentro dela. Não há telas de painel, compras, fornecedores, despesas ou caixa.

### Sequência para começar

1. Entre na sua conta ou crie uma conta.
2. Abra **Ordens de serviço** e clique em **Nova O.S.**
3. No passo 1, informe cliente e veículo se quiser. Os dois são opcionais.
4. Descreva o problema e clique em **Continuar para peças e serviços**.
5. Adicione pelo menos uma peça ou um serviço de mão de obra.
6. Confira a revisão e salve a O.S. como Orçamento.
7. Se houver telefone válido com DDD, envie a mensagem preparada pelo WhatsApp.
8. Na O.S. salva, acompanhe aprovação, faturamento, recebimento ou cancelamento.

## 2. Acesso, navegação e sincronização {#acesso}

### Como entrar

1. Abra o endereço do sistema em um navegador atualizado.
2. Na tela **Entrar na sua conta**, informe seu e-mail e sua senha.
3. Se for o primeiro acesso, clique em **Criar conta** e preencha e-mail, senha e repetição da senha.
4. A conta abre diretamente após o cadastro. Não é necessário confirmar o e-mail.
5. Use **Manter conectado neste computador** somente em um dispositivo próprio e protegido.

Se esquecer a senha, clique em **Esqueci minha senha**, informe o e-mail e siga o link recebido. Confira também a caixa de spam. O sistema não mostra nem reenvia sua senha atual.

Use **Sair** no topo quando terminar, principalmente em computador compartilhado.

### Como navegar

O menu oferece:

- **Nova O.S.:** inicia um novo atendimento.
- **Ordens de serviço:** lista, busca e filtra as ordens.
- **Estoque:** cadastra peças, registra entradas e saídas e consulta o histórico.
- **Ajuda e manual:** mostra a situação da conta e, no final da página, o manual completo.

No computador, o menu fica à esquerda. Em tela pequena, toque no botão de menu no topo. A interface usa azul e branco, com menu azul-marinho e área de trabalho clara. Cores de alerta continuam identificando erros, cancelamentos e ações de exclusão. Os endereços usam `#`, por exemplo, `#/ordens`; isso é normal e não compartilha dados sem login.

A página volta ao início somente ao trocar de tela ou de passo do assistente. Atualizações automáticas de sincronização não alteram a posição de leitura.

Se você abrir um endereço antigo de outra área, o sistema volta automaticamente para **Ordens de serviço**. Nenhum dado é apagado nesse redirecionamento.

### Como aumentar ou diminuir a letra

No topo, use **A+** para aumentar e **A−** para diminuir. As opções são **Normal**, **Grande** e **Maior**. O sistema usa tema claro, com contraste reforçado e controles grandes, e o navegador também pode ampliar a página.

### Como acompanhar a sincronização

O selo no topo e no menu mostra:

- **Sincronizado:** os dados exibidos foram confirmados pela nuvem.
- **Sincronizando:** uma operação está sendo enviada ou recebida.
- **Offline:** há alterações guardadas neste dispositivo aguardando conexão.
- **Falha na sincronização:** houve erro de rede ou do servidor.
- **Sessão expirada:** entre novamente com a mesma conta.
- **Conflito de dados:** existem versões diferentes e nenhuma escolha automática foi feita.
- **Migração pendente:** é necessário escolher como tratar dados locais antigos.

Para conferir manualmente, abra **Ajuda e manual** e clique em **Sincronizar agora**. O sistema também verifica a nuvem periodicamente, ao voltar para a aba e ao recuperar a conexão.

Depois que o sistema já foi carregado, é possível consultar e alterar dados sem internet. As alterações ficam pendentes e são enviadas quando a conexão voltar. Não feche o navegador imediatamente após uma operação importante se ainda houver alterações pendentes.

### Como resolver um conflito

Um conflito acontece quando dois dispositivos alteram os mesmos dados antes de uma das versões ser confirmada. O sistema bloqueia novas alterações para não escolher uma versão errada.

1. Leia a tela **Resolva o conflito de dados**.
2. Clique em **Usar dados da nuvem** se a nuvem estiver correta.
3. Clique em **Usar dados deste computador** se o dispositivo atual estiver correto. A versão anterior da nuvem será arquivada antes da substituição.
4. Aguarde **Sincronizado** e confira a O.S.

Não tente resolver o conflito apagando o cache ou alterando o banco manualmente.

### Como migrar dados locais antigos

Se o sistema encontrar dados da versão anterior neste navegador, aparece **Escolha quais dados usar**. Nada é substituído automaticamente.

- **Usar dados da nuvem:** mantém os dados que já estão na conta.
- **Usar dados deste computador:** envia os dados locais antigos para a conta. Se já houver dados na nuvem, a versão anterior será arquivada no servidor.

O arquivo local antigo não é apagado pelo sistema.

## 3. Ordens de serviço: assistente de três passos {#ordens}

A O.S. reúne cliente, veículo, problema, peças, serviços e valores. Uma nova O.S. começa normalmente como **Orçamento**.

O número sugerido segue o formato `OS-0001`, `OS-0002` e assim por diante. Você pode alterá-lo na revisão, mas não pode repetir um número já usado.

### Passo 1: dados do atendimento

Cliente e veículo são opcionais. Você pode registrar a O.S. somente com o problema e os serviços.

#### Identificar o cliente

Preencha **Nome do cliente** e **Telefone / WhatsApp** diretamente na O.S., sem criar cadastro.

Se quiser manter um cadastro para reutilizar os dados, clique em **Cadastrar cliente**. Para esse cadastro formal, nome e telefone são obrigatórios; o e-mail é opcional. Ao salvar, os dados do cliente são preenchidos automaticamente na O.S.

O telefone da O.S. tem prioridade sobre o telefone do cadastro. Para liberar o WhatsApp, informe um telefone brasileiro válido com DDD, como `(27) 99999-1010`.

#### Identificar o veículo

Preencha **Placa** e **Veículo / modelo** diretamente na O.S., sem criar cadastro.

Se quiser manter um cadastro, clique em **Cadastrar veículo**. A janela pede um cliente cadastrado e a placa; os demais dados são opcionais. Ao salvar, a placa e a descrição do veículo são preenchidas automaticamente na O.S.

A janela de cadastro de veículo não recarrega a página. Os dados já digitados na O.S. são mantidos.

Você também pode informar **KM atual**, **data de abertura** e **problema relatado / serviço solicitado**. Cliente e veículo podem ficar em branco.

Clique em **Continuar para peças e serviços**.

### Passo 2: peças e serviços

Adicione pelo menos um item antes de continuar.

#### Adicionar uma peça

1. Clique em **Adicionar peça**.
2. Se não houver nenhuma peça cadastrada, o sistema abre o cadastro da primeira peça. Informe os dados e a quantidade disponível.
3. Se já houver peças cadastradas, selecione a peça desejada.
4. Informe **quantidade** e **valor unitário**.
5. Confira o aviso de estoque e clique em **Adicionar peça**.

A quantidade pode ter casas decimais quando a unidade permitir. O sistema avisa quando a quantidade informada é maior que o estoque disponível. Para cadastrar peças ou repor o estoque antes de atender, abra **Estoque** no menu.

#### Adicionar mão de obra

1. Clique em **Adicionar mão de obra**.
2. Descreva o serviço. Algumas sugestões comuns aparecem durante a digitação.
3. Informe **quantidade** e **valor unitário**.
4. Clique em **Adicionar serviço**.

Use os ícones de lápis para editar um item e de lixeira para removê-lo. O total em peças, mão de obra e o subtotal são calculados automaticamente.

Clique em **Continuar para revisão**.

### Passo 3: revisão e salvamento

Confira cliente, veículo, itens e valores. Se precisar alterar os itens, clique em **Alterar itens**.

Preencha:

- **Número da O.S.**
- **Desconto (R$)**
- **Forma de pagamento**
- **Observações da O.S.**

A O.S. nova é salva somente como **Orçamento**. Não há escolha de status nem marcação de pagamento recebido no formulário; depois de salva, use os botões nos detalhes da ordem para aprovar, faturar, cancelar ou registrar o recebimento.

O desconto não pode ser maior que o subtotal dos itens. As formas de pagamento são **Dinheiro**, **PIX**, **Cartão de débito**, **Cartão de crédito**, **Boleto** e **Transferência**.

Clique em **Salvar O.S.** para somente guardar.

O botão **Salvar e enviar no WhatsApp** aparece quando há telefone válido com DDD e pelo menos um item. Ele salva a O.S., abre os detalhes e mostra a mensagem preparada. Você ainda precisa conferir e enviar no WhatsApp.

## 4. Listar, buscar e acompanhar as O.S. {#acompanhamento}

A tela **Ordens de serviço** mostra três resumos:

- **Em andamento:** orçamentos e serviços aprovados.
- **Faturadas:** ordens já faturadas.
- **A receber:** total de O.S. faturadas e ainda não pagas.

Use os filtros de status ou a busca para localizar por número, cliente, placa, veículo ou problema. Clique em uma O.S. para abrir os detalhes.

Nos detalhes, você pode:

- Conferir cliente, telefone, veículo, problema, itens, total e observações.
- Editar a O.S. e seus itens.
- Aprovar, faturar, cancelar ou reabrir a ordem.
- Marcar o pagamento como recebido ou não recebido.
- Gerenciar os veículos de um cliente cadastrado.
- Enviar uma mensagem pelo WhatsApp.
- Imprimir ou salvar a O.S. em PDF.
- Excluir a O.S., com confirmação.

Ao excluir uma O.S., as peças que haviam sido baixadas são estornadas. As O.S. antigas conservam uma cópia dos dados de cliente e veículo usados no atendimento.

## 5. Status, estoque e pagamento da O.S. {#status-os}

### Orçamento

É o único status usado ao salvar uma O.S. nova. Serve para conferir e enviar o orçamento antes da aprovação. Nenhuma peça sai do estoque.

Quando o cliente aprovar, clique em **Cliente aprovou**.

### Aprovada

Indica que o serviço foi autorizado. Nesse momento, as peças usadas são baixadas do estoque uma única vez.

Quando o serviço terminar, clique em **Faturar O.S.**

### Faturada

Indica que o serviço foi concluído e faturado. O recebimento é controlado nos detalhes da própria O.S., sem uma tela separada de contas a receber. Nesse status, você pode:

- Clicar em **Marcar como recebida** quando o pagamento entrar.
- Clicar em **Marcar como não pago** se precisar corrigir o recebimento.
- Avisar o cliente que está pronto ou enviar uma cobrança pelo WhatsApp.

### Cancelada

Encerra a O.S. sem faturamento. Se as peças já haviam sido baixadas, elas voltam ao estoque. Uma O.S. cancelada pode ser **reaberta como orçamento**.

O consumo de peças pela O.S. segue as regras da seção **Estoque da loja**. O orçamento não baixa estoque; a aprovação faz a saída automática uma única vez.

## 6. Estoque da loja {#estoque}

A tela **Estoque** é independente das O.S. Ela mostra o total de peças cadastradas, as unidades disponíveis, o valor de custo e os alertas de reposição.

### Cadastrar uma peça

1. Abra **Estoque** no menu e clique em **Nova peça**.
2. Informe o nome e, se quiser, código, marca, categoria, unidade, fornecedor, localização, preços e estoque mínimo.
3. Informe o **estoque inicial**.
4. Clique em **Salvar peça**. O estoque inicial fica registrado como entrada no histórico.

Para alterar dados da peça, use o lápis na lista. A quantidade em estoque não é editada diretamente: use **Entrada / saída** para preservar o histórico.

### Dar entrada ou saída manual

1. Em **Estoque**, clique em **Entrada / saída**.
2. Escolha a peça e o tipo **Entrada** ou **Saída**.
3. Informe a quantidade, o motivo, a data e, se quiser, uma referência, como o número da nota fiscal.
4. Clique em **Registrar movimentação**.

Entradas aumentam o saldo. Saídas diminuem o saldo e não podem ser maiores que a quantidade disponível. Toda operação guarda o saldo anterior, o saldo novo, a data, o motivo e a referência.

Não registre uma saída manual para uma peça usada em O.S. O sistema faz essa baixa automaticamente quando a ordem é aprovada.

### Consultar histórico e alertas

- Clique em **Histórico** na linha da peça para ver todas as entradas e saídas dela.
- Clique em **Movimentações** para consultar o histórico geral e filtrar por entradas ou saídas.
- O aviso **Repor** aparece quando o saldo chega ao estoque mínimo ou fica abaixo dele.
- O número ao lado de **Estoque** no menu indica quantas peças precisam de reposição.

### Baixa automática pelas O.S.

- **Orçamento:** não baixa peças.
- **Aprovada:** baixa as peças usadas uma única vez. Itens da mesma peça são somados antes da baixa.
- **Faturada:** não faz nova baixa, pois as peças já foram descontadas na aprovação.
- **Cancelada ou reaberta:** devolve ao estoque as peças que haviam sido baixadas.
- **Edição dos itens:** estorna a quantidade anterior e registra a nova quantidade, sem duplicar a saída.
- **Exclusão da O.S.:** devolve as peças baixadas ao estoque.

O sistema não permite aprovar uma O.S. com quantidade de peça maior que o disponível. Nesse caso, registre uma entrada em **Estoque** ou ajuste os itens da ordem antes de aprovar.

## 7. WhatsApp, impressão e PDF {#mensagens}

### Enviar uma mensagem pelo WhatsApp

1. Confira se a O.S. tem telefone válido com DDD.
2. Na revisão, clique em **Salvar e enviar no WhatsApp** ou, nos detalhes, escolha a ação de mensagem adequada ao status.
3. Na janela **Mensagem para o cliente**, confira o número.
4. Edite o texto se necessário.
5. Clique em **Abrir WhatsApp**.
6. No WhatsApp, revise novamente e toque em enviar.

A mensagem preparada pode conter o número da O.S., cliente, veículo, itens, total e o texto adequado ao status. O telefone informado diretamente na O.S. tem prioridade sobre o cadastro.

O sistema **não envia mensagens sozinho** e não guarda o conteúdo da conversa. O envio depende de você e do WhatsApp. O botão **Copiar texto** permite copiar a mensagem para outro aplicativo.

### Imprimir ou salvar em PDF

1. Abra os detalhes da O.S.
2. Clique em **Imprimir / salvar PDF**.
3. Na janela de impressão do navegador, escolha a impressora ou a opção **Salvar como PDF**.
4. Confira a prévia e confirme.

O documento impresso usa fundo branco, mesmo com o tema claro do sistema. Para imprimir o manual, abra **Ajuda e manual**, role até o final e clique em **Imprimir manual**.

## 8. Dados, segurança e conservação {#seguranca}

- Use somente a chave pública do Supabase no navegador. A chave privada `service_role` nunca deve ser usada no sistema.
- Não coloque senhas, tokens ou dados pessoais em links, mensagens ou arquivos do projeto.
- Os dados são separados por conta e dispositivo, com proteção de acesso no servidor.
- O cache local permite consultar dados já carregados e continuar trabalhando offline.
- O service worker guarda somente os arquivos estáticos do sistema; não guarda respostas da nuvem.
- Alterações concorrentes são bloqueadas até que você escolha explicitamente qual versão manter.
- Cliente e veículo são opcionais; cadastre-os somente quando quiser reutilizar informações.
- Excluir um cliente ou veículo vinculado não apaga as O.S. anteriores, porque cada ordem guarda os dados usados no atendimento.

Se o navegador informar que o armazenamento está cheio, leia o aviso na tela e evite limpar os dados do site. Entre novamente com a mesma conta e confira a sincronização.

## 9. Solução de problemas {#problemas}

### A página recarrega ao cadastrar o veículo na O.S.

O cadastro de veículo abre em uma janela e não deve recarregar a página. Se isso acontecer:

1. Atualize o sistema para a versão mais recente.
2. Use um navegador atualizado.
3. Confira se os dados digitados continuam na O.S. antes de tentar novamente.
4. Salve o veículo e confirme se ele foi selecionado automaticamente.

### Não aparece o botão de WhatsApp

O botão **Salvar e enviar no WhatsApp** exige:

- Telefone brasileiro válido com DDD.
- Pelo menos um item na O.S.

Corrija o telefone no passo 1 ou adicione um serviço no passo 2. Se o telefone vier do cadastro do cliente, confira se ele está atualizado.

### O WhatsApp abre, mas a mensagem não é enviada

O sistema somente prepara o texto e abre o WhatsApp. Revise a conversa e toque em enviar dentro do WhatsApp. Confira também se o número pertence ao cliente e se o aplicativo está conectado.

### A O.S. não pode ser aprovada

Verifique se há peças em quantidade suficiente. Orçamentos não baixam estoque, mas a aprovação exige que todas as peças usadas estejam disponíveis. Abra **Estoque** para dar entrada ou corrija os itens da O.S. antes de aprovar.

### O número da O.S. já existe

Cada número é único. Altere o número na revisão para um valor ainda não usado.

### Os dados não aparecem em outro computador

1. Confira se entrou com a mesma conta.
2. Confira o selo de sincronização.
3. Abra **Ajuda e manual** e clique em **Sincronizar agora**.
4. Se estiver offline, reconecte-se à internet e aguarde o envio das alterações.
5. Se aparecer conflito, escolha a versão correta na tela exibida.

### A sessão expirou

Entre novamente com a mesma conta. As alterações pendentes deste dispositivo serão enviadas depois do novo acesso. O sistema não confunde sessão expirada com falta de internet.

## 10. Perguntas frequentes {#faq}

### Preciso cadastrar cliente e veículo para abrir uma O.S.?

Não. Você pode deixar os dois em branco ou digitar somente os dados necessários para identificar o atendimento.

### Onde cadastro cliente e veículo?

Dentro da própria O.S., no passo 1. O cadastro é opcional e serve para reutilizar dados. Para salvar um cliente formal, nome e telefone são obrigatórios; o e-mail não é exigido.

### O sistema envia o WhatsApp automaticamente?

Não. Ele salva a O.S. e prepara a mensagem. Você revisa e envia no WhatsApp.

### Existe estoque separado?

Sim. Abra **Estoque** no menu para cadastrar peças, dar entradas e saídas manuais e consultar o histórico. As peças usadas em O.S. aprovadas são baixadas automaticamente, sem necessidade de saída manual. Não há telas separadas de compras ou financeiro.

### Posso trabalhar sem internet?

Sim, depois que o sistema e os dados da conta já foram carregados. As alterações ficam guardadas neste dispositivo e são enviadas quando a conexão voltar.

### O que acontece com dados de versões anteriores?

Eles continuam preservados. Se for necessário migrar dados locais antigos, o sistema pede uma escolha explícita antes de substituir qualquer versão.

## 11. Manutenção deste manual {#manutencao}

O manual deve acompanhar o aplicativo. Toda mudança funcional, de interface ou de dados deve atualizar `MANUAL.md` na mesma alteração, incluindo rótulos, validações, fluxos, status, estoque, pagamento, mensagens e recursos novos ou removidos.

- Preserve um H1, seções H2 numeradas e IDs explícitos como `{#inicio}` e `{#ordens}`.
- Os links **Como usar** dependem desses IDs.
- Mantenha o rodapé na mesma versão do aplicativo.
- Não documente recursos inexistentes.
- Execute `npm test` antes de concluir qualquer alteração.

---

Franlin Car Veículos · Manual do usuário · Versão 1.4.0
