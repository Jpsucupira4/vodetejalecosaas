/**
 * ══════════════════════════════════════════════════
 * VODETE JALECOS — app.js
 * Lógica Principal da Aplicação
 * ══════════════════════════════════════════════════
 */

// ────────────────────────────────────────────────
// INICIALIZAÇÃO
// ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Storage.seedIfEmpty();

  if (Auth.restoreSession()) {
    enterApp();
  } else {
    showLogin();
  }

  bindLoginForm();
  bindSidebar();
  bindModalCloseButtons();
});

function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

function enterApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';

  const user = Auth.getUser();

  // Atualiza info de usuário na sidebar
  document.getElementById('user-name').textContent  = user.name;
  document.getElementById('user-role').textContent  = user.role === 'admin' ? 'Administradora' : 'Vendedora';
  document.getElementById('user-avatar').textContent = user.name.charAt(0).toUpperCase();

  // Esconde itens admin para vendedoras
  if (!Auth.isAdmin()) {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  } else {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
  }

  // Vai para o dashboard
  navigateTo('dashboard');

  // Bind demais eventos
  bindNavigation();
  bindProductsPage();
  bindSalesPage();
  bindHistoricoPage();
  bindVendedorasPage();
  bindRelatoriosPage();
  bindLogout();
}

// ────────────────────────────────────────────────
// LOGIN
// ────────────────────────────────────────────────
function bindLoginForm() {
  document.getElementById('btn-login').addEventListener('click', handleLogin);
  document.getElementById('login-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });
}

function handleLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');

  errEl.style.display = 'none';
  UI.btnLoading('btn-login', true);

  setTimeout(() => {
    const result = Auth.login(email, password);
    UI.btnLoading('btn-login', false);

    if (result.success) {
      enterApp();
    } else {
      errEl.textContent = result.error;
      errEl.style.display = 'block';
    }
  }, 400);
}

// ────────────────────────────────────────────────
// LOGOUT
// ────────────────────────────────────────────────
function bindLogout() {
  document.getElementById('btn-logout').addEventListener('click', doLogout);
  const mob = document.getElementById('btn-logout-mobile');
  if (mob) mob.addEventListener('click', doLogout);
}

function doLogout() {
  Auth.logout();
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').style.display = 'none';
  showLogin();
}

// ────────────────────────────────────────────────
// SIDEBAR / NAVEGAÇÃO
// ────────────────────────────────────────────────
function bindSidebar() {
  const toggle  = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');

  // Overlay para mobile
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);

  toggle?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  });
}

function bindNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const page = item.dataset.page;
      if (page) navigateTo(page);

      // Fecha sidebar no mobile
      document.getElementById('sidebar').classList.remove('open');
      document.querySelector('.sidebar-overlay')?.classList.remove('active');
    });
  });
}

function navigateTo(page) {
  UI.showPage(page);

  switch (page) {
    case 'dashboard':   renderDashboard();   break;
    case 'estoque':     renderEstoque();     break;
    case 'vendas':      renderVendasPage();  break;
    case 'historico':   renderHistorico();   break;
    case 'vendedoras':  renderVendedoras();  break;
    case 'relatorios':  renderRelatorios();  break;
  }
}

// ────────────────────────────────────────────────
// MODAIS — fechar botões genéricos
// ────────────────────────────────────────────────
function bindModalCloseButtons() {
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => UI.closeModal(btn.dataset.modal));
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) UI.closeModal(overlay.id);
    });
  });
}

// ════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════
function renderDashboard() {
  const sales    = Auth.isAdmin() ? Storage.getSales() : Storage.getSalesByUser(Auth.getUser().id);
  const products = Storage.getProducts();

  const totalRevenue  = sales.reduce((s, v) => s + v.total, 0);
  const totalItems    = sales.reduce((s, v) => s + v.qty, 0);
  const lowStock      = products.filter(p => p.stock <= 3 && p.stock > 0).length;
  const outOfStock    = products.filter(p => p.stock === 0).length;

  // Stats
  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Vendas</div>
      <div class="stat-value">${UI.formatCurrency(totalRevenue)}</div>
      <div class="stat-sub">${sales.length} transações</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Peças Vendidas</div>
      <div class="stat-value">${totalItems}</div>
      <div class="stat-sub">unidades no total</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Produtos Cadastrados</div>
      <div class="stat-value">${products.length}</div>
      <div class="stat-sub">${lowStock} com estoque baixo</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Sem Estoque</div>
      <div class="stat-value" style="color:var(--danger)">${outOfStock}</div>
      <div class="stat-sub">produtos esgotados</div>
    </div>
  `;

  // Top produtos
  const productCount = {};
  sales.forEach(s => {
    if (!productCount[s.productId]) productCount[s.productId] = { qty: 0, revenue: 0, name: s.productName };
    productCount[s.productId].qty     += s.qty;
    productCount[s.productId].revenue += s.total;
  });

  const topProducts = Object.entries(productCount)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5);

  const topEl = document.getElementById('top-products-list');
  if (!topProducts.length) {
    topEl.innerHTML = UI.emptyState('Nenhuma venda registrada ainda.');
  } else {
    topEl.innerHTML = topProducts.map(([id, info], i) => `
      <div class="top-item">
        <div class="top-rank">${i + 1}</div>
        <div class="top-info">
          <strong>${info.name}</strong>
          <span>${info.qty} unidades vendidas</span>
        </div>
        <div class="top-value">${UI.formatCurrency(info.revenue)}</div>
      </div>
    `).join('');
  }

  // Vendas recentes
  const recentSales = [...sales].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
  const recentEl = document.getElementById('recent-sales-list');

  if (!recentSales.length) {
    recentEl.innerHTML = UI.emptyState('Nenhuma venda ainda.');
  } else {
    recentEl.innerHTML = recentSales.map(s => `
      <div class="recent-sale">
        <div class="recent-sale-info">
          <strong>${s.productName}</strong>
          <span>${UI.formatDateTime(s.createdAt)} · ${s.qty} un.</span>
        </div>
        <div class="recent-sale-value">${UI.formatCurrency(s.total)}</div>
      </div>
    `).join('');
  }
}

// ════════════════════════════════════════════════
// ESTOQUE
// ════════════════════════════════════════════════
let editingProductId = null;

function bindProductsPage() {
  document.getElementById('btn-add-product')?.addEventListener('click', () => {
    editingProductId = null;
    clearProductForm();
    document.getElementById('modal-product-title').textContent = 'Novo Produto';
    UI.openModal('modal-product');
  });

  document.getElementById('btn-save-product')?.addEventListener('click', saveProduct);

  document.getElementById('search-products')?.addEventListener('input', filterProducts);
  document.getElementById('filter-category')?.addEventListener('change', filterProducts);

  // Popular select de categorias no filtro
  const filterCat = document.getElementById('filter-category');
  if (filterCat) {
    filterCat.innerHTML = '<option value="">Todas as categorias</option>' + UI.getCategoryOptions();
  }
}

function renderEstoque() {
  renderProductsTable(Storage.getProducts());
}

function renderProductsTable(products) {
  const tbody = document.getElementById('products-tbody');
  const isAdmin = Auth.isAdmin();

  if (!products.length) {
    tbody.innerHTML = `<tr><td colspan="7">${UI.emptyState('Nenhum produto encontrado.')}</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr>
      <td><strong>${p.name}</strong></td>
      <td><span class="cat-label">${UI.getCategoryLabel(p.category)}</span></td>
      <td>${p.size}</td>
      <td>${p.color}</td>
      <td>${UI.formatCurrency(p.price)}</td>
      <td>${UI.stockBadge(p.stock)}</td>
      <td>
        ${isAdmin ? `
          <div class="actions">
            <button class="btn btn-sm btn-outline" onclick="openEditProduct('${p.id}')">Editar</button>
            <button class="btn btn-sm btn-danger" onclick="removeProduct('${p.id}')">Remover</button>
          </div>
        ` : '—'}
      </td>
    </tr>
  `).join('');
}

function filterProducts() {
  const search = document.getElementById('search-products').value.toLowerCase();
  const cat    = document.getElementById('filter-category').value;

  let products = Storage.getProducts();
  if (search) products = products.filter(p => p.name.toLowerCase().includes(search) || p.color.toLowerCase().includes(search));
  if (cat)    products = products.filter(p => p.category === cat);

  renderProductsTable(products);
}

function clearProductForm() {
  ['prod-name','prod-color','prod-price','prod-stock'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('prod-category').value = 'scrub';
  document.getElementById('prod-size').value = 'M';
}

function openEditProduct(id) {
  const p = Storage.getProductById(id);
  if (!p) return;
  editingProductId = id;

  document.getElementById('prod-name').value     = p.name;
  document.getElementById('prod-category').value = p.category;
  document.getElementById('prod-size').value     = p.size;
  document.getElementById('prod-color').value    = p.color;
  document.getElementById('prod-price').value    = p.price;
  document.getElementById('prod-stock').value    = p.stock;

  document.getElementById('modal-product-title').textContent = 'Editar Produto';
  UI.openModal('modal-product');
}

function saveProduct() {
  const name     = document.getElementById('prod-name').value.trim();
  const category = document.getElementById('prod-category').value;
  const size     = document.getElementById('prod-size').value;
  const color    = document.getElementById('prod-color').value.trim();
  const price    = parseFloat(document.getElementById('prod-price').value);
  const stock    = parseInt(document.getElementById('prod-stock').value);

  if (!name)           return UI.toast('Informe o nome do produto.', 'error');
  if (isNaN(price))    return UI.toast('Informe um preço válido.', 'error');
  if (isNaN(stock))    return UI.toast('Informe a quantidade em estoque.', 'error');

  const data = { name, category, size, color: color || '—', price, stock };

  if (editingProductId) {
    Storage.updateProduct(editingProductId, data);
    UI.toast('Produto atualizado!', 'success');
  } else {
    data.id = UI.generateId('prod');
    Storage.createProduct(data);
    UI.toast('Produto cadastrado!', 'success');
  }

  UI.closeModal('modal-product');
  renderEstoque();
}

function removeProduct(id) {
  if (!UI.confirm('Remover este produto?')) return;
  Storage.deleteProduct(id);
  UI.toast('Produto removido.', 'info');
  renderEstoque();
}

// ════════════════════════════════════════════════
// VENDAS
// ════════════════════════════════════════════════
function bindSalesPage() {
  document.getElementById('sale-product')?.addEventListener('change', updateSaleSummary);
  document.getElementById('sale-qty')?.addEventListener('input', updateSaleSummary);
  document.getElementById('btn-confirm-sale')?.addEventListener('click', confirmSale);
}

function renderVendasPage() {
  const products = Storage.getProducts().filter(p => p.stock > 0);
  const select   = document.getElementById('sale-product');

  select.innerHTML = '<option value="">— Selecione um produto —</option>' +
    products.map(p => `<option value="${p.id}">${p.name} (${p.size} / ${p.color})</option>`).join('');

  document.getElementById('sale-qty').value = 1;
  updateSaleSummary();
  renderTodaySales();
}

function updateSaleSummary() {
  const productId = document.getElementById('sale-product').value;
  const qty       = parseInt(document.getElementById('sale-qty').value) || 1;
  const infoEl    = document.getElementById('sale-product-info');

  if (!productId) {
    infoEl.style.display = 'none';
    document.getElementById('sale-total').textContent = 'R$ 0,00';
    return;
  }

  const p = Storage.getProductById(productId);
  if (!p) return;

  document.getElementById('info-stock').textContent = `Estoque: ${p.stock} un.`;
  document.getElementById('info-price').textContent = `Preço: ${UI.formatCurrency(p.price)}`;
  infoEl.style.display = 'flex';

  document.getElementById('sale-total').textContent = UI.formatCurrency(p.price * qty);
}

function confirmSale() {
  const productId = document.getElementById('sale-product').value;
  const qty       = parseInt(document.getElementById('sale-qty').value);
  const payment   = document.getElementById('sale-payment').value;
  const notes     = document.getElementById('sale-notes').value.trim();

  if (!productId) return UI.toast('Selecione um produto.', 'error');
  if (!qty || qty < 1) return UI.toast('Informe uma quantidade válida.', 'error');

  const p = Storage.getProductById(productId);
  if (!p) return UI.toast('Produto não encontrado.', 'error');
  if (p.stock < qty) return UI.toast(`Estoque insuficiente. Disponível: ${p.stock} un.`, 'error');

  const user = Auth.getUser();

  const sale = {
    id:          UI.generateId('sale'),
    productId:   productId,
    productName: p.name,
    qty:         qty,
    unitPrice:   p.price,
    total:       p.price * qty,
    payment:     payment,
    notes:       notes,
    sellerId:    user.id,
    sellerName:  user.name,
    createdAt:   new Date().toISOString(),
  };

  const stockResult = Storage.decreaseStock(productId, qty);
  if (!stockResult.success) return UI.toast(stockResult.error, 'error');

  Storage.createSale(sale);

  UI.toast(`Venda registrada! ${UI.formatCurrency(sale.total)}`, 'success');

  // Reset form
  document.getElementById('sale-product').value = '';
  document.getElementById('sale-qty').value = 1;
  document.getElementById('sale-notes').value = '';
  document.getElementById('sale-product-info').style.display = 'none';
  document.getElementById('sale-total').textContent = 'R$ 0,00';

  renderTodaySales();
}

function renderTodaySales() {
  const todayStr = UI.today();
  const user     = Auth.getUser();

  let sales = Storage.getSales().filter(s => s.createdAt.startsWith(todayStr));
  if (!Auth.isAdmin()) sales = sales.filter(s => s.sellerId === user.id);

  sales = sales.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const el = document.getElementById('today-sales-list');

  if (!sales.length) {
    el.innerHTML = UI.emptyState('Nenhuma venda hoje ainda.');
    return;
  }

  el.innerHTML = sales.slice(0, 8).map(s => `
    <div class="today-sale-item">
      <div>
        <strong>${s.productName}</strong><br>
        <small style="color:var(--text-soft)">${s.qty} un. · ${UI.getPaymentLabel(s.payment)}</small>
      </div>
      <span class="s-val">${UI.formatCurrency(s.total)}</span>
    </div>
  `).join('');
}

// ════════════════════════════════════════════════
// HISTÓRICO DE VENDAS
// ════════════════════════════════════════════════
function bindHistoricoPage() {
  document.getElementById('btn-filter-sales')?.addEventListener('click', renderHistorico);

  // Popula select de vendedoras
  const sellerSelect = document.getElementById('filter-seller');
  if (sellerSelect) {
    const users = Storage.getUsers().filter(u => u.role !== 'admin' || true);
    sellerSelect.innerHTML = '<option value="">Todas as vendedoras</option>' +
      users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
  }
}

function renderHistorico() {
  const from     = document.getElementById('filter-date-from')?.value || '';
  const to       = document.getElementById('filter-date-to')?.value   || '';
  const sellerId = document.getElementById('filter-seller')?.value    || '';

  let sales = Storage.getSales();

  if (!Auth.isAdmin()) {
    sales = sales.filter(s => s.sellerId === Auth.getUser().id);
  } else if (sellerId) {
    sales = sales.filter(s => s.sellerId === sellerId);
  }

  if (from) sales = sales.filter(s => s.createdAt >= from);
  if (to)   sales = sales.filter(s => s.createdAt.split('T')[0] <= to);

  sales = sales.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const isAdmin = Auth.isAdmin();
  const tbody   = document.getElementById('sales-tbody');

  if (!sales.length) {
    tbody.innerHTML = `<tr><td colspan="6">${UI.emptyState('Nenhuma venda encontrada.')}</td></tr>`;
    return;
  }

  tbody.innerHTML = sales.map(s => `
    <tr>
      <td>${UI.formatDateTime(s.createdAt)}</td>
      <td>
        <strong>${s.productName}</strong>
        ${s.notes ? `<br><small style="color:var(--text-soft)">${s.notes}</small>` : ''}
      </td>
      <td>${s.qty}</td>
      <td><strong>${UI.formatCurrency(s.total)}</strong></td>
      <td><span class="badge badge-rose">${UI.getPaymentLabel(s.payment)}</span></td>
      ${isAdmin ? `<td>${s.sellerName}</td>` : ''}
    </tr>
  `).join('');
}

// ════════════════════════════════════════════════
// VENDEDORAS
// ════════════════════════════════════════════════
let editingSellerId = null;

function bindVendedorasPage() {
  document.getElementById('btn-add-seller')?.addEventListener('click', () => {
    editingSellerId = null;
    clearSellerForm();
    document.getElementById('modal-seller-title').textContent = 'Nova Vendedora';
    document.getElementById('seller-password').placeholder = 'Mínimo 6 caracteres';
    UI.openModal('modal-seller');
  });

  document.getElementById('btn-save-seller')?.addEventListener('click', saveSeller);
}

function renderVendedoras() {
  const users  = Storage.getUsers();
  const sales  = Storage.getSales();
  const tbody  = document.getElementById('sellers-tbody');

  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="5">${UI.emptyState('Nenhum usuário cadastrado.')}</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => {
    const userSales = sales.filter(s => s.sellerId === u.id);
    const total     = userSales.reduce((s, v) => s + v.total, 0);

    return `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td><span class="badge ${u.role === 'admin' ? 'badge-rose' : 'badge-blue'}">${u.role === 'admin' ? 'Admin' : 'Vendedora'}</span></td>
        <td>${UI.formatCurrency(total)}</td>
        <td>
          <div class="actions">
            <button class="btn btn-sm btn-outline" onclick="openEditSeller('${u.id}')">Editar</button>
            ${u.id !== Auth.getUser().id ? `<button class="btn btn-sm btn-danger" onclick="removeSeller('${u.id}')">Remover</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function clearSellerForm() {
  ['seller-name','seller-email','seller-password'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('seller-role').value = 'vendedora';
}

function openEditSeller(id) {
  const users = Storage.getUsers();
  const u = users.find(x => x.id === id);
  if (!u) return;

  editingSellerId = id;
  document.getElementById('seller-name').value     = u.name;
  document.getElementById('seller-email').value    = u.email;
  document.getElementById('seller-password').value = '';
  document.getElementById('seller-password').placeholder = 'Deixe em branco para não alterar';
  document.getElementById('seller-role').value     = u.role;
  document.getElementById('modal-seller-title').textContent = 'Editar Usuário';

  UI.openModal('modal-seller');
}

function saveSeller() {
  const name     = document.getElementById('seller-name').value.trim();
  const email    = document.getElementById('seller-email').value.trim();
  const password = document.getElementById('seller-password').value;
  const role     = document.getElementById('seller-role').value;

  if (!name || !email) return UI.toast('Preencha nome e e-mail.', 'error');

  if (editingSellerId) {
    const updates = { name, email, role };
    if (password) {
      if (password.length < 6) return UI.toast('Senha deve ter no mínimo 6 caracteres.', 'error');
      updates.password = btoa(password);
    }
    Storage.updateUser(editingSellerId, updates);
    UI.toast('Usuário atualizado!', 'success');
  } else {
    if (!password) return UI.toast('Informe uma senha.', 'error');
    const result = Auth.registerUser({ name, email, password, role });
    if (!result.success) return UI.toast(result.error, 'error');
    UI.toast('Vendedora cadastrada!', 'success');
  }

  UI.closeModal('modal-seller');
  renderVendedoras();
}

function removeSeller(id) {
  if (!UI.confirm('Remover este usuário?')) return;
  Storage.deleteUser(id);
  UI.toast('Usuário removido.', 'info');
  renderVendedoras();
}

// ════════════════════════════════════════════════
// RELATÓRIOS
// ════════════════════════════════════════════════
function bindRelatoriosPage() {
  document.getElementById('btn-generate-report')?.addEventListener('click', generateReport);

  // Datas padrão: primeiro dia do mês até hoje
  const now   = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = UI.today();

  const fromEl = document.getElementById('report-date-from');
  const toEl   = document.getElementById('report-date-to');
  if (fromEl) fromEl.value = first;
  if (toEl)   toEl.value   = todayStr;
}

function renderRelatorios() {
  generateReport();
}

function generateReport() {
  const from = document.getElementById('report-date-from')?.value || '';
  const to   = document.getElementById('report-date-to')?.value   || '';

  let sales = Storage.getSales();
  if (from) sales = sales.filter(s => s.createdAt >= from);
  if (to)   sales = sales.filter(s => s.createdAt.split('T')[0] <= to);

  const totalRevenue = sales.reduce((s, v) => s + v.total, 0);
  const totalQty     = sales.reduce((s, v) => s + v.qty, 0);
  const avgTicket    = sales.length ? totalRevenue / sales.length : 0;

  // Stats
  document.getElementById('report-stats').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Faturamento Total</div>
      <div class="stat-value">${UI.formatCurrency(totalRevenue)}</div>
      <div class="stat-sub">${sales.length} vendas no período</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Peças Vendidas</div>
      <div class="stat-value">${totalQty}</div>
      <div class="stat-sub">unidades</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Ticket Médio</div>
      <div class="stat-value">${UI.formatCurrency(avgTicket)}</div>
      <div class="stat-sub">por venda</div>
    </div>
  `;

  // Por vendedora
  const bySeller = {};
  sales.forEach(s => {
    if (!bySeller[s.sellerId]) bySeller[s.sellerId] = { name: s.sellerName, total: 0, qty: 0 };
    bySeller[s.sellerId].total += s.total;
    bySeller[s.sellerId].qty   += s.qty;
  });

  const sellerEntries = Object.entries(bySeller).sort((a, b) => b[1].total - a[1].total);
  const maxSeller     = sellerEntries[0]?.[1].total || 1;
  const reportBySeller = document.getElementById('report-by-seller');

  if (!sellerEntries.length) {
    reportBySeller.innerHTML = UI.emptyState('Nenhuma venda no período.');
  } else {
    reportBySeller.innerHTML = sellerEntries.map(([id, info]) => `
      <div class="report-bar-item">
        <div class="report-bar-label">
          <span>${info.name}</span>
          <span>${UI.formatCurrency(info.total)} · ${info.qty} un.</span>
        </div>
        <div class="report-bar-track">
          <div class="report-bar-fill" style="width:${(info.total / maxSeller * 100).toFixed(1)}%"></div>
        </div>
      </div>
    `).join('');
  }

  // Produtos mais vendidos no período
  const byProduct = {};
  sales.forEach(s => {
    if (!byProduct[s.productId]) byProduct[s.productId] = { name: s.productName, qty: 0, total: 0 };
    byProduct[s.productId].qty   += s.qty;
    byProduct[s.productId].total += s.total;
  });

  const productEntries = Object.entries(byProduct).sort((a, b) => b[1].qty - a[1].qty).slice(0, 8);
  const maxProd        = productEntries[0]?.[1].qty || 1;
  const reportTopProds = document.getElementById('report-top-products');

  if (!productEntries.length) {
    reportTopProds.innerHTML = UI.emptyState('Nenhuma venda no período.');
  } else {
    reportTopProds.innerHTML = productEntries.map(([id, info]) => `
      <div class="report-bar-item">
        <div class="report-bar-label">
          <span>${info.name}</span>
          <span>${info.qty} un.</span>
        </div>
        <div class="report-bar-track">
          <div class="report-bar-fill" style="width:${(info.qty / maxProd * 100).toFixed(1)}%"></div>
        </div>
      </div>
    `).join('');
  }
}
