-- 05_complete_all_in_one_setup.sql: Complete All-in-One SQL setup script for Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    pincode TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    default_address JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    details JSONB DEFAULT '[]'::jsonb,
    price NUMERIC(10, 2) NOT NULL,
    mrp NUMERIC(10, 2) NOT NULL,
    main_image TEXT NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_new_arrival BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    color TEXT DEFAULT 'Default',
    sku TEXT UNIQUE,
    stock_quantity INT NOT NULL DEFAULT 10,
    price_override NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    link_url TEXT DEFAULT '#',
    badge_text TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_amount NUMERIC(10, 2) DEFAULT 0,
    max_discount_amount NUMERIC(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    shipping_fee NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    order_status TEXT DEFAULT 'PLACED' CHECK (order_status IN ('PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    cashfree_order_id TEXT UNIQUE,
    tracking_number TEXT,
    courier_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    variant_size TEXT,
    variant_color TEXT,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    cashfree_order_id TEXT NOT NULL,
    cashfree_payment_id TEXT,
    payment_mode TEXT,
    payment_status TEXT NOT NULL,
    payment_amount NUMERIC(10, 2) NOT NULL,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_agent TEXT,
    endpoint TEXT NOT NULL UNIQUE,
    keys JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Full Categories" ON public.categories;
DROP POLICY IF EXISTS "Public Full Products" ON public.products;
DROP POLICY IF EXISTS "Public Full Product Variants" ON public.product_variants;
DROP POLICY IF EXISTS "Public Full Product Images" ON public.product_images;
DROP POLICY IF EXISTS "Public Full Banners" ON public.banners;
DROP POLICY IF EXISTS "Public Full Coupons" ON public.coupons;
DROP POLICY IF EXISTS "Public Full Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Full Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Public Full Payments" ON public.payments;
DROP POLICY IF EXISTS "Public Full Push Subscriptions" ON public.admin_push_subscriptions;

CREATE POLICY "Public Full Categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Product Variants" ON public.product_variants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Product Images" ON public.product_images FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Banners" ON public.banners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Coupons" ON public.coupons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Order Items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Push Subscriptions" ON public.admin_push_subscriptions FOR ALL USING (true) WITH CHECK (true);

-- 3. DEFAULT SEED DATA
INSERT INTO public.categories (id, name, slug, description, image_url, display_order)
VALUES 
  ('c1000000-0000-0000-0000-000000000001', 'Oversized', 'oversized', 'Heavyweight Premium Oversized Tees', 'images/hero1.jpg', 1),
  ('c1000000-0000-0000-0000-000000000002', 'Baggy', 'baggy', 'Relaxed Baggy Denim & Cargo Pants', 'images/hero2.jpg', 2),
  ('c1000000-0000-0000-0000-000000000003', 'Pants', 'pants', 'Streetwear Utility Trousers & Pants', 'images/hero3.jpg', 3),
  ('c1000000-0000-0000-0000-000000000004', 'Plain T-Shirts', 'plain-tshirts', 'Minimalist Essential Cotton Tees', 'images/logo.jpg', 4),
  ('c1000000-0000-0000-0000-000000000005', 'Printed T-Shirts', 'printed-tshirts', 'Graphic Printed Streetwear', 'images/logo.jpg', 5),
  ('c1000000-0000-0000-0000-000000000006', 'Women', 'women', 'Womens Urban Rich Collection', 'images/logo.jpg', 6),
  ('c1000000-0000-0000-0000-000000000007', 'Test Items', 'test-items', 'Testing & Verification Products', 'images/logo.jpg', 99)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, category_id, name, slug, description, price, mrp, main_image, is_featured, is_new_arrival, status)
VALUES
  (
    'a1000000-0000-0000-0000-000000000000',
    'c1000000-0000-0000-0000-000000000007',
    'Urban Rich ₹1 Test Product',
    'urban-rich-1-rupee-test-product',
    'Live Cashfree production test item priced at ₹1 for payment verification.',
    1.00,
    99.00,
    'images/logo.jpg',
    true,
    true,
    'published'
  )
ON CONFLICT (slug) DO NOTHING;
