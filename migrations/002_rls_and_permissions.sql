-- 002_rls_and_permissions.sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; these policies are defense-in-depth for anon/authenticated.
-- Allow authenticated users to read all inventory tables.
CREATE POLICY "auth read profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read medicines" ON medicines FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read batches" ON batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read movements" ON stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read alert_settings" ON alert_settings FOR SELECT TO authenticated USING (true);

-- Writes restricted: only service role (backend) performs writes; anon/authenticated cannot.
-- (No INSERT/UPDATE/DELETE policies for authenticated => denied by default.)
