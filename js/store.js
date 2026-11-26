import {
  nowISO,
  todayISO,
  localDateISO,
  uid,
  round2,
  monthKey,
  isInMonth,
  sum,
  normalizeSearch,
  compareISO
} from './util.js';

const STORAGE_KEY = 'fcv.store.v1';

export const OS_STATUSES = ['Orçamento', 'Aprovada', 'Faturada', 'Cancelada'];
export const PAYMENT_STATUSES = ['Pendente', 'Pago'];
export const PAYMENT_METHODS = ['Dinheiro', 'PIX', 'Cartão de débito', 'Cartão de crédito', 'Boleto', 'Transferência'];
export const PART_CATEGORIES = [
  'Motor', 'Freios', 'Suspensão', 'Elétrica', 'Filtros', 'Óleos e fluidos',
  'Transmissão', 'Arrefecimento', 'Pneus e rodas', 'Carroceria', 'Acessórios', 'Outros'
];
export const PART_UNITS = ['un', 'jogo', 'par', 'kit', 'L', 'mL', 'kg', 'cx', 'm'];
export const EXPENSE_CATEGORIES = [
  'Aluguel', 'Salários', 'Energia', 'Água', 'Internet', 'Impostos',
  'Manutenção', 'Marketing', 'Ferramentas', 'Outros'
];
export const STOCK_REASONS = {
  Entrada: ['Compra de peças', 'Estoque inicial', 'Devolução de cliente', 'Contagem de inventário', 'Ajuste manual de estoque'],
  Saída: ['Venda balcão', 'Devolução ao fornecedor', 'Perda ou dano', 'Ajuste manual de estoque']
};

const ARRAY_KEYS = ['clientes', 'veiculos', 'fornecedores', 'pecas', 'movimentacoes', 'ordens', 'compras', 'despesas'];

function emptyData() {
  return {
    version: 1,
    clientes: [],
    veiculos: [],
    fornecedores: [],
    pecas: [],
    movimentacoes: [],
    ordens: [],
    compras: [],
    despesas: [],
    meta: { nextOs: 1, createdAt: nowISO(), lastBackupAt: '', demo: false }
  };
}

function normalizeData(input) {
  const base = emptyData();
  const data = { ...base, ...(input || {}) };
  for (const key of ARRAY_KEYS) {
    if (!Array.isArray(data[key])) data[key] = [];
  }
  data.meta = { ...base.meta, ...(input?.meta || {}) };
  const numbers = data.ordens
    .map((order) => Number(String(order.numero || '').replace(/\D/g, '')))
    .filter((value) => Number.isFinite(value));
  const highest = numbers.length ? Math.max(...numbers) : 0;
  data.meta.nextOs = Math.max(Number(data.meta.nextOs) || 1, highest + 1);
  data.version = 1;
  return data;
}

let corruptRaw = null;
const CORRUPT_DATA_MESSAGE = 'Os dados salvos neste navegador estão corrompidos e não serão substituídos. Restaure uma cópia de segurança válida ou use “Apagar todos os dados” em Ajuda e manual.';
const browserStorage = {
  getItem: (key) => globalThis.localStorage?.getItem(key) ?? null,
  setItem: (key, value) => globalThis.localStorage?.setItem(key, value),
  removeItem: (key) => globalThis.localStorage?.removeItem(key)
};
let storageAdapter = browserStorage;
let changeListener = null;
let writeGuard = null;

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

export function createEmptyData() {
  return emptyData();
}

export function isValidData(input) {
  return Boolean(input && typeof input === 'object' && !Array.isArray(input)
    && ARRAY_KEYS.every((key) => Array.isArray(input[key])));
}

function loadData() {
  let raw = null;
  try {
    raw = storageAdapter.getItem(STORAGE_KEY);
    if (!raw) {
      corruptRaw = null;
      return emptyData();
    }
    const parsed = JSON.parse(raw);
    if (!isValidData(parsed)) throw new Error('Formato de dados inválido.');
    corruptRaw = null;
    return normalizeData(parsed);
  } catch (error) {
    corruptRaw = raw;
    console.error('Não foi possível ler os dados salvos.', error);
    return emptyData();
  }
}

export const store = { data: loadData() };
let persistedData = cloneData(store.data);

export function setStorageAdapter(adapter, { reload: shouldReload = true } = {}) {
  if (!adapter || typeof adapter.getItem !== 'function' || typeof adapter.setItem !== 'function') {
    throw new Error('Armazenamento local inválido.');
  }
  storageAdapter = adapter;
  if (shouldReload) reload();
}

export function useLocalStorage() {
  storageAdapter = browserStorage;
  return reload();
}

export function subscribe(listener) {
  changeListener = listener;
  return () => {
    if (changeListener === listener) changeListener = null;
  };
}

export function setWriteGuard(guard) {
  writeGuard = typeof guard === 'function' ? guard : null;
}

function notifyChange() {
  try {
    changeListener?.(cloneData(store.data));
  } catch (error) {
    console.error('Não foi possível preparar a sincronização.', error);
  }
}

export function save(options = {}) {
  if (!options.force && writeGuard) {
    const message = writeGuard();
    if (message) {
      store.data = cloneData(persistedData);
      throw new Error(message);
    }
  }
  try {
    if (corruptRaw !== null && !options.replaceInvalid) throw new Error(CORRUPT_DATA_MESSAGE);
    const serialized = JSON.stringify(store.data);
    storageAdapter.setItem(STORAGE_KEY, serialized);
    persistedData = JSON.parse(serialized);
    corruptRaw = null;
  } catch (error) {
    store.data = cloneData(persistedData);
    console.error(error);
    throw new Error(error.message === CORRUPT_DATA_MESSAGE
      ? CORRUPT_DATA_MESSAGE
      : 'Não foi possível salvar. O armazenamento do navegador pode estar cheio. Faça uma cópia de segurança e remova registros antigos.');
  }
  if (!options.silent) notifyChange();
}

export function applyRemoteData(input, { notify = false } = {}) {
  if (!isValidData(input)) throw new Error('Os dados recebidos da nuvem são inválidos.');
  const next = normalizeData(input);
  const serialized = JSON.stringify(next);
  try {
    storageAdapter.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error(error);
    throw new Error('Não foi possível guardar o cache local dos dados da nuvem.');
  }
  store.data = next;
  persistedData = JSON.parse(serialized);
  corruptRaw = null;
  if (notify) notifyChange();
  return store.data;
}

export function reload() {
  store.data = loadData();
  persistedData = cloneData(store.data);
  return store.data;
}

export function storageWarning() {
  return corruptRaw !== null ? CORRUPT_DATA_MESSAGE : '';
}

export function isStoreEmpty() {
  return ARRAY_KEYS.every((key) => store.data[key].length === 0);
}

export function clienteById(id) {
  return store.data.clientes.find((cliente) => cliente.id === id) || null;
}

export function veiculoById(id) {
  return store.data.veiculos.find((veiculo) => veiculo.id === id) || null;
}

export function veiculosDoCliente(clienteId) {
  return store.data.veiculos.filter((veiculo) => veiculo.clienteId === clienteId);
}

export function pecaById(id) {
  return store.data.pecas.find((peca) => peca.id === id) || null;
}

export function fornecedorById(id) {
  return store.data.fornecedores.find((fornecedor) => fornecedor.id === id) || null;
}

export function ordemById(id) {
  return store.data.ordens.find((ordem) => ordem.id === id) || null;
}

export function compraById(id) {
  return store.data.compras.find((compra) => compra.id === id) || null;
}

export function despesaById(id) {
  return store.data.despesas.find((despesa) => despesa.id === id) || null;
}

export function clientePhone(ordem) {
  const cliente = ordem?.clienteId ? clienteById(ordem.clienteId) : null;
  return ordem?.clienteTelefone || cliente?.telefone || '';
}

export function saveCliente(input) {
  const data = store.data;
  const nome = String(input.nome || '').trim();
  const telefone = String(input.telefone || '').trim();
  if (!nome) throw new Error('Informe o nome do cliente.');
  if (!telefone) throw new Error('Informe o telefone do cliente.');
  const existing = input.id ? clienteById(input.id) : null;
  const record = {
    id: existing?.id || uid('cli'),
    nome,
    tipo: input.tipo || 'Pessoa Física',
    cpfCnpj: String(input.cpfCnpj || '').trim(),
    telefone,
    email: String(input.email || '').trim(),
    endereco: String(input.endereco || '').trim(),
    cidade: String(input.cidade || '').trim(),
    observacoes: String(input.observacoes || '').trim(),
    criadoEm: existing?.criadoEm || nowISO()
  };
  if (existing) Object.assign(existing, record);
  else data.clientes.unshift(record);
  save();
  return record;
}

export function deleteCliente(id) {
  const data = store.data;
  data.clientes = data.clientes.filter((cliente) => cliente.id !== id);
  data.veiculos = data.veiculos.filter((veiculo) => veiculo.clienteId !== id);
  save();
}

export function saveVeiculo(input) {
  if (!input.clienteId) throw new Error('Escolha o cliente do veículo.');
  const placa = String(input.placa || '').toUpperCase().replace(/\s+/g, '').trim();
  if (!placa) throw new Error('Informe a placa do veículo.');
  const existing = input.id ? veiculoById(input.id) : null;
  const record = {
    id: existing?.id || uid('vei'),
    clienteId: input.clienteId,
    placa,
    marca: String(input.marca || '').trim(),
    modelo: String(input.modelo || '').trim(),
    ano: String(input.ano || '').trim(),
    cor: String(input.cor || '').trim(),
    km: String(input.km || '').replace(/\D/g, ''),
    observacoes: String(input.observacoes || '').trim(),
    criadoEm: existing?.criadoEm || nowISO()
  };
  if (existing) Object.assign(existing, record);
  else store.data.veiculos.unshift(record);
  save();
  return record;
}

export function deleteVeiculo(id) {
  store.data.veiculos = store.data.veiculos.filter((veiculo) => veiculo.id !== id);
  save();
}

export function saveFornecedor(input) {
  const nome = String(input.nome || '').trim();
  if (!nome) throw new Error('Informe o nome do fornecedor.');
  const existing = input.id ? fornecedorById(input.id) : null;
  const record = {
    id: existing?.id || uid('for'),
    nome,
    cnpj: String(input.cnpj || '').trim(),
    contato: String(input.contato || '').trim(),
    telefone: String(input.telefone || '').trim(),
    email: String(input.email || '').trim(),
    endereco: String(input.endereco || '').trim(),
    observacoes: String(input.observacoes || '').trim(),
    criadoEm: existing?.criadoEm || nowISO()
  };
  if (existing) Object.assign(existing, record);
  else store.data.fornecedores.unshift(record);
  save();
  return record;
}

export function deleteFornecedor(id) {
  store.data.fornecedores = store.data.fornecedores.filter((fornecedor) => fornecedor.id !== id);
  save();
}

function createPecaInternal(input, { initialStock = 0 } = {}) {
  const nome = String(input.nome || '').trim();
  if (!nome) throw new Error('Informe o nome da peça.');
  const record = {
    id: uid('pec'),
    codigo: String(input.codigo || '').trim(),
    nome,
    marca: String(input.marca || '').trim(),
    categoria: input.categoria || 'Outros',
    unidade: input.unidade || 'un',
    fornecedorId: input.fornecedorId || '',
    fornecedorNome: String(input.fornecedorNome || '').trim(),
    localizacao: String(input.localizacao || '').trim(),
    precoCusto: round2(input.precoCusto),
    precoVenda: round2(input.precoVenda),
    quantidadeEstoque: 0,
    estoqueMinimo: Number(input.estoqueMinimo) || 0,
    observacoes: String(input.observacoes || '').trim(),
    criadoEm: nowISO()
  };
  store.data.pecas.unshift(record);
  const quantity = Number(initialStock) || 0;
  if (quantity > 0) {
    addMovementInternal(record.id, quantity, {
      motivo: 'Estoque inicial',
      referencia: 'Cadastro da peça'
    });
  }
  return record;
}

export function savePeca(input) {
  const existing = input.id ? pecaById(input.id) : null;
  if (existing) {
    const previousQuantity = Number(existing.quantidadeEstoque) || 0;
    const fields = {
      codigo: String(input.codigo || '').trim(),
      nome: String(input.nome || '').trim() || existing.nome,
      marca: String(input.marca || '').trim(),
      categoria: input.categoria || 'Outros',
      unidade: input.unidade || 'un',
      fornecedorId: input.fornecedorId || '',
      fornecedorNome: String(input.fornecedorNome || '').trim(),
      localizacao: String(input.localizacao || '').trim(),
      precoCusto: round2(input.precoCusto),
      precoVenda: round2(input.precoVenda),
      estoqueMinimo: Number(input.estoqueMinimo) || 0,
      observacoes: String(input.observacoes || '').trim(),
      quantidadeEstoque: previousQuantity
    };
    Object.assign(existing, fields);
    save();
    return existing;
  }
  const record = createPecaInternal(input, { initialStock: input.quantidadeEstoque });
  save();
  return record;
}

export function deletePeca(id) {
  store.data.pecas = store.data.pecas.filter((peca) => peca.id !== id);
  save();
}

function addMovementInternal(pecaId, delta, { motivo, referencia, data, tipo, ordemId } = {}) {
  const peca = pecaById(pecaId);
  if (!peca) return null;
  const before = Number(peca.quantidadeEstoque) || 0;
  const after = round2(before + (Number(delta) || 0));
  peca.quantidadeEstoque = after;
  const movement = {
    id: uid('mov'),
    pecaId: peca.id,
    pecaNome: peca.nome,
    tipo: tipo || (delta >= 0 ? 'Entrada' : 'Saída'),
    quantidade: Math.abs(Number(delta) || 0),
    saldoAnterior: before,
    saldoNovo: after,
    motivo: String(motivo || (delta >= 0 ? 'Entrada manual de estoque' : 'Saída manual de estoque')),
    referencia: String(referencia || ''),
    ordemId: String(ordemId || ''),
    data: data || nowISO(),
    usuarioNome: 'Sistema',
    criadoEm: nowISO()
  };
  store.data.movimentacoes.unshift(movement);
  return movement;
}

export function adjustStock(input) {
  const peca = pecaById(input.pecaId);
  if (!peca) throw new Error('Escolha a peça.');
  const quantity = Math.abs(Number(input.quantidade) || 0);
  if (!quantity) throw new Error('Informe uma quantidade maior que zero.');
  const tipo = input.tipo === 'Saída' ? 'Saída' : 'Entrada';
  const available = Number(peca.quantidadeEstoque) || 0;
  if (tipo === 'Saída' && quantity > available + 1e-9) {
    throw new Error(`Estoque insuficiente para ${peca.nome}. Disponível: ${String(Number(available.toFixed(2))).replace('.', ',')} ${peca.unidade}.`);
  }
  const movement = addMovementInternal(peca.id, tipo === 'Entrada' ? quantity : -quantity, {
    motivo: input.motivo || (tipo === 'Entrada' ? 'Entrada manual de estoque' : 'Saída manual de estoque'),
    referencia: input.referencia || 'Lançamento manual',
    data: input.data ? `${input.data}T12:00:00` : nowISO(),
    tipo
  });
  save();
  return movement;
}

export function lowStockParts() {
  return store.data.pecas
    .filter((peca) => Number(peca.estoqueMinimo) > 0 && (Number(peca.quantidadeEstoque) || 0) <= Number(peca.estoqueMinimo))
    .sort((a, b) => (Number(a.quantidadeEstoque) / (Number(a.estoqueMinimo) || 1)) - (Number(b.quantidadeEstoque) / (Number(b.estoqueMinimo) || 1)));
}

export function computeOrderTotals(items, desconto = 0) {
  const totalPecas = round2(sum((items || []).filter((item) => item.tipo === 'peca'), (item) => (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0)));
  const totalMaoObra = round2(sum((items || []).filter((item) => item.tipo === 'mao_obra'), (item) => (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0)));
  const total = Math.max(0, round2(totalPecas + totalMaoObra - (Number(desconto) || 0)));
  return { totalPecas, totalMaoObra, total };
}

function normalizeItem(item) {
  const quantity = Number(item.quantidade) || 0;
  const unitPrice = round2(item.valorUnitario);
  if (item.tipo === 'peca') {
    const peca = item.pecaId ? pecaById(item.pecaId) : null;
    return {
      tipo: 'peca',
      pecaId: item.pecaId || '',
      pecaNome: peca?.nome || item.pecaNome || item.descricao || '',
      codigo: peca?.codigo || item.codigo || '',
      unidade: peca?.unidade || item.unidade || 'un',
      descricao: peca?.nome || item.descricao || item.pecaNome || '',
      quantidade: quantity,
      valorUnitario: unitPrice
    };
  }
  return {
    tipo: 'mao_obra',
    pecaId: '',
    pecaNome: '',
    codigo: '',
    unidade: '',
    descricao: String(item.descricao || '').trim(),
    quantidade: quantity,
    valorUnitario: unitPrice
  };
}

function itemSignature(items) {
  return JSON.stringify((items || []).map((item) => ({
    t: item.tipo,
    p: item.pecaId || '',
    d: item.descricao || '',
    q: Number(item.quantidade) || 0,
    v: Number(item.valorUnitario) || 0
  })));
}

function applyStockToItems(items, direction, motivo, referencia, ordemId) {
  for (const [partId, quantity] of quantitiesByPart(items)) {
    if (!quantity) continue;
    addMovementInternal(partId, direction * quantity, { motivo, referencia, ordemId });
  }
}

function quantitiesByPart(items) {
  const quantities = new Map();
  for (const item of items || []) {
    if (item.tipo !== 'peca' || !item.pecaId) continue;
    quantities.set(item.pecaId, (quantities.get(item.pecaId) || 0) + (Number(item.quantidade) || 0));
  }
  return quantities;
}

function validateOrderStock(items, old) {
  const required = quantitiesByPart(items);
  const restored = old?.estoqueBaixado ? quantitiesByPart(old.itens) : new Map();
  for (const [partId, quantity] of required) {
    const part = pecaById(partId);
    if (!part) throw new Error('Uma das peças da ordem não foi encontrada no estoque.');
    const available = (Number(part.quantidadeEstoque) || 0) + (restored.get(partId) || 0);
    if (quantity > available + 1e-9) {
      const label = part.nome || 'Peça não identificada';
      throw new Error(`Estoque insuficiente para ${label}. Necessário: ${String(Number(quantity.toFixed(2))).replace('.', ',')}; disponível: ${String(Number(available.toFixed(2))).replace('.', ',')} ${part.unidade}.`);
    }
  }
}

export function peekNextOrderNumber() {
  let counter = Number(store.data.meta.nextOs) || 1;
  let candidate = `OS-${String(counter).padStart(4, '0')}`;
  const used = new Set(store.data.ordens.map((order) => String(order.numero || '').toLowerCase()));
  while (used.has(candidate.toLowerCase())) {
    counter += 1;
    candidate = `OS-${String(counter).padStart(4, '0')}`;
  }
  return candidate;
}

export function saveOrder(input) {
  const data = store.data;
  const old = input.id ? ordemById(input.id) : null;
  const numero = String(input.numero || '').trim() || peekNextOrderNumber();
  const duplicated = data.ordens.some((order) => order.id !== input.id && String(order.numero || '').trim().toLowerCase() === numero.toLowerCase());
  if (duplicated) throw new Error(`Já existe uma O.S. com o número ${numero}. Use outro número.`);

  const items = (input.itens || []).map(normalizeItem).filter((item) => {
    if (!(Number(item.quantidade) > 0)) return false;
    return item.tipo === 'peca' ? Boolean(item.pecaId || item.descricao) : Boolean(item.descricao);
  });
  const totals = computeOrderTotals(items, input.desconto);
  const status = OS_STATUSES.includes(input.status) ? input.status : 'Orçamento';
  const cliente = input.clienteId ? clienteById(input.clienteId) : null;

  const record = {
    id: old?.id || uid('os'),
    numero,
    clienteId: input.clienteId || '',
    clienteNome: String(input.clienteNome || cliente?.nome || '').trim(),
    clienteTelefone: String(input.clienteTelefone || cliente?.telefone || '').trim(),
    clienteDocumento: String(input.clienteDocumento || cliente?.cpfCnpj || '').trim(),
    clienteEndereco: String(input.clienteEndereco || [cliente?.endereco, cliente?.cidade].filter(Boolean).join(' · ')).trim(),
    veiculoId: input.veiculoId || '',
    veiculoPlaca: String(input.veiculoPlaca || '').toUpperCase().trim(),
    veiculoDescricao: String(input.veiculoDescricao || '').trim(),
    km: String(input.km || '').replace(/\D/g, ''),
    dataAbertura: input.dataAbertura || old?.dataAbertura || todayISO(),
    dataPrevisao: input.dataPrevisao || '',
    status,
    problemaRelatado: String(input.problemaRelatado || '').trim(),
    itens: items,
    desconto: round2(input.desconto),
    totalPecas: totals.totalPecas,
    totalMaoObra: totals.totalMaoObra,
    total: totals.total,
    formaPagamento: input.formaPagamento || '',
    pago: status === 'Faturada' && Boolean(input.pago),
    dataPagamento: status === 'Faturada' && input.pago ? (input.dataPagamento || old?.dataPagamento || todayISO()) : '',
    dataFaturamento: status === 'Faturada' ? (old?.dataFaturamento || todayISO()) : (old?.dataFaturamento || ''),
    observacoes: String(input.observacoes || '').trim(),
    estoqueBaixado: Boolean(old?.estoqueBaixado),
    criadoEm: old?.criadoEm || nowISO(),
    atualizadoEm: nowISO()
  };

  const shouldDeduct = status === 'Aprovada' || status === 'Faturada';
  const itemsChanged = old ? itemSignature(old.itens) !== itemSignature(items) : true;
  const reference = `${numero} · ${record.clienteNome || 'Cliente não informado'}`.trim();

  if (shouldDeduct && (!record.estoqueBaixado || itemsChanged)) validateOrderStock(items, old);
  if (record.estoqueBaixado && (!shouldDeduct || itemsChanged)) {
    applyStockToItems(old.itens, 1, `Estorno de estoque (O.S. ${numero})`, reference, record.id);
    record.estoqueBaixado = false;
  }
  if (shouldDeduct && (!record.estoqueBaixado || itemsChanged)) {
    applyStockToItems(items, -1, `Baixa automática (O.S. ${numero})`, reference, record.id);
    record.estoqueBaixado = true;
  }

  if (old) Object.assign(old, record);
  else data.ordens.unshift(record);

  const usedNumber = Number(String(numero).replace(/\D/g, ''));
  if (!old) data.meta.nextOs = Math.max(Number(data.meta.nextOs) || 1, (Number.isFinite(usedNumber) ? usedNumber : 0) + 1);
  save();
  return record;
}

export function setOrderStatus(id, status) {
  const order = ordemById(id);
  if (!order) throw new Error('Ordem de serviço não encontrada.');
  return saveOrder({ ...order, status });
}

export function markOrderPaid(id, paid = true) {
  const order = ordemById(id);
  if (!order) throw new Error('Ordem de serviço não encontrada.');
  order.pago = Boolean(paid);
  order.dataPagamento = paid ? (order.dataPagamento || todayISO()) : '';
  order.atualizadoEm = nowISO();
  save();
  return order;
}

export function deleteOrder(id) {
  const order = ordemById(id);
  if (!order) return;
  if (order.estoqueBaixado) {
    applyStockToItems(order.itens, 1, `Estorno de estoque (O.S. ${order.numero})`, `${order.numero} · ${order.clienteNome || 'Cliente não informado'}`, order.id);
  }
  store.data.ordens = store.data.ordens.filter((item) => item.id !== id);
  save();
}

export function nextPurchaseReference(compra) {
  if (compra.numeroNota) return `NF ${compra.numeroNota}${compra.fornecedorNome ? ` · ${compra.fornecedorNome}` : ''}`.trim();
  return compra.fornecedorNome || 'Compra';
}

export function createCompra(input) {
  const data = store.data;
  const supplierName = String(input.fornecedorNome || fornecedorById(input.fornecedorId)?.nome || '').trim();
  const rawItems = (input.itens || []).filter((item) => Number(item.quantidade) > 0);
  if (!rawItems.length) throw new Error('Adicione pelo menos uma peça com quantidade maior que zero.');

  const supplierId = input.fornecedorId || '';
  const supplier = fornecedorById(supplierId);
  const itens = [];
  const purchase = {
    id: uid('cmp'),
    fornecedorId: supplierId,
    fornecedorNome: supplierName || supplier?.nome || '',
    numeroNota: String(input.numeroNota || '').trim(),
    data: input.data || todayISO(),
    dataVencimento: input.dataVencimento || '',
    statusPagamento: input.statusPagamento === 'Pago' ? 'Pago' : 'Pendente',
    dataPagamento: input.statusPagamento === 'Pago' ? (input.dataPagamento || todayISO()) : '',
    formaPagamento: input.formaPagamento || '',
    observacoes: String(input.observacoes || '').trim(),
    itens: [],
    total: 0,
    estoqueRegistrado: true,
    criadoEm: nowISO()
  };

  for (const item of rawItems) {
    const quantity = Number(item.quantidade) || 0;
    const unitPrice = round2(item.valorUnitario);
    let peca = item.pecaId ? pecaById(item.pecaId) : null;
    if (!peca) {
      peca = createPecaInternal({
        codigo: item.codigo,
        nome: item.pecaNome || item.descricao,
        marca: item.marca,
        categoria: item.categoria,
        unidade: item.unidade,
        fornecedorId: supplierId,
        fornecedorNome: purchase.fornecedorNome,
        precoCusto: unitPrice,
        precoVenda: item.precoVenda,
        estoqueMinimo: item.estoqueMinimo,
        observacoes: ''
      }, { initialStock: 0 });
    }
    addMovementInternal(peca.id, quantity, {
      motivo: 'Entrada por compra de peças',
      referencia: nextPurchaseReference(purchase),
      data: purchase.data ? `${purchase.data}T12:00:00` : nowISO(),
      tipo: 'Entrada'
    });
    itens.push({
      pecaId: peca.id,
      pecaNome: peca.nome,
      codigo: peca.codigo,
      categoria: peca.categoria,
      unidade: peca.unidade,
      quantidade: quantity,
      valorUnitario: unitPrice
    });
  }

  purchase.itens = itens;
  purchase.total = round2(sum(itens, (item) => item.quantidade * item.valorUnitario));
  data.compras.unshift(purchase);
  save();
  return purchase;
}

export function updateCompraMeta(id, input) {
  const compra = compraById(id);
  if (!compra) throw new Error('Compra não encontrada.');
  compra.fornecedorId = input.fornecedorId || compra.fornecedorId;
  compra.fornecedorNome = String(input.fornecedorNome || compra.fornecedorNome || '').trim();
  compra.numeroNota = String(input.numeroNota || '').trim();
  compra.data = input.data || compra.data;
  compra.dataVencimento = input.dataVencimento || '';
  compra.statusPagamento = input.statusPagamento === 'Pago' ? 'Pago' : 'Pendente';
  compra.dataPagamento = compra.statusPagamento === 'Pago' ? (input.dataPagamento || compra.dataPagamento || todayISO()) : '';
  compra.formaPagamento = input.formaPagamento || '';
  compra.observacoes = String(input.observacoes || '').trim();
  save();
  return compra;
}

export function markCompraPaid(id, paid = true) {
  const compra = compraById(id);
  if (!compra) throw new Error('Compra não encontrada.');
  compra.statusPagamento = paid ? 'Pago' : 'Pendente';
  compra.dataPagamento = paid ? (compra.dataPagamento || todayISO()) : '';
  save();
  return compra;
}

export function deleteCompra(id) {
  const compra = compraById(id);
  if (!compra) return;
  if (compra.estoqueRegistrado) {
    for (const item of compra.itens || []) {
      if (!item.pecaId || !(Number(item.quantidade) > 0)) continue;
      addMovementInternal(item.pecaId, -Math.abs(Number(item.quantidade)), {
        motivo: 'Estorno de compra de peças',
        referencia: nextPurchaseReference(compra)
      });
    }
  }
  store.data.compras = store.data.compras.filter((item) => item.id !== id);
  save();
}

export function saveDespesa(input) {
  const descricao = String(input.descricao || '').trim();
  if (!descricao) throw new Error('Informe a descrição da despesa.');
  const existing = input.id ? despesaById(input.id) : null;
  const status = input.status === 'Pago' ? 'Pago' : 'Pendente';
  const record = {
    id: existing?.id || uid('des'),
    descricao,
    categoria: input.categoria || 'Outros',
    fornecedorNome: String(input.fornecedorNome || '').trim(),
    valor: round2(input.valor),
    data: input.data || todayISO(),
    dataVencimento: input.dataVencimento || '',
    status,
    dataPagamento: status === 'Pago' ? (input.dataPagamento || existing?.dataPagamento || todayISO()) : '',
    formaPagamento: input.formaPagamento || '',
    observacoes: String(input.observacoes || '').trim(),
    criadoEm: existing?.criadoEm || nowISO()
  };
  if (existing) Object.assign(existing, record);
  else store.data.despesas.unshift(record);
  save();
  return record;
}

export function markDespesaPaid(id, paid = true) {
  const despesa = despesaById(id);
  if (!despesa) throw new Error('Despesa não encontrada.');
  despesa.status = paid ? 'Pago' : 'Pendente';
  despesa.dataPagamento = paid ? (despesa.dataPagamento || todayISO()) : '';
  save();
  return despesa;
}

export function deleteDespesa(id) {
  store.data.despesas = store.data.despesas.filter((despesa) => despesa.id !== id);
  save();
}

export function dashboardData() {
  const data = store.data;
  const month = monthKey();
  const lowStock = lowStockParts();
  const invoiced = data.ordens.filter((order) => order.status === 'Faturada');
  const unpaidOrders = invoiced.filter((order) => !order.pago);
  const pendingPurchases = data.compras.filter((compra) => compra.statusPagamento !== 'Pago');
  const pendingExpenses = data.despesas.filter((despesa) => despesa.status !== 'Pago');
  const receivedMonth = sum(
    invoiced.filter((order) => order.pago && isInMonth(order.dataPagamento, month)),
    (order) => order.total
  );
  const paidExpensesMonth = sum(
    data.despesas.filter((despesa) => despesa.status === 'Pago' && isInMonth(despesa.dataPagamento, month)),
    (despesa) => despesa.valor
  );
  const paidPurchasesMonth = sum(
    data.compras.filter((compra) => compra.statusPagamento === 'Pago' && isInMonth(compra.dataPagamento, month)),
    (compra) => compra.total
  );
  return {
    month,
    unitsInStock: sum(data.pecas, (peca) => peca.quantidadeEstoque),
    stockValue: sum(data.pecas, (peca) => (Number(peca.precoCusto) || 0) * (Number(peca.quantidadeEstoque) || 0)),
    lowStock,
    openOrders: data.ordens.filter((order) => order.status === 'Orçamento' || order.status === 'Aprovada').length,
    receivables: unpaidOrders,
    receivablesTotal: sum(unpaidOrders, (order) => order.total),
    payablesCount: pendingPurchases.length + pendingExpenses.length,
    payablesTotal: sum(pendingPurchases, (compra) => compra.total) + sum(pendingExpenses, (despesa) => despesa.valor),
    receivedMonth,
    paidExpensesMonth,
    paidPurchasesMonth,
    outcomeMonth: round2(receivedMonth - paidExpensesMonth - paidPurchasesMonth),
    recentOrders: [...data.ordens].sort((a, b) => compareISO(b.atualizadoEm || b.criadoEm, a.atualizadoEm || a.criadoEm)).slice(0, 5),
    recentMovements: [...data.movimentacoes].sort((a, b) => compareISO(b.data, a.data)).slice(0, 5)
  };
}

export function financeData() {
  const month = monthKey();
  const receivables = store.data.ordens.filter((order) => order.status === 'Faturada' && !order.pago);
  const pendingPurchases = store.data.compras.filter((compra) => compra.statusPagamento !== 'Pago');
  const pendingExpenses = store.data.despesas.filter((despesa) => despesa.status !== 'Pago');
  const receivedMonth = sum(
    store.data.ordens.filter((order) => order.status === 'Faturada' && order.pago && isInMonth(order.dataPagamento, month)),
    (order) => order.total
  );
  const paidExpensesMonth = sum(
    store.data.despesas.filter((despesa) => despesa.status === 'Pago' && isInMonth(despesa.dataPagamento, month)),
    (despesa) => despesa.valor
  );
  const paidPurchasesMonth = sum(
    store.data.compras.filter((compra) => compra.statusPagamento === 'Pago' && isInMonth(compra.dataPagamento, month)),
    (compra) => compra.total
  );
  return {
    month,
    receivables,
    pendingPurchases,
    pendingExpenses,
    receivedMonth,
    paidExpensesMonth,
    paidPurchasesMonth,
    outcomeMonth: round2(receivedMonth - paidExpensesMonth - paidPurchasesMonth),
    receivablesTotal: sum(receivables, (order) => order.total),
    purchasesPendingTotal: sum(pendingPurchases, (compra) => compra.total),
    expensesPendingTotal: sum(pendingExpenses, (despesa) => despesa.valor)
  };
}

export function sidebarCounts() {
  return {
    openOrders: store.data.ordens.filter((order) => order.status === 'Orçamento' || order.status === 'Aprovada').length,
    stockAlerts: lowStockParts().length,
    pendingBills: store.data.compras.filter((compra) => compra.statusPagamento !== 'Pago').length
      + store.data.despesas.filter((despesa) => despesa.status !== 'Pago').length
  };
}

export function exportPayload() {
  store.data.meta.lastBackupAt = nowISO();
  try {
    save();
  } catch {
    // O download precisa continuar mesmo quando o navegador não consegue gravar.
  }
  return JSON.stringify({
    app: 'Franlin Car Veículos',
    format: 'fcv-backup',
    exportedAt: nowISO(),
    data: store.data
  }, null, 2);
}

export function importPayload(rawText) {
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('O arquivo escolhido não é uma cópia de segurança válida.');
  }
  const data = parsed?.data || parsed;
  if (!data || typeof data !== 'object') throw new Error('O arquivo escolhido não é uma cópia de segurança válida.');
  if (!ARRAY_KEYS.some((key) => Array.isArray(data[key]))) {
    throw new Error('O arquivo não contém dados do sistema Franlin Car Veículos.');
  }
  store.data = normalizeData(data);
  save({ replaceInvalid: true });
  return store.data;
}

export function clearAll() {
  store.data = emptyData();
  save({ replaceInvalid: true });
}

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDateISO(date);
}

function populateDemo() {
  clearAll();

  const maria = saveCliente({
    nome: 'Maria Aparecida Souza', tipo: 'Pessoa Física', cpfCnpj: '123.456.789-00',
    telefone: '(27) 99999-1010', email: 'maria.souza@email.com',
    endereco: 'Rua das Flores, 120', cidade: 'Vila Velha', observacoes: 'Prefere contato por WhatsApp.'
  });
  const joao = saveCliente({
    nome: 'João Batista Lima', tipo: 'Pessoa Física', cpfCnpj: '987.654.321-00',
    telefone: '(27) 98888-2020', endereco: 'Av. Central, 45', cidade: 'Vitória'
  });
  const alfa = saveCliente({
    nome: 'Transportes Alfa Ltda', tipo: 'Pessoa Jurídica', cpfCnpj: '12.345.678/0001-90',
    telefone: '(27) 3333-4040', endereco: 'Rod. do Sol, 900', cidade: 'Serra', observacoes: 'Frota de entregas.'
  });
  saveVeiculo({ clienteId: maria.id, placa: 'OCC2A34', marca: 'Fiat', modelo: 'Uno', ano: '2014', cor: 'Prata', km: '128400' });
  saveVeiculo({ clienteId: joao.id, placa: 'PPH4B56', marca: 'Volkswagen', modelo: 'Gol', ano: '2017', cor: 'Branco', km: '84200' });
  saveVeiculo({ clienteId: alfa.id, placa: 'RRT5C78', marca: 'Fiat', modelo: 'Fiorino', ano: '2019', cor: 'Branco', km: '152300' });

  const fornecedor1 = saveFornecedor({ nome: 'Auto Peças Central', cnpj: '11.222.333/0001-44', contato: 'Carlos', telefone: '(27) 3222-1000', email: 'vendas@autopecascentral.com.br', endereco: 'Rua das Oficinas, 10', observacoes: 'Entrega rápida.' });
  const fornecedor2 = saveFornecedor({ nome: 'Distribuidora Lubrax', cnpj: '22.333.444/0001-55', contato: 'Fernanda', telefone: '(27) 3222-2000', email: 'pedidos@lubrax.com.br' });
  const fornecedor3 = saveFornecedor({ nome: 'Baterias Forte', cnpj: '33.444.555/0001-66', contato: 'Roberto', telefone: '(27) 3222-3000', email: 'contato@bateriasforte.com.br' });

  const oleo = savePeca({ codigo: 'OL5W30', nome: 'Óleo motor 5W30', marca: 'Lubrax', categoria: 'Óleos e fluidos', unidade: 'L', fornecedorId: fornecedor2.id, fornecedorNome: fornecedor2.nome, localizacao: 'Prateleira A1', precoCusto: 32, precoVenda: 55, quantidadeEstoque: 12, estoqueMinimo: 4 });
  const filtro = savePeca({ codigo: 'FO-120', nome: 'Filtro de óleo', marca: 'Tecfil', categoria: 'Filtros', unidade: 'un', fornecedorId: fornecedor1.id, fornecedorNome: fornecedor1.nome, localizacao: 'Prateleira B2', precoCusto: 18, precoVenda: 40, quantidadeEstoque: 8, estoqueMinimo: 3 });
  const pastilha = savePeca({ codigo: 'PF-330', nome: 'Pastilha de freio dianteira', marca: 'Bosch', categoria: 'Freios', unidade: 'jogo', fornecedorId: fornecedor1.id, fornecedorNome: fornecedor1.nome, localizacao: 'Prateleira C1', precoCusto: 95, precoVenda: 180, quantidadeEstoque: 4, estoqueMinimo: 2 });
  savePeca({ codigo: 'CD-220', nome: 'Correia dentada', marca: 'Gates', categoria: 'Motor', unidade: 'un', fornecedorId: fornecedor1.id, fornecedorNome: fornecedor1.nome, localizacao: 'Prateleira A3', precoCusto: 120, precoVenda: 240, quantidadeEstoque: 2, estoqueMinimo: 1 });
  const bateria = savePeca({ codigo: 'BAT60', nome: 'Bateria 60Ah', marca: 'Moura', categoria: 'Elétrica', unidade: 'un', fornecedorId: fornecedor3.id, fornecedorNome: fornecedor3.nome, localizacao: 'Chão D1', precoCusto: 380, precoVenda: 620, quantidadeEstoque: 3, estoqueMinimo: 1 });
  savePeca({ codigo: 'H4-12V', nome: 'Lâmpada H4 12V', marca: 'Philips', categoria: 'Elétrica', unidade: 'un', fornecedorId: fornecedor1.id, fornecedorNome: fornecedor1.nome, localizacao: 'Balcão', precoCusto: 12, precoVenda: 30, quantidadeEstoque: 10, estoqueMinimo: 4 });
  savePeca({ codigo: 'DOT4', nome: 'Fluido de freio DOT4', marca: 'Bosch', categoria: 'Óleos e fluidos', unidade: 'L', fornecedorId: fornecedor1.id, fornecedorNome: fornecedor1.nome, localizacao: 'Prateleira A2', precoCusto: 22, precoVenda: 45, quantidadeEstoque: 1, estoqueMinimo: 2 });

  saveOrder({
    clienteId: maria.id, clienteNome: maria.nome, clienteTelefone: maria.telefone,
    clienteDocumento: maria.cpfCnpj, clienteEndereco: `${maria.endereco} · ${maria.cidade}`,
    veiculoId: store.data.veiculos.find((v) => v.clienteId === maria.id).id,
    veiculoPlaca: 'OCC2A34', veiculoDescricao: 'Fiat Uno 2014', km: '128400',
    dataAbertura: todayISO(), dataPrevisao: daysFromNow(1), status: 'Orçamento',
    problemaRelatado: 'Revisão completa e troca de óleo.',
    itens: [
      { tipo: 'peca', pecaId: oleo.id, descricao: oleo.nome, quantidade: 4, valorUnitario: 55 },
      { tipo: 'peca', pecaId: filtro.id, descricao: filtro.nome, quantidade: 1, valorUnitario: 40 },
      { tipo: 'mao_obra', descricao: 'Troca de óleo e filtro', quantidade: 1, valorUnitario: 80 }
    ],
    desconto: 0, formaPagamento: 'PIX', pago: false
  });

  saveOrder({
    clienteId: joao.id, clienteNome: joao.nome, clienteTelefone: joao.telefone,
    clienteDocumento: joao.cpfCnpj, clienteEndereco: `${joao.endereco} · ${joao.cidade}`,
    veiculoId: store.data.veiculos.find((v) => v.clienteId === joao.id).id,
    veiculoPlaca: 'PPH4B56', veiculoDescricao: 'Volkswagen Gol 2017', km: '84200',
    dataAbertura: todayISO(), dataPrevisao: daysFromNow(2), status: 'Aprovada',
    problemaRelatado: 'Freio fazendo ruído ao parar.',
    itens: [
      { tipo: 'peca', pecaId: pastilha.id, descricao: pastilha.nome, quantidade: 1, valorUnitario: 180 },
      { tipo: 'mao_obra', descricao: 'Troca de pastilhas de freio', quantidade: 1, valorUnitario: 160 }
    ],
    desconto: 0, formaPagamento: 'Cartão de débito', pago: false
  });

  const faturada = saveOrder({
    clienteId: alfa.id, clienteNome: alfa.nome, clienteTelefone: alfa.telefone,
    clienteDocumento: alfa.cpfCnpj, clienteEndereco: `${alfa.endereco} · ${alfa.cidade}`,
    veiculoId: store.data.veiculos.find((v) => v.clienteId === alfa.id).id,
    veiculoPlaca: 'RRT5C78', veiculoDescricao: 'Fiat Fiorino 2019', km: '152300',
    dataAbertura: daysFromNow(-4), dataPrevisao: daysFromNow(-1), status: 'Faturada',
    problemaRelatado: 'Veículo não liga pela manhã.',
    itens: [
      { tipo: 'peca', pecaId: bateria.id, descricao: bateria.nome, quantidade: 1, valorUnitario: 620 },
      { tipo: 'mao_obra', descricao: 'Teste de carga e troca de bateria', quantidade: 1, valorUnitario: 120 }
    ],
    desconto: 20, formaPagamento: 'Boleto', pago: false, observacoes: 'Cliente pediu nota fiscal.'
  });
  faturada.dataFaturamento = daysFromNow(-1);
  save();

  const paga = saveOrder({
    clienteId: maria.id, clienteNome: maria.nome, clienteTelefone: maria.telefone,
    veiculoId: store.data.veiculos.find((v) => v.clienteId === maria.id).id,
    veiculoPlaca: 'OCC2A34', veiculoDescricao: 'Fiat Uno 2014', km: '127900',
    dataAbertura: daysFromNow(-8), dataPrevisao: daysFromNow(-7), status: 'Faturada',
    problemaRelatado: 'Troca de lâmpada do farol.',
    itens: [{ tipo: 'mao_obra', descricao: 'Troca de lâmpada do farol', quantidade: 1, valorUnitario: 50 }],
    desconto: 0, formaPagamento: 'PIX', pago: true
  });
  paga.dataFaturamento = daysFromNow(-7);
  paga.dataPagamento = daysFromNow(-7);
  save();

  createCompra({
    fornecedorId: fornecedor1.id, fornecedorNome: fornecedor1.nome, numeroNota: '1234',
    data: daysFromNow(-2), dataVencimento: daysFromNow(10), statusPagamento: 'Pendente',
    formaPagamento: 'Boleto', observacoes: 'Reposição de filtros.',
    itens: [{ pecaId: filtro.id, pecaNome: filtro.nome, quantidade: 5, valorUnitario: 20 }]
  });
  const compraPaga = createCompra({
    fornecedorId: fornecedor3.id, fornecedorNome: fornecedor3.nome, numeroNota: '7788',
    data: daysFromNow(-9), dataVencimento: daysFromNow(-9), statusPagamento: 'Pago',
    formaPagamento: 'PIX',
    itens: [{ pecaId: bateria.id, pecaNome: bateria.nome, quantidade: 2, valorUnitario: 360 }]
  });
  compraPaga.dataPagamento = daysFromNow(-9);
  save();

  saveDespesa({ descricao: 'Aluguel do galpão', categoria: 'Aluguel', fornecedorNome: 'Imobiliária Central', valor: 2500, data: daysFromNow(-5), dataVencimento: daysFromNow(5), status: 'Pendente', formaPagamento: 'Transferência' });
  const energia = saveDespesa({ descricao: 'Conta de energia', categoria: 'Energia', fornecedorNome: 'EDP', valor: 420, data: daysFromNow(-6), dataVencimento: daysFromNow(-1), status: 'Pago', formaPagamento: 'Boleto' });
  energia.dataPagamento = daysFromNow(-2);
  save();

  store.data.meta.demo = true;
  save();
}

export function seedDemo() {
  if (!isStoreEmpty()) {
    throw new Error('Os dados de exemplo só podem ser carregados quando o sistema ainda está vazio.');
  }
  const previousData = store.data;
  const previousPersisted = persistedData;
  const previousCorruptRaw = corruptRaw;
  let previousRaw = null;
  let canRestoreRaw = true;
  try {
    previousRaw = storageAdapter.getItem(STORAGE_KEY);
  } catch {
    canRestoreRaw = false;
  }
  try {
    populateDemo();
  } catch (error) {
    store.data = previousData;
    persistedData = previousPersisted;
    corruptRaw = previousCorruptRaw;
    if (canRestoreRaw) {
      try {
        if (previousRaw === null) storageAdapter.removeItem(STORAGE_KEY);
        else storageAdapter.setItem(STORAGE_KEY, previousRaw);
      } catch (restoreError) {
        console.error('Não foi possível restaurar o armazenamento anterior.', restoreError);
      }
    }
    throw error;
  }
}
