-- ==============================================================================
-- 12_dynamic_event_banners_and_coupons.sql
-- Enables Fully Dynamic Event Banners & Coupons (Manageable from Admin Panel)
-- ==============================================================================

-- 1. Drop existing check constraint if present to allow flexible casing ('PERCENTAGE', 'FLAT', 'percentage', 'fixed')
ALTER TABLE IF EXISTS public.coupons DROP CONSTRAINT IF EXISTS coupons_discount_type_check;

-- 2. Create or ensure all dynamic columns exist
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'Special Event Offer',
  discount_type VARCHAR(50) NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(10, 2) NOT NULL DEFAULT 5.00,
  min_order_value NUMERIC(10, 2) DEFAULT 0.00,
  max_discount NUMERIC(10, 2) DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  show_home_banner BOOLEAN DEFAULT true,
  show_product_banner BOOLEAN DEFAULT true,
  banner_tag VARCHAR(100) DEFAULT '✨ SPECIAL EVENT OFFER',
  banner_message VARCHAR(255) DEFAULT 'SPECIAL DISCOUNT ON ALL ORDERS',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT 'Special Event Offer';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_type VARCHAR(50) DEFAULT 'percentage';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10, 2) DEFAULT 5.00;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS min_order_value NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_discount NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS show_home_banner BOOLEAN DEFAULT true;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS show_product_banner BOOLEAN DEFAULT true;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS banner_tag VARCHAR(100) DEFAULT '✨ SPECIAL EVENT OFFER';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS banner_message VARCHAR(255) DEFAULT 'SPECIAL DISCOUNT ON ALL ORDERS';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Add flexible case-insensitive check constraint
ALTER TABLE public.coupons ADD CONSTRAINT coupons_discount_type_check 
  CHECK (discount_type ILIKE 'percent%' OR discount_type ILIKE 'fix%' OR discount_type ILIKE 'flat%');

-- 4. Enable RLS & Full Access Policies
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Coupons" ON public.coupons;
CREATE POLICY "Public Full Coupons" ON public.coupons FOR ALL USING (true) WITH CHECK (true);

-- 5. Grant Permissions
GRANT ALL ON TABLE public.coupons TO anon, authenticated, service_role;

-- 6. Seed Default Dynamic Coupon
INSERT INTO public.coupons (
  code, 
  title, 
  discount_type, 
  discount_value, 
  min_order_value, 
  is_active, 
  show_home_banner, 
  show_product_banner, 
  banner_tag, 
  banner_message
)
VALUES (
  'URBAN5', 
  'Special Event Offer', 
  'percentage', 
  5.00, 
  0.00, 
  true, 
  true, 
  true, 
  '✨ SPECIAL EVENT OFFER', 
  'FLAT 5% OFF ON ALL ORDERS'
)
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  show_home_banner = EXCLUDED.show_home_banner,
  show_product_banner = EXCLUDED.show_product_banner,
  banner_tag = EXCLUDED.banner_tag,
  banner_message = EXCLUDED.banner_message;
