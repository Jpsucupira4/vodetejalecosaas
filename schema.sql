-- ══════════════════════════════════════════════════════════════════
-- VODETE JALECOS — Schema Completo
-- Execute em: https://app.supabase.com → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'vendedora' CHECK (role IN ('admin', 'vendedora')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS (precificação dupla: varejo + atacado)
CREATE TABLE IF NOT EXISTS products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  category         TEXT NOT NULL,
  size             TEXT NOT NULL DEFAULT 'M',
  color            TEXT NOT NULL DEFAULT '—',
  price_retail     NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_wholesale  NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock            INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'Geral',
  amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- SALES
CREATE TABLE IF NOT EXISTS sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID REFERENCES products(id),
  product_name    TEXT NOT NULL,
  qty             INTEGER NOT NULL DEFAULT 1,
  unit_price      NUMERIC(10,2) NOT NULL,
  total           NUMERIC(10,2) NOT NULL,
  payment         TEXT NOT NULL DEFAULT 'pix',
  sale_type       TEXT NOT NULL DEFAULT 'varejo' CHECK (sale_type IN ('varejo', 'atacado')),
  shipping_method TEXT NOT NULL DEFAULT 'none'
                  CHECK (shipping_method IN ('none', 'excursao', 'motoboy', 'correios')),
  shipping_cost   NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  seller_id       UUID REFERENCES profiles(id),
  seller_name     TEXT NOT NULL,
  customer_id     UUID REFERENCES customers(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE products  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales     ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Usuários leem próprio perfil" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin lê todos os perfis" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin gerencia perfis" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- PRODUCTS
CREATE POLICY "Autenticados leem produtos" ON products
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin gerencia produtos" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- SALES
CREATE POLICY "Vendedora vê próprias vendas" ON sales
  FOR SELECT USING (seller_id = auth.uid());
CREATE POLICY "Admin vê todas as vendas" ON sales
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Autenticados registram vendas" ON sales
  FOR INSERT WITH CHECK (seller_id = auth.uid());
CREATE POLICY "Admin exclui vendas" ON sales
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- CUSTOMERS
CREATE POLICY "Autenticados leem clientes" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Autenticados inserem clientes" ON customers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin gerencia clientes" ON customers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- EXPENSES
CREATE POLICY "Admin gerencia despesas" ON expenses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ══════════════════════════════════════════════════════════════════
-- CRIAR PRIMEIRO ADMIN
-- Após criar o usuário em Authentication → Users, rode:
-- ══════════════════════════════════════════════════════════════════
-- INSERT INTO profiles (id, name, email, role)
-- VALUES ('COLE_O_UUID_AQUI', 'Administradora', 'admin@vodete.com', 'admin');
