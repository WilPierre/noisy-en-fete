-- =============================================
-- NOISY EN FÊTE — Script SQL Supabase
-- Coller dans : Supabase > SQL Editor > New query
-- =============================================

-- Table menu
CREATE TABLE IF NOT EXISTS menu (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(6,2) NOT NULL,
  emoji TEXT DEFAULT '🍽',
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table commandes
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  table_num INTEGER NOT NULL,
  items JSONB NOT NULL,
  total NUMERIC(8,2) NOT NULL,
  status TEXT DEFAULT 'en attente',
  paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer le temps réel sur les commandes
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE menu REPLICA IDENTITY FULL;

-- Accès public en lecture/écriture (pour l'appli)
ALTER TABLE menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read menu" ON menu FOR SELECT USING (true);
CREATE POLICY "Admin write menu" ON menu FOR ALL USING (true);
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public update orders" ON orders FOR UPDATE USING (true);

-- Menu de démo (personnalisable depuis l'admin)
INSERT INTO menu (name, category, price, emoji) VALUES
  ('Soupe à l''oignon', 'Entrées', 7.50, '🧅'),
  ('Assiette de charcuterie', 'Entrées', 9.00, '🥩'),
  ('Salade verte', 'Entrées', 6.50, '🥗'),
  ('Entrecôte frites', 'Plats', 22.00, '🥩'),
  ('Poulet rôti', 'Plats', 16.50, '🍗'),
  ('Risotto champignons', 'Plats', 15.00, '🍚'),
  ('Crème brûlée', 'Desserts', 7.00, '🍮'),
  ('Fondant chocolat', 'Desserts', 8.00, '🍫'),
  ('Tarte tatin', 'Desserts', 7.50, '🥧'),
  ('Eau minérale', 'Boissons', 3.00, '💧'),
  ('Vin rouge (verre)', 'Boissons', 5.50, '🍷'),
  ('Bière pression', 'Boissons', 4.50, '🍺');
