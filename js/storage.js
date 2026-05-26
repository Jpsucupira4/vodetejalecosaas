/**
 * ══════════════════════════════════════════════════
 * VODETE JALECOS — storage.js
 * Camada de Persistência de Dados
 *
 * HOJE: usa LocalStorage
 * FUTURO: basta trocar cada função por chamadas ao Supabase
 *
 * Exemplo de migração para Supabase:
 *   async function getProducts() {
 *     const { data } = await supabase.from('products').select('*');
 *     return data;
 *   }
 * ══════════════════════════════════════════════════
 */

const DB_KEYS = {
  users:    'vodete_users',
  products: 'vodete_products',
  sales:    'vodete_sales',
  session:  'vodete_session',
};

// ── Helpers ──────────────────────────────────────
function _get(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function _set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch { return false; }
}

// ── USUÁRIOS ──────────────────────────────────────
function getUsers()      { return _get(DB_KEYS.users) || []; }
function saveUsers(data) { return _set(DB_KEYS.users, data); }

function getUserByEmail(email) {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

function createUser(user) {
  const users = getUsers();
  const exists = users.find(u => u.email.toLowerCase() === user.email.toLowerCase());
  if (exists) return { success: false, error: 'E-mail já cadastrado.' };
  users.push(user);
  saveUsers(users);
  return { success: true };
}

function updateUser(id, updates) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return { success: false, error: 'Usuário não encontrado.' };
  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);
  return { success: true };
}

function deleteUser(id) {
  const users = getUsers().filter(u => u.id !== id);
  saveUsers(users);
  return { success: true };
}

// ── PRODUTOS ──────────────────────────────────────
function getProducts()      { return _get(DB_KEYS.products) || []; }
function saveProducts(data) { return _set(DB_KEYS.products, data); }

function getProductById(id) {
  return getProducts().find(p => p.id === id) || null;
}

function createProduct(product) {
  const products = getProducts();
  products.push(product);
  saveProducts(products);
  return { success: true };
}

function updateProduct(id, updates) {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return { success: false, error: 'Produto não encontrado.' };
  products[idx] = { ...products[idx], ...updates };
  saveProducts(products);
  return { success: true };
}

function deleteProduct(id) {
  const products = getProducts().filter(p => p.id !== id);
  saveProducts(products);
  return { success: true };
}

function decreaseStock(productId, qty) {
  const product = getProductById(productId);
  if (!product) return { success: false, error: 'Produto não encontrado.' };
  if (product.stock < qty) return { success: false, error: 'Estoque insuficiente.' };
  return updateProduct(productId, { stock: product.stock - qty });
}

function increaseStock(productId, qty) {
  const product = getProductById(productId);
  if (!product) return { success: false, error: 'Produto não encontrado.' };
  return updateProduct(productId, { stock: product.stock + qty });
}

// ── VENDAS ────────────────────────────────────────
function getSales()      { return _get(DB_KEYS.sales) || []; }
function saveSales(data) { return _set(DB_KEYS.sales, data); }

function getSalesByUser(userId) {
  return getSales().filter(s => s.sellerId === userId);
}

function getSalesByPeriod(from, to) {
  return getSales().filter(s => {
    const d = new Date(s.createdAt);
    return d >= new Date(from) && d <= new Date(to + 'T23:59:59');
  });
}

function createSale(sale) {
  const sales = getSales();
  sales.push(sale);
  saveSales(sales);
  return { success: true };
}

function deleteSale(id) {
  const sales = getSales().filter(s => s.id !== id);
  saveSales(sales);
  return { success: true };
}

// ── SESSÃO ────────────────────────────────────────
function getSession()           { return _get(DB_KEYS.session); }
function saveSession(user)      { return _set(DB_KEYS.session, user); }
function clearSession()         { localStorage.removeItem(DB_KEYS.session); }

// ── SEED DATA ─────────────────────────────────────
/**
 * Inicializa o banco com dados padrão se estiver vazio.
 * Remove esta função ao migrar para Supabase.
 */
function seedIfEmpty() {
  // Admin padrão
  if (!getUsers().length) {
    const admin = {
      id:        'user_001',
      name:      'Administradora',
      email:     'admin@vodete.com',
      password:  btoa('admin123'),   // base64 simples — trocar por hash real no Supabase
      role:      'admin',
      createdAt: new Date().toISOString(),
    };
    const seller = {
      id:        'user_002',
      name:      'Ana Paula',
      email:     'ana@vodete.com',
      password:  btoa('venda123'),
      role:      'vendedora',
      createdAt: new Date().toISOString(),
    };
    saveUsers([admin, seller]);
  }

  // Produtos padrão
  if (!getProducts().length) {
    const products = [
      // ── 11 Scrubs Microfibra
      { id:'prod_001', name:'Scrub Microfibra Rosa Antigo',     category:'scrub', size:'P',   color:'Rosa Antigo',     price:129.90, stock:15 },
      { id:'prod_002', name:'Scrub Microfibra Nude',            category:'scrub', size:'M',   color:'Nude',            price:129.90, stock:12 },
      { id:'prod_003', name:'Scrub Microfibra Branco',          category:'scrub', size:'M',   color:'Branco',          price:129.90, stock:10 },
      { id:'prod_004', name:'Scrub Microfibra Cinza Chumbo',    category:'scrub', size:'G',   color:'Cinza Chumbo',    price:129.90, stock:8  },
      { id:'prod_005', name:'Scrub Microfibra Azul Petróleo',   category:'scrub', size:'GG',  color:'Azul Petróleo',   price:139.90, stock:6  },
      { id:'prod_006', name:'Scrub Microfibra Vinho',           category:'scrub', size:'P',   color:'Vinho',           price:129.90, stock:14 },
      { id:'prod_007', name:'Scrub Microfibra Verde Sage',      category:'scrub', size:'M',   color:'Verde Sage',      price:129.90, stock:9  },
      { id:'prod_008', name:'Scrub Microfibra Lilás',           category:'scrub', size:'PP',  color:'Lilás',           price:129.90, stock:11 },
      { id:'prod_009', name:'Scrub Microfibra Caramelo',        category:'scrub', size:'G',   color:'Caramelo',        price:139.90, stock:7  },
      { id:'prod_010', name:'Scrub Microfibra Preto',           category:'scrub', size:'GG',  color:'Preto',           price:129.90, stock:13 },
      { id:'prod_011', name:'Scrub Microfibra Terracota',       category:'scrub', size:'M',   color:'Terracota',       price:139.90, stock:5  },
      // ── 2 Macacões
      { id:'prod_012', name:'Macacão Cirúrgico Feminino Nude',  category:'macacao', size:'M', color:'Nude',            price:189.90, stock:8  },
      { id:'prod_013', name:'Macacão Cirúrgico Preto Unissex',  category:'macacao', size:'G', color:'Preto',           price:189.90, stock:6  },
      // ── 1 Scrub Tecnológico
      { id:'prod_014', name:'Scrub Tecnológico Premium',        category:'scrub_tech', size:'M', color:'Azul Marinho', price:199.90, stock:10 },
      // ── Jalecos Tradicionais
      { id:'prod_015', name:'Jaleco Tradicional Feminino Branco', category:'jaleco_fem', size:'P', color:'Branco',     price:159.90, stock:12 },
      { id:'prod_016', name:'Jaleco Tradicional Feminino Rosa',   category:'jaleco_fem', size:'M', color:'Rosa',       price:159.90, stock:9  },
      { id:'prod_017', name:'Jaleco Tradicional Masculino Branco',category:'jaleco_masc',size:'M', color:'Branco',     price:149.90, stock:10 },
      { id:'prod_018', name:'Jaleco Tradicional Masculino Azul',  category:'jaleco_masc',size:'G', color:'Azul',       price:149.90, stock:7  },
      // ── Jalecos Dentista
      { id:'prod_019', name:'Jaleco Dentista Feminino Branco',  category:'jaleco_dentista_fem', size:'M', color:'Branco', price:169.90, stock:8 },
      { id:'prod_020', name:'Jaleco Dentista Feminino Nude',    category:'jaleco_dentista_fem', size:'P', color:'Nude',   price:169.90, stock:6 },
      { id:'prod_021', name:'Jaleco Dentista Masculino Branco', category:'jaleco_dentista_masc',size:'M', color:'Branco', price:159.90, stock:9 },
      { id:'prod_022', name:'Jaleco Dentista Masculino Azul',   category:'jaleco_dentista_masc',size:'G', color:'Azul',   price:159.90, stock:5 },
      // ── Blusas Estampadas
      { id:'prod_023', name:'Blusa Estampada Flores Pastel',    category:'blusa', size:'M',   color:'Multicolor',      price:89.90,  stock:15 },
      { id:'prod_024', name:'Blusa Estampada Floral Rosa',      category:'blusa', size:'P',   color:'Rosa/Branco',     price:89.90,  stock:12 },
      { id:'prod_025', name:'Blusa Estampada Geométrica',       category:'blusa', size:'G',   color:'Nude/Terracota',  price:94.90,  stock:10 },
    ];
    saveProducts(products);
  }
}

// ── Exporta (namespace global) ─────────────────────
window.Storage = {
  getUsers, saveUsers, getUserByEmail, createUser, updateUser, deleteUser,
  getProducts, saveProducts, getProductById, createProduct, updateProduct, deleteProduct,
  decreaseStock, increaseStock,
  getSales, saveSales, getSalesByUser, getSalesByPeriod, createSale, deleteSale,
  getSession, saveSession, clearSession,
  seedIfEmpty,
};
