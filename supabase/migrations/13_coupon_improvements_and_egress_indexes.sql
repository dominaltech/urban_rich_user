-- ==============================================================================
-- 13_coupon_improvements_and_egress_indexes.sql
-- Optimizes coupon tracking, auto-apply flags, and adds high-performance indexes
-- to minimize database CPU, egress, and query response times.
-- ==============================================================================

-- 1. Ensure coupon_code column exists on orders table
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50) DEFAULT NULL;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0.00;

-- 2. Add auto_apply column on coupons table
ALTER TABLE IF EXISTS public.coupons ADD COLUMN IF NOT EXISTS auto_apply BOOLEAN DEFAULT true;

-- 3. Ensure flexible discount_type check constraint (case-insensitive)
ALTER TABLE IF EXISTS public.coupons DROP CONSTRAINT IF EXISTS coupons_discount_type_check;
ALTER TABLE IF EXISTS public.coupons ADD CONSTRAINT coupons_discount_type_check 
  CHECK (discount_type ILIKE 'percent%' OR discount_type ILIKE 'fix%' OR discount_type ILIKE 'flat%');

-- 4. High-Performance Indexing to Minimize Database Scan & Egress Bytes
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON public.products(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_status_created_at ON public.products(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_coupons_active_code ON public.coupons(is_active, code);

