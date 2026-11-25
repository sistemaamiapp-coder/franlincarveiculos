# Manual do Franlin Car Veículos

Bem-vindo ao manual do **Franlin Car Veículos**, versão **1.0.1**. Este guia explica, passo a passo, como usar o sistema da oficina.

O sistema funciona em um navegador de internet, sem login. Os registros ficam salvos somente no navegador e no dispositivo em que foram digitados. Eles não são sincronizados entre computadores, celulares ou pessoas. Abas abertas no mesmo navegador, perfil e endereço podem receber as alterações salvas umas das outras, como explicado na seção 15.

> **Atenção:** faça uma cópia de segurança toda semana e antes de apagar dados, restaurar uma cópia, limpar o navegador ou trocar de dispositivo. O arquivo de cópia contém dados pessoais e financeiros.

## 1. Início e primeiros passos {#inicio}

### O que o sistema faz

- Cadastra clientes, veículos, fornecedores e peças.
- Monta ordens de serviço, chamadas de **O.S.**, com peças, mão de obra, desconto e pagamento.
- Acompanha os status Orçamento, Aprovada, Faturada e Cancelada.
- Controla entradas, saídas e estornos de estoque.
- Registra compras, despesas, contas a receber e contas a pagar.
- Prepara mensagens para o WhatsApp e documentos para impressão ou PDF.
- Exporta e restaura uma cópia de segurança em arquivo JSON.

### Sequência recomendada para começar

1. Abra o endereço do sistema e leia os avisos de segurança.
2. Cadastre os fornecedores, se for usá-los nas peças e compras.
3. Cadastre as peças e informe o estoque inicial verdadeiro.
4. Cadastre o cliente e o veículo.
5. Abra uma O.S. e monte o orçamento.
6. Envie o orçamento pelo WhatsApp somente depois de conferir a mensagem.
7. Aprove, fatura, receba e acompanhe o estoque e o caixa.

Se quiser apenas conhecer as telas, use os dados de exemplo explicados na seção 14. Não use os dados de exemplo para uma oficina real.

## 2. Primeiro acesso, navegação e tamanho da letra {#acesso}

### Como abrir o sistema

1. Abra um navegador atualizado, como Chrome, Edge ou Firefox.
2. Acesse o endereço público do sistema ou o endereço da prévia local.
3. Não é necessário criar conta, digitar senha ou fazer cadastro.
4. A primeira tela será o **Painel**.

Se você estiver usando uma prévia local, o endereço normalmente será `http://127.0.0.1:8080`. Abra o sistema por um servidor local, não clicando diretamente no arquivo `index.html`.

### Como navegar

- No computador, use o menu à esquerda.
- Em uma tela pequena, toque no botão de menu no topo para abrir as opções.
- O botão **Nova O.S.** inicia um novo atendimento.
- **Painel** mostra o resumo do mês e os avisos.
- **Ordens de serviço** lista os orçamentos e serviços.
- **Clientes** guarda pessoas e veículos.
- **Peças em estoque** controla o disponível e o mínimo.
- **Compras** registra a entrada de peças.
- **Fornecedores** guarda os contatos de compras.
- **Despesas** registra os gastos da oficina.
- **Contas e caixa** mostra recebimentos, pagamentos e pendências.
- **Ajuda e manual** abre este manual e as ferramentas de cópia.

Os endereços das telas usam `#`, por exemplo, `#/ordens`. Isso é normal. Compartilhar o endereço de uma tela não compartilha os dados: cada navegador tem seus próprios registros.

### Como aumentar ou diminuir a letra

1. No topo, encontre o controle **Letra**.
2. Toque em **A+** para aumentar.
3. Toque em **A−** para diminuir.
4. O sistema mostra **Normal**, **Grande** ou **Maior**.

Use o tamanho que facilitar a leitura. O navegador também pode ampliar a página com `Ctrl` e `+`, ou com o gesto de zoom do celular.

### Como preencher valores e quantidades

Os campos de preço, desconto, despesa e valor unitário aceitam centavos. As quantidades de peças também podem ter casas decimais, quando a unidade permitir. Use ponto para separar os centavos, por exemplo, `123.45`, e confira sempre o total antes de salvar. Se o navegador indicar valor inválido, verifique se não há letras ou símbolos de moeda no campo.

## 3. Painel inicial {#painel}

O **Painel** é o ponto de partida. Ele mostra o mês atual e reúne as informações mais usadas.

### Cartões do resumo

- **O.S. em andamento:** quantidade de orçamentos e serviços aprovados.
- **A receber:** total de O.S. faturadas e ainda não pagas.
- **A pagar:** total de compras e despesas pendentes.
- **Resultado do mês:** recebimentos menos compras pagas e despesas pagas.

### Atalhos e avisos

- **Abrir nova O.S.** inicia o assistente de três passos.
- **Cadastrar cliente** abre a tela de clientes.
- **Entrada em peças** abre o lançamento de estoque.
- **Registrar despesa** abre a tela de despesas.
- **Atenção ao estoque** lista peças no estoque mínimo ou abaixo dele. Use **Repor** para fazer uma entrada.
- **Últimas ordens de serviço** mostra os atendimentos atualizados mais recentemente.
- **Últimas movimentações** mostra entradas e saídas recentes.
- **Caixa do mês** resume os valores efetivamente recebidos e pagos.

O aviso de cópia de segurança aparece quando não há cópia recente registrada. A data da cópia é atualizada após o download quando o navegador consegue salvar essa informação. Mesmo com o armazenamento cheio, o arquivo da cópia continua disponível para download.

## 4. Clientes e veículos {#clientes}

### Cadastrar um cliente

1. Abra **Clientes** no menu.
2. Clique em **Novo cliente**.
3. Preencha o **nome**, que é obrigatório.
4. Escolha **Pessoa Física** ou **Pessoa Jurídica**.
5. Informe CPF ou CNPJ, se desejar.
6. Digite o telefone com DDD. Ele é obrigatório no cadastro. Exemplo: `(27) 99999-1010`.
7. Preencha e-mail, endereço, cidade e observações, conforme necessário.
8. Clique em **Salvar cliente**.

O telefone é importante para preparar mensagens do WhatsApp. Um número sem DDD pode impedir a abertura da mensagem.

### Buscar, editar ou excluir um cliente

1. Use a busca para localizar por nome, telefone, CPF/CNPJ, placa, marca ou modelo.
2. Clique em **Editar** no cartão do cliente.
3. Altere os dados e clique em **Salvar cliente**.
4. Para excluir, clique no ícone de lixeira e confirme a exclusão.

> **Atenção:** excluir um cliente também exclui os veículos vinculados a ele. As O.S. antigas não são excluídas, pois guardam uma cópia dos dados usados no atendimento.

### Enviar uma mensagem para o cliente

1. Clique em **WhatsApp** no cartão do cliente.
2. Na janela **Mensagem preparada**, confira o número e edite o texto, se necessário.
3. Clique em **Abrir WhatsApp**.
4. No WhatsApp, revise a mensagem e toque em enviar.

O sistema não envia a mensagem sozinho. O envio depende de você e do WhatsApp.

### Cadastrar um veículo

1. Abra **Clientes**.
2. No cartão do cliente, clique em **Veículos**.
3. Clique em **Adicionar veículo**.
4. Informe a **placa**, que é obrigatória. O sistema a grava em letras maiúsculas e sem espaços.
5. Preencha marca, modelo, ano, cor e quilometragem.
6. Use **Observações** para detalhes permanentes do veículo.
7. Clique em **Salvar veículo**.

### Editar ou excluir um veículo

1. Abra **Veículos** no cartão do cliente.
2. Clique em **Editar** no veículo desejado.
3. Altere os dados e clique em **Salvar veículo**.
4. Para excluir, use a lixeira e confirme.

A exclusão do veículo não apaga as O.S. anteriores. Cada O.S. conserva a placa e a descrição informadas quando foi salva.

## 5. Ordens de serviço: assistente de três passos {#ordens}

A **ordem de serviço**, ou **O.S.**, reúne o cliente, o veículo, o problema, as peças, os serviços e os valores. Uma O.S. começa normalmente como **Orçamento**.

O número sugerido segue o formato `OS-0001`, `OS-0002` e assim por diante. Você pode alterar o número no passo 3, mas não pode repetir um número já usado.

### Antes de abrir uma O.S.

- Confirme se o cliente e o veículo já estão cadastrados.
- Confira o telefone com DDD.
- Cadastre as peças que serão usadas.
- Anote a quilometragem e o problema relatado.

### Passo 1: cliente e veículo

1. Clique em **Nova O.S.**.
2. Em **Cliente**, escolha o nome na lista. O campo é obrigatório.
3. Se necessário, clique em **Novo cliente**, faça o cadastro e volte ao assistente.
4. Em **Veículo do cliente**, escolha o veículo. O campo é obrigatório.
5. Se necessário, clique em **Novo veículo**, cadastre e volte ao assistente.
6. Informe o **KM atual**.
7. Confira a **data de abertura**.
8. Preencha a **previsão de entrega**, se já combinada.
9. Em **Problema relatado / serviço solicitado**, escreva com clareza o que o cliente relatou.
10. Clique em **Continuar para peças e serviços**.

A placa e a descrição do veículo serão copiadas para a O.S. Use **Voltar** ou **Cancelar** se precisar desistir antes de salvar.

### Passo 2: peças e serviços

1. Clique em **Adicionar peça** para usar uma peça do estoque.
2. Escolha a peça.
3. Informe a **quantidade** e o **valor unitário** de venda.
4. Confira a descrição e adicione o item.
5. Clique em **Adicionar mão de obra** para um serviço.
6. Escreva a **descrição do serviço**, a **quantidade** e o **valor unitário**. Ao digitar, podem aparecer sugestões de serviços comuns.
7. Repita a operação para cada peça ou serviço.
8. Use o lápis para editar um item ou a lixeira para removê-lo.
9. Confira o total de peças e o total de mão de obra.
10. Clique em **Continuar para revisão**.

O cartão de cada peça mostra o estoque disponível. Se a quantidade escolhida for maior, o sistema mostra um aviso.

> **Atenção:** o aviso permite montar o orçamento, mas o sistema bloqueia a aprovação ou o faturamento quando não há estoque suficiente. A conferência soma todas as linhas da mesma peça, inclusive linhas repetidas, e também vale ao salvar uma O.S. diretamente como **Aprovada** ou **Faturada**. Reponha o estoque ou ajuste os itens antes de continuar. Sempre confira também a quantidade física.

Enquanto a O.S. estiver em **Orçamento**, nenhuma peça sai do estoque. O desconto é informado no passo 3.

### Passo 3: revisão e salvamento

1. Confira cliente, veículo, quantidade de itens e subtotal.
2. Use **Alterar itens** para voltar ao passo 2, se necessário.
3. Confira o **número da O.S.**.
4. Escolha o **status**. Para enviar um orçamento antes da autorização, deixe **Orçamento**.
5. Informe o **desconto**, em reais, se houver.
6. Escolha a **forma de pagamento**, se já conhecida.
7. Se a O.S. estiver **Faturada**, marque **Pagamento já recebido** somente se o dinheiro já tiver sido recebido.
8. Escreva observações sobre combinações com o cliente ou detalhes internos.
9. Confira **peças**, **mão de obra**, **desconto** e **total da O.S.**. É necessário ter pelo menos um item, e o desconto não pode ser maior que o subtotal dos itens.
10. Clique em **Salvar O.S.**.
11. Se aparecer **Salvar e enviar no WhatsApp**, esse botão salva a O.S. e abre a mensagem preparada. Você ainda precisará conferir e enviar no WhatsApp.

As formas de pagamento disponíveis são: **Dinheiro**, **PIX**, **Cartão de débito**, **Cartão de crédito**, **Boleto** e **Transferência**.

### Editar uma O.S.

1. Abra **Ordens de serviço**.
2. Clique na O.S. desejada.
3. Clique em **Editar O.S.** ou em **Editar itens**.
4. Altere cliente, veículo, datas, problema, itens, desconto, status, pagamento ou observações.
5. Avance até a revisão e clique em **Salvar O.S.**.

> **Atenção:** se uma O.S. aprovada ou faturada tiver seus itens alterados, o sistema estorna o estoque dos itens antigos e baixa o estoque dos itens novos. Verifique o histórico depois de qualquer alteração de peças ou quantidades.

## 6. Status, estoque e pagamento da O.S. {#status-os}

### Significado de cada status

- **Orçamento:** proposta para o cliente. Nenhuma peça sai do estoque.
- **Aprovada:** cliente autorizou o serviço. As peças são baixadas do estoque uma vez.
- **Faturada:** serviço faturado. Se já estava aprovada, as peças não são baixadas novamente.
- **Cancelada:** atendimento encerrado sem execução. Se as peças haviam sido baixadas, elas voltam ao estoque.

### Fluxo normal

1. Salve a O.S. como **Orçamento**.
2. Clique em **Enviar orçamento** e confira a mensagem no WhatsApp.
3. Depois da autorização do cliente, clique em **Cliente aprovou**.
4. Confira as peças baixadas em **Peças em estoque** e no histórico.
5. Quando o serviço for concluído e a O.S. devida, clique em **Faturar O.S.**.
6. Se o cliente pagou, clique em **Marcar como recebida**.
7. Se o pagamento estiver pendente, use **Cobrar no WhatsApp** ou deixe a O.S. em **Contas a receber**.
8. Se o cliente já pagou e você marcou por engano, clique em **Marcar como não pago**.

A data de faturamento é registrada no primeiro faturamento. A data de pagamento é usada no caixa do mês.

### Cancelar e reabrir

1. Abra a O.S.
2. Em **Cancelar O.S.**, confirme a ação. O botão é oferecido para Orçamento e Aprovada.
3. O status muda para **Cancelada**.
4. Se as peças haviam sido baixadas, o sistema cria um estorno e devolve as quantidades.
5. Para continuar o atendimento, clique em **Reabrir como orçamento**.
6. Reabrir não baixa estoque. Uma nova aprovação fará a baixa.

Uma O.S. **Faturada** não mostra o botão comum de cancelamento. Se realmente precisar cancelá-la, use **Editar O.S.**, mude o status para **Cancelada** e salve. O estoque será estornado. Faça isso somente com certeza e depois confira o financeiro e o histórico.

### Excluir uma O.S.

1. Abra a O.S.
2. Clique em **Excluir O.S.** e confirme.
3. A O.S. será removida.
4. Se ela havia baixado peças, o sistema fará o estorno antes de excluir.

> **Atenção:** excluir é definitivo. Não exclua uma O.S. apenas para corrigir um valor ou um status; prefira editar.

### Pagamento e caixa

- O controle de recebimento fica disponível na O.S. **Faturada**.
- **Marcar como recebida** usa a data de hoje quando ainda não existe data de pagamento.
- **Marcar como não pago** limpa a data e devolve a O.S. para as contas a receber.
- A data de pagamento, e não a data de abertura ou faturamento, determina o mês do recebimento.

Na versão atual, a tela da O.S. não possui um campo separado para escolher outra data de recebimento. Se a data ficou errada, marque como não pago e marque novamente no dia correto.

## 7. WhatsApp, impressão e PDF {#mensagens}

### Preparar uma mensagem no WhatsApp

1. Confira se o cliente tem telefone com DDD.
2. Abra a O.S. ou o cartão do cliente.
3. Clique no botão de WhatsApp adequado: orçamento, andamento, cobrança, aviso de que está pronto ou mensagem cancelada.
4. Na janela **Mensagem preparada**, confira o destinatário e leia o texto inteiro.
5. Altere a mensagem ali mesmo, se necessário. **Copiar texto** é opcional.
6. Clique em **Abrir WhatsApp**.
7. No WhatsApp, confira novamente nome, placa, valores, datas e condições.
8. Toque em **Enviar** dentro do WhatsApp.

> **Atenção:** o sistema não envia mensagens automaticamente. Ele não usa uma API automática do WhatsApp, não confirma entrega e não guarda o histórico das conversas. A mensagem só é enviada quando você confirma no WhatsApp.

Se o WhatsApp não abrir, confira o telefone, o DDD e a permissão do navegador para abrir links. Use um telefone brasileiro com 10 ou 11 dígitos. Exemplos: `(11) 98765-4321` ou `11987654321`. A preparação da mensagem também reconhece números já informados com o código do país, como `5511987654321` ou `+55 11 98765-4321`. Sempre confira o destinatário exibido antes de abrir o WhatsApp.

### Imprimir ou salvar uma O.S. em PDF

1. Abra a O.S.
2. Clique em **Imprimir / salvar PDF**.
3. Na janela de impressão do navegador, confira a visualização.
4. Escolha a impressora ou a opção **Salvar como PDF**.
5. No Windows, também pode aparecer **Microsoft Print to PDF**.
6. Escolha a pasta e o nome do arquivo.
7. Clique em **Salvar** ou **Imprimir**.

O documento impresso reúne cliente, veículo, problema, peças e serviços, totais, observações, status, pagamento e linhas de assinatura. O PDF é gerado pelo navegador. O sistema não guarda uma cópia do PDF. Se a opção de PDF não aparecer, escolha outra impressora ou atualize o navegador.

### Imprimir este manual

1. Abra **Ajuda e manual**.
2. Aguarde o manual carregar.
3. Clique em **Imprimir manual**.
4. Escolha uma impressora ou **Salvar como PDF**.
5. Confira a visualização e salve ou imprima.

## 8. Peças, estoque e movimentações {#estoque}

### Cadastrar uma peça

1. Abra **Peças em estoque**.
2. Clique em **Nova peça**.
3. Informe o **nome**, que é obrigatório.
4. Preencha código, marca e categoria.
5. Escolha a unidade.
6. Selecione o fornecedor, se cadastrado.
7. Informe a localização, por exemplo, `Prateleira A1`.
8. Preencha o preço de custo e o preço de venda.
9. Informe o **estoque inicial** que existe fisicamente.
10. Informe o **estoque mínimo** usado no aviso de reposição.
11. Escreva observações, se necessário.
12. Clique em **Salvar peça**.

As categorias são: Motor, Freios, Suspensão, Elétrica, Filtros, Óleos e fluidos, Transmissão, Arrefecimento, Pneus e rodas, Carroceria, Acessórios e Outros.

As unidades são: `un`, `jogo`, `par`, `kit`, `L`, `mL`, `kg`, `cx` e `m`.

Um estoque inicial maior que zero cria uma movimentação de **Entrada**, com motivo **Estoque inicial**. O valor de custo do estoque é calculado multiplicando o preço de custo pela quantidade disponível.

### Editar uma peça

1. Localize a peça na lista.
2. Clique no lápis.
3. Altere código, nome, marca, categoria, unidade, fornecedor, localização, preços, mínimo ou observações.
4. Clique em **Salvar peça**.

> **Atenção:** editar o cadastro não altera a quantidade disponível. O formulário de edição mostra apenas o estoque atual; use **Entrada / saída** para mudar a quantidade. Isso preserva o histórico.

### Buscar e filtrar peças

- A busca encontra nome, código, marca, categoria, fornecedor e localização.
- O filtro de categoria mostra somente um grupo de peças.
- **Somente estoque mínimo** mostra peças cujo mínimo é maior que zero e cujo disponível é igual ou menor que o mínimo.
- **Valor de custo** mostra o custo total das peças disponíveis, não o valor de venda.

### Registrar entrada ou saída manual

1. Clique em **Entrada / saída** ou use **Repor** em um aviso de estoque.
2. Escolha a peça.
3. Escolha **Entrada** para aumentar ou **Saída** para diminuir.
4. Informe uma quantidade maior que zero.
5. Escolha o motivo.
6. Escreva uma referência que ajude a identificar a operação.
7. Confira a data.
8. Clique em **Registrar movimentação**.

O sistema não permite registrar uma saída manual maior que o estoque disponível. Se houver divergência real, confira o histórico e corrija a causa antes de fazer novos lançamentos.

Motivos de entrada: Compra de peças, Estoque inicial, Devolução de cliente, Contagem de inventário e Ajuste manual de estoque.

Motivos de saída: Peça usada em ordem de serviço, Venda balcão, Devolução ao fornecedor, Perda ou dano e Ajuste manual de estoque.

Uma movimentação manual muda o estoque, mas não cria receita, despesa ou compra. Use **Compras** para entradas de fornecedores e **O.S.** para peças usadas em atendimentos, evitando registrar a mesma operação duas vezes.

### Consultar o histórico

1. Clique em **Movimentações**.
2. Use **Todas**, **Entradas** ou **Saídas**.
3. Busque por peça, motivo ou referência.
4. Confira data, quantidade e o saldo anterior e novo.

O histórico também pode ser consultado pelo botão **Histórico** da peça. Na versão atual, as movimentações são registros de auditoria; para corrigir um erro, faça um novo lançamento inverso com uma referência explicando a correção.

### Excluir uma peça

1. Localize a peça.
2. Clique na lixeira e confirme.
3. A peça sai do catálogo.

> **Atenção:** excluir uma peça não apaga suas movimentações nem as O.S. antigas. Se a peça ainda tiver histórico ou puder voltar a ser usada, prefira manter o cadastro e ajustar o estoque. Uma quantidade negativa é sinal de que as movimentações precisam ser conferidas.

## 9. Compras de peças {#compras}

### Registrar uma compra com entrada no estoque

1. Abra **Compras**.
2. Clique em **Nova compra**.
3. Escolha um fornecedor cadastrado ou digite o nome livre do fornecedor. Pelo menos uma dessas duas opções é obrigatória.
4. Informe o número da nota fiscal, se houver.
5. Confira a data da compra.
6. Preencha o vencimento, se a compra for a prazo.
7. Escolha **Pendente** ou **Pago**.
8. Escolha a forma de pagamento.
9. Se estiver paga, informe a **data do pagamento**.
10. Clique em **Adicionar peça**.
11. Escolha uma peça existente ou cadastre uma nova na compra.
12. Informe a quantidade e o preço unitário de custo. Ao escolher uma peça existente, o custo cadastrado é preenchido automaticamente e pode ser conferido.
13. Para uma peça nova, complete nome, código, marca, categoria, unidade, preço de venda e estoque mínimo, conforme o formulário.
14. Repita para todas as peças da nota.
15. Confira o total da compra.
16. Escreva observações, se necessário.
17. Clique em **Salvar compra e dar entrada no estoque**.

Ao salvar, cada quantidade comprada entra no estoque e cria uma movimentação de entrada. A data dessa movimentação acompanha a data informada na compra. O total da compra é a soma de quantidade multiplicada pelo preço unitário.

> **Atenção:** não use uma compra e também uma entrada manual para a mesma chegada de peças. Isso duplicaria o estoque.

### Consultar, editar e pagar

- Use a busca por fornecedor, nota fiscal ou peça.
- Use os filtros **Todas**, **Pendentes** e **Pagas**.
- Clique em **Ver** para consultar os detalhes.
- Clique em **Editar** para alterar fornecedor, nota, datas, vencimento, situação, forma de pagamento ou observações.
- Clique em **Pagar** para marcar a compra como paga hoje. Para usar outra data, informe-a em **Editar**.
- Clique em **Reabrir** para voltar a compra ao estado pendente.

Na versão atual, a edição de uma compra salva não altera suas peças ou quantidades. Para corrigir um item, exclua a compra e registre-a novamente, conferindo o estorno.

### Excluir uma compra

1. Abra a compra.
2. Clique na lixeira e confirme.
3. O sistema remove a compra.
4. As quantidades que entraram por ela são retiradas do estoque, criando movimentações de estorno.

> **Atenção:** a exclusão reverte o estoque mesmo se a compra já foi paga. Se as peças já tiverem sido usadas em O.S. ou vendidas, o estoque poderá ficar negativo. Confira o histórico antes de excluir. Uma peça nova criada pela compra permanece no catálogo, com o estoque revertido.

## 10. Fornecedores {#fornecedores}

### Cadastrar um fornecedor

1. Abra **Fornecedores**.
2. Clique em **Novo fornecedor**.
3. Informe o **nome**, que é obrigatório.
4. Preencha CNPJ, pessoa de contato, telefone e e-mail.
5. Informe o endereço.
6. Escreva observações sobre prazos, condições ou serviços.
7. Clique em **Salvar fornecedor**.

### Buscar, editar ou excluir

1. Use a busca por nome, CNPJ, contato, telefone ou e-mail.
2. Clique em **Editar** para alterar o cadastro.
3. Clique em **Salvar fornecedor**.
4. Para excluir, use a lixeira e confirme.

Excluir um fornecedor não exclui peças ou compras. Os registros anteriores podem continuar mostrando o nome do fornecedor que foi salvo neles.

## 11. Despesas da oficina {#despesas}

### Registrar uma despesa

1. Abra **Despesas**.
2. Clique em **Nova despesa**.
3. Informe a **descrição**, que é obrigatória.
4. Escolha a categoria.
5. Informe o credor ou fornecedor, se aplicável.
6. Digite o **valor**.
7. Confira a **data** da despesa.
8. Preencha o **vencimento**, se houver.
9. Escolha **Pendente** ou **Pago**.
10. Se já estiver paga, informe a **data do pagamento**.
11. Escolha a forma de pagamento.
12. Escreva observações, se necessário.
13. Clique em **Salvar despesa**.

As categorias são: Aluguel, Salários, Energia, Água, Internet, Impostos, Manutenção, Marketing, Ferramentas e Outros.

### Consultar, editar, pagar ou excluir

1. Busque por descrição, categoria, credor ou observação.
2. Use os filtros **Todas**, **Pendentes** e **Pagas**.
3. Clique em **Editar** para corrigir os dados.
4. Clique em **Pagar** quando o pagamento sair; esse botão usa a data de hoje. Para usar outra data em uma despesa pendente, informe-a em **Editar**. Se a despesa já estiver paga, clique primeiro em **Reabrir**, edite, marque **Pago** e informe a data correta.
5. Clique em **Reabrir** se uma despesa foi marcada como paga por engano.
6. Para excluir, use a lixeira e confirme.

Despesas vencidas e pendentes são identificadas na lista. O vencimento ajuda a organizar as contas, mas não entra no caixa. O que conta para o mês é a data em que a despesa foi paga.

## 12. Contas, recebíveis, pagáveis e caixa {#financeiro}

Abra **Contas e caixa** para conferir o mês atual.

### Contas a receber

- Aparecem as O.S. com status **Faturada** e pagamento pendente.
- O total **A receber** soma essas O.S.
- **Receber** marca o pagamento como recebido.
- **Cobrar** abre uma mensagem preparada no WhatsApp; o envio continua sendo manual.

### Contas a pagar

- Reúne compras e despesas pendentes.
- Mostram fornecedor ou descrição, referência e vencimento.
- **Pagar** marca a conta como paga.
- Contas vencidas também podem ser identificadas nas telas de Compras e Despesas.

### Caixa do mês

- **Entradas do mês:** valores recebidos com data de pagamento no mês atual.
- **Saídas pagas no mês:** compras pagas mais despesas pagas no mês atual.
- **Resultado do mês:** entradas menos saídas pagas.
- **Compras pagas** e **Despesas pagas** mostram a separação das saídas.

> **Atenção:** a data de pagamento é que define o mês do caixa. A data da compra, o vencimento, a data da despesa, a abertura da O.S. e o faturamento não substituem a data de pagamento.

O caixa é um resumo dos pagamentos registrados no sistema. Não é um extrato bancário, não possui saldo inicial e não concilia automaticamente com banco, cartão ou dinheiro físico. Registre os recebimentos e pagamentos corretamente para que o resumo seja útil.

Na versão atual, a tela mostra o mês corrente, sem um seletor para outros meses. Compras e despesas permitem informar ou corrigir a data de pagamento no cadastro ou na edição, inclusive quando já estão pagas. A data correta deve ser salva antes de conferir o caixa.

## 13. Cópias, restauração e limpeza dos dados {#backup}

### Baixar uma cópia de segurança

1. Abra **Ajuda e manual**.
2. Clique em **Baixar cópia**.
3. O navegador baixará um arquivo JSON chamado `franlin-car-veiculos-AAAA-MM-DD.json`.
4. Escolha uma pasta segura.
5. Se útil, acrescente a data ao nome do arquivo.
6. Abra o arquivo somente para conferir se ele não está vazio; não o edite manualmente.
7. Guarde outra cópia em local seguro, se necessário.

A cópia contém clientes, veículos, fornecedores, peças, estoque, movimentações, O.S., compras, despesas e informações de controle.

O download não depende de o navegador conseguir gravar uma nova informação no armazenamento local. Se o espaço estiver cheio, baixe o arquivo mesmo assim e guarde-o antes de excluir registros.

> **Atenção:** a cópia contém dados pessoais e financeiros e não é criptografada pelo sistema. Não a publique, não a envie por grupos e não a deixe em um computador compartilhado.

Faça uma cópia toda semana, antes de mudanças importantes e antes de trocar de navegador ou computador.

### Restaurar uma cópia

1. Antes de restaurar, baixe uma cópia dos dados que estão atualmente no navegador.
2. Abra **Ajuda e manual**.
3. Clique em **Restaurar cópia**.
4. Escolha o arquivo JSON gerado pelo Franlin Car Veículos. Arquivos com mais de 10 MB são recusados.
5. Leia o aviso de substituição e clique em **Sim, restaurar cópia**.
6. Aguarde a mensagem de conclusão.
7. Confira clientes, O.S., peças e financeiro.

> **Atenção:** restaurar substitui todos os dados locais pelos dados do arquivo. Não é uma mesclagem. Um arquivo inválido ou sem dados reconhecíveis do sistema é rejeitado.

### Aparece o aviso de dados salvos corrompidos

Esse aviso significa que o conteúdo gravado pelo navegador não pôde ser lido com segurança. Para evitar uma perda maior, o sistema bloqueia alterações normais e preserva o conteúdo existente até que você escolha uma recuperação.

1. Se tiver uma cópia de segurança válida, use **Restaurar cópia** em **Ajuda e manual**.
2. Confira os dados depois da restauração e faça uma nova cópia.
3. Se não houver cópia válida, os dados corrompidos não podem ser recuperados pelo sistema. Use **Apagar todos os dados** somente se aceitar começar do zero.
4. Não apague os dados do site nas configurações do navegador antes de tentar restaurar uma cópia.

### Apagar todos os dados

1. Faça uma cópia de segurança, se ainda precisar de algum registro.
2. Abra **Ajuda e manual**.
3. Clique em **Apagar todos os dados**.
4. Leia o primeiro aviso e clique em **Continuar**.
5. Na confirmação final, clique em **Sim, apagar definitivamente**.
6. O sistema volta ao estado vazio.

> **Atenção:** apagar todos os dados é definitivo. A única forma de recuperar o que foi apagado é restaurar uma cópia feita antes.

## 14. Dados de exemplo {#demo}

Os dados de exemplo servem para treinar o uso do sistema. Eles incluem clientes, veículos, fornecedores, peças, O.S., compras e despesas fictícias.

### Carregar dados de exemplo

1. Abra o **Painel** ou **Ajuda e manual**.
2. Clique em **Ver dados de exemplo** ou **Carregar dados de exemplo**.
3. Leia o aviso.
4. Clique em **Carregar exemplo**.
5. Explore as telas para aprender.

O botão é oferecido somente quando todas as listas estão vazias: clientes, veículos, fornecedores, peças, movimentações, O.S., compras e despesas. Se houver qualquer registro, nem o botão nem o carregamento são permitidos. O sistema não mescla os dados de exemplo com registros reais.

> **Atenção:** nunca carregue dados de exemplo em um navegador que contenha registros reais sem fazer uma cópia antes. Não envie mensagens para os telefones de exemplo.

### Remover os dados de exemplo

1. Abra **Ajuda e manual**.
2. Clique em **Apagar todos os dados**.
3. Confirme.
4. Comece o cadastro real.

Não é possível transformar os dados de exemplo em dados reais. Eles devem ser apagados.

## 15. Segurança e conservação dos dados {#seguranca}

### Onde os dados ficam

- Os dados são salvos no armazenamento local do navegador.
- A chave usada pelo sistema é `fcv.store.v1`.
- Cada combinação de navegador, perfil e endereço do site possui seus próprios dados.
- Um computador não sincroniza automaticamente com outro computador ou celular.
- Modo anônimo ou privado pode descartar os dados ao fechar.
- Limpar os dados do site pode apagar os registros.
- O navegador pode recusar o salvamento se o armazenamento estiver cheio.

Se o sistema estiver aberto em duas abas do mesmo navegador, perfil e endereço, uma alteração salva em uma aba atualiza a outra. A tela é recarregada e rascunhos de O.S. ou compras ainda não salvos são descartados nessa atualização. Evite editar o mesmo registro em duas abas ao mesmo tempo. Esse recurso não transfere dados entre dispositivos ou pessoas.

### Se o navegador não conseguir salvar

Quando o armazenamento está cheio ou indisponível, a alteração não é confirmada. O sistema desfaz a operação em memória, inclusive movimentações de estoque, para evitar que a tela mostre algo diferente do que ficou salvo. O carregamento dos dados de exemplo também é desfeito por completo se qualquer gravação intermediária falhar.

Nesse caso, baixe uma cópia de segurança, libere espaço removendo registros que não sejam mais necessários e tente novamente. Não feche a página no meio de uma operação importante.

### Boas práticas

1. Use um perfil de navegador protegido no dispositivo da oficina.
2. Não deixe a sessão aberta em um computador público.
3. Faça cópias de segurança com frequência.
4. Guarde as cópias em local protegido.
5. Não coloque senhas, tokens ou dados de clientes dentro do repositório do projeto.
6. Ao trocar de computador, restaure a cópia no novo navegador.
7. Ao usar outro navegador no mesmo computador, restaure a cópia separadamente.

O site ser público significa que qualquer pessoa pode abrir o endereço. Isso não significa que os dados locais de um navegador sejam publicados na internet. Porém, qualquer pessoa que usar o mesmo perfil do navegador poderá ver e alterar esses dados, pois não existe login.

## 16. Solução de problemas {#problemas}

### O manual não carrega

1. Confira a conexão com a internet.
2. Atualize a página.
3. Clique em **Tentar novamente**, se o botão aparecer.
4. Use **Abrir manual** para ler o arquivo separadamente.
5. Se estiver usando uma prévia local, abra o sistema por `http://127.0.0.1:8080`, não por um endereço `file://`.

### A página fica em branco ou não responde

1. Atualize a página.
2. Confira se o endereço está correto.
3. Use um navegador atualizado.
4. Feche outras abas que estejam consumindo memória.
5. Se o problema continuar, faça uma cópia de segurança antes de limpar os dados do site.

### Aparece erro ao salvar

1. Leia a mensagem exibida.
2. Confira os campos obrigatórios.
3. Se disser que o armazenamento está cheio ou indisponível, saiba que a tentativa foi desfeita e os dados anteriores foram mantidos.
4. Baixe uma cópia de segurança.
5. Remova registros antigos que não sejam mais necessários.
6. Tente salvar novamente.

### Aparece aviso de dados corrompidos

1. Não tente cadastrar ou excluir registros para “resolver” o aviso.
2. Vá para **Ajuda e manual**.
3. Restaure uma cópia de segurança válida, se existir.
4. Se não existir cópia, leia a seção **Dados salvos corrompidos** antes de decidir apagar tudo.

### Os dados desapareceram

1. Confirme se você está no mesmo navegador, perfil e endereço.
2. Confira se não está em uma janela anônima.
3. Abra **Ajuda e manual**.
4. Restaure a última cópia de segurança.
5. Depois de recuperar, faça uma nova cópia.

### O WhatsApp não abre

1. Confira o telefone com DDD.
2. Remova caracteres inválidos e confira o número.
3. Permita que o navegador abra links externos.
4. Instale ou abra o WhatsApp no dispositivo.
5. Se necessário, copie a mensagem preparada e envie manualmente.

### Não consigo salvar em PDF

1. Use o botão **Imprimir / salvar PDF** da O.S.
2. Na janela do navegador, procure **Salvar como PDF** ou **Microsoft Print to PDF**.
3. Se não houver essa opção, atualize o navegador ou escolha outro navegador.
4. Confira a visualização antes de salvar.

### O estoque ficou negativo

1. Abra **Movimentações**.
2. Confira compras, saídas de O.S. e estornos.
3. Verifique se a mesma operação não foi registrada duas vezes.
4. Compare com a contagem física.
5. Faça um ajuste de entrada ou saída com referência explicativa.

### O número da O.S. está repetido

1. Volte ao passo 3 do cadastro.
2. Informe outro número.
3. Salve novamente.

### O valor não aparece no mês esperado

1. Confira a data de pagamento.
2. Confira se a O.S. está faturada e marcada como recebida.
3. Confira se a compra ou despesa está marcada como paga.
4. Lembre-se de que vencimento e data da compra não definem o mês do caixa.

### Uma compra foi registrada com quantidade errada

1. Anote os dados corretos da compra.
2. Faça uma cópia de segurança.
3. Exclua a compra para estornar o estoque.
4. Confira o saldo da peça.
5. Registre a compra novamente com a quantidade certa.

## 17. Perguntas frequentes {#faq}

### Preciso de login ou senha?

Não. O sistema não possui login. Proteja o perfil do navegador e o dispositivo para evitar acesso por outras pessoas.

### Posso usar em dois computadores ao mesmo tempo?

Sim, mas os dados não são sincronizados. Cada navegador terá uma cópia independente. Use as ferramentas de exportar e restaurar para transferir informações.

### O que acontece se eu abrir duas abas?

No mesmo navegador, perfil e endereço, as alterações salvas são atualizadas entre as abas. Rascunhos de O.S. ou compras ainda não salvos podem ser descartados nessa atualização. Em dispositivos diferentes, os dados continuam independentes.

### O WhatsApp envia a mensagem automaticamente?

Não. O sistema apenas abre o texto preparado. Você precisa conferir e tocar em enviar no WhatsApp.

### O PDF fica guardado no sistema?

Não. O PDF é criado pelo navegador e fica no local escolhido por você.

### O caixa é o saldo do banco?

Não. É o resultado dos recebimentos e pagamentos registrados no sistema no mês atual. Não há conciliação bancária automática.

### Aprovar e faturar derruba o estoque duas vezes?

Não. A primeira aprovação baixa as peças. O faturamento de uma O.S. já aprovada não repete a baixa.

### Cancelar devolve as peças?

Sim, se a O.S. tinha baixado estoque. O sistema registra um estorno. Reabrir como orçamento não baixa novamente.

### Excluir uma compra devolve ou tira peças?

A exclusão reverte a entrada da compra, retirando do estoque as quantidades que ela adicionou.

### Apagar os dados afeta outro computador?

Não. A limpeza vale somente para o navegador e o perfil em que foi feita. Outros dispositivos continuam com seus dados locais.

### Com que frequência devo fazer cópia?

Toda semana e sempre que houver mudanças importantes, troca de computador, restauração ou limpeza.

### Posso usar os dados de exemplo na operação real?

Não. Eles são fictícios e servem apenas para treinamento. Apague-os antes de começar o uso real.

## 18. Manutenção deste manual {#manutencao}

> **Regra obrigatória de manutenção:** `MANUAL.md` deve ser atualizado na mesma alteração sempre que houver qualquer mudança de funcionalidade, interface, regra de dados, validação, status, estoque, pagamento, importação, exportação ou mensagem do sistema.

Ao alterar o sistema:

1. Atualize as instruções desta página.
2. Revise os avisos de segurança e de perda de dados.
3. Mantenha os títulos numerados e os IDs usados pelos links **Como usar**.
4. Atualize a versão do rodapé quando a versão do aplicativo mudar.
5. Execute `npm test`.
6. Confirme se o CI bloqueia mudanças funcionais sem a atualização correspondente do manual.

Não documente recursos que não existem, como sincronização em nuvem, acesso multiusuário, login, integração bancária ou envio automático pelo WhatsApp.

---

Franlin Car Veículos · Manual do usuário · Versão 1.0.1
