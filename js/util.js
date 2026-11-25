const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const qtyFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

export function money(value) {
  return moneyFmt.format(Number(value) || 0);
}

export function qty(value) {
  return qtyFmt.format(Number(value) || 0);
}

export function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function todayISO() {
  return localDateISO(new Date());
}

export function localDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function nowISO() {
  return new Date().toISOString();
}

export function fmtDate(iso) {
  if (!iso) return '—';
  const text = String(iso);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [y, m, d] = text.split('-');
    return `${d}/${m}/${y}`;
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR');
}

export function fmtDateTime(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return fmtDate(iso);
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function monthKey(iso = todayISO()) {
  return String(iso).slice(0, 7);
}

export function monthLabel(key) {
  if (!key) return '';
  const [y, m] = String(key).split('-').map(Number);
  if (!y || !m) return '';
  const date = new Date(y, m - 1, 1);
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function isInMonth(iso, key = monthKey()) {
  return Boolean(iso) && String(iso).slice(0, 7) === key;
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

export const esc = escapeHtml;

export function attr(value) {
  return escapeHtml(value);
}

export function uid(prefix = 'id') {
  const random = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

export function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function whatsAppNumber(phone) {
  const digits = onlyDigits(phone);
  if (!digits) return '';
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if (digits.length === 12 || digits.length === 13) return digits;
  return '';
}

export function phoneLooksValid(phone) {
  const digits = onlyDigits(phone);
  return digits.length === 10 || digits.length === 11;
}

export function slugify(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function sum(list, pick = (item) => item) {
  return (list || []).reduce((total, item) => total + (Number(pick(item)) || 0), 0);
}

export function sortBy(list, pick, direction = 'asc') {
  const factor = direction === 'desc' ? -1 : 1;
  return [...(list || [])].sort((a, b) => {
    const va = pick(a);
    const vb = pick(b);
    return String(va ?? '').localeCompare(String(vb ?? ''), 'pt-BR', { numeric: true }) * factor;
  });
}

export function debounce(fn, delay = 220) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function truncate(value, max = 60) {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function fileStamp() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function vehicleTitle(vehicle) {
  if (!vehicle) return '';
  return [vehicle.marca, vehicle.modelo, vehicle.ano].filter(Boolean).join(' ');
}

export function normalizeSearch(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function compareISO(a, b) {
  return String(a || '').localeCompare(String(b || ''));
}
