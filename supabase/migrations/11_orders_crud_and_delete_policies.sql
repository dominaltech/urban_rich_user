-- ==============================================================================
-- 11_orders_crud_and_delete_policies.sql (Lock-Safe Version)
-- Enables Full CRUD Operations (SELECT, INSERT, UPDATE, DELETE) on Orders & Order Items
-- ==============================================================================

-- 1. Refresh RLS full access policies for orders, order items, and payments
DROP POLICY IF EXISTS "Public Full Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Full Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Public Full Payments" ON public.payments;

CREATE POLICY "Public Full Orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Order Items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

-- 2. Grant table permissions
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.order_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.payments TO anon, authenticated, service_role;
