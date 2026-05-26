/**
 * ══════════════════════════════════════════════════
 * VODETE JALECOS — ui.js
 * Helpers de Interface
 * ══════════════════════════════════════════════════
 */

const UI = (() => {

  // ── Formatação ──────────────────────────────────

  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  }

  function formatDate(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
  }

  function formatDateTime(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
  }

  function today() {
    return new Date().toISOString().split('T')[0];
  }

  function generateId(prefix) {
    return (prefix || 'id') + '_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
  }

  // ── Toast Notifications ──────────────────────────

  let toastTimer;

  function toast(message, type = 'info') {
    const el = document.getElementById('toast');
    if (!el) return;
    clearTimeout(toastTimer);
    el.className = `toast toast-${type}`;
    el.textContent = message;
    el.style.display = 'block';
    toastTimer = setTimeout(() => { el.style.display = 'none'; }, 3200);
  }

  // ── Modais ───────────────────────────────────────

  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }

  // ── Páginas ──────────────────────────────────────

  function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const page = document.getElementById('page-' + pageId);
    if (page) page.classList.add('active');

    const nav = document.querySelector(`[data-page="${pageId}"]`);
    if (nav) nav.classList.add('active');
  }

  // ── Categorias ───────────────────────────────────

  const CATEGORIES = {
    scrub:                 'Scrub Microfibra',
    scrub_tech:            'Scrub Tecnológico',
    macacao:               'Macacão',
    jaleco_fem:            'Jaleco Feminino',
    jaleco_masc:           'Jaleco Masculino',
    jaleco_dentista_fem:   'Jaleco Dentista Fem.',
    jaleco_dentista_masc:  'Jaleco Dentista Masc.',
    blusa:                 'Blusa Estampada',
  };

  const PAYMENT_LABELS = {
    pix:             'PIX',
    dinheiro:        'Dinheiro',
    cartao_credito:  'Cartão Crédito',
    cartao_debito:   'Cartão Débito',
  };

  function getCategoryLabel(key) { return CATEGORIES[key] || key; }
  function getPaymentLabel(key)  { return PAYMENT_LABELS[key] || key; }

  function getCategoryOptions() {
    return Object.entries(CATEGORIES)
      .map(([k, v]) => `<option value="${k}">${v}</option>`)
      .join('');
  }

  // ── Badge de estoque ─────────────────────────────

  function stockBadge(qty) {
    if (qty === 0) return `<span class="stock-zero">Sem estoque</span>`;
    if (qty <= 3)  return `<span class="stock-low">${qty} un.</span>`;
    if (qty <= 8)  return `<span class="stock-mid">${qty} un.</span>`;
    return `<span class="stock-high">${qty} un.</span>`;
  }

  // ── Loading no botão ─────────────────────────────

  function btnLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const text   = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    if (text)   text.style.display   = loading ? 'none' : '';
    if (loader) loader.style.display = loading ? 'inline' : 'none';
    btn.disabled = loading;
  }

  // ── Empty State ──────────────────────────────────

  function emptyState(message) {
    return `<div class="empty-state"><p>${message}</p></div>`;
  }

  // ── Confirm dialog ───────────────────────────────
  function confirm(message) {
    return window.confirm(message);
  }

  return {
    formatCurrency, formatDate, formatDateTime, today, generateId,
    toast, openModal, closeModal, showPage,
    CATEGORIES, PAYMENT_LABELS, getCategoryLabel, getPaymentLabel,
    getCategoryOptions, stockBadge, btnLoading, emptyState, confirm,
  };

})();
