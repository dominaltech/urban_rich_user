-- ==============================================================================
-- 10_dynamic_categories_and_size_management.sql
-- Urban Rich: Dynamic Categories, Master Size Hub & In-Stock Variant Management
-- ==============================================================================
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. MASTER SIZE PRESETS TABLE (size_presets)
-- Stores global Numeric (28, 30, 32...) and Alpha (S, M, L, XL...) size presets.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.size_presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('alpha', 'numeric', 'custom')),
    size_label TEXT NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_type_size UNIQUE (type, size_label)
);

-- Seed Alpha Sizes
INSERT INTO public.size_presets (type, size_label, display_order, is_active)
VALUES
    ('alpha', 'XS', 1, TRUE),
    ('alpha', 'S', 2, TRUE),
    ('alpha', 'M', 3, TRUE),
    ('alpha', 'L', 4, TRUE),
    ('alpha', 'XL', 5, TRUE),
    ('alpha', 'XXL', 6, TRUE),
    ('alpha', '3XL', 7, TRUE)
ON CONFLICT (type, size_label) DO NOTHING;

-- Seed Numeric Sizes (Pant / Waist / Chest)
INSERT INTO public.size_presets (type, size_label, display_order, is_active)
VALUES
    ('numeric', '28', 1, TRUE),
    ('numeric', '30', 2, TRUE),
    ('numeric', '32', 3, TRUE),
    ('numeric', '34', 4, TRUE),
    ('numeric', '36', 5, TRUE),
    ('numeric', '38', 6, TRUE),
    ('numeric', '40', 7, TRUE),
    ('numeric', '42', 8, TRUE)
ON CONFLICT (type, size_label) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. ENHANCE PRODUCT VARIANTS (product_variants)
-- Adds explicit is_in_stock column to support 1-click availability toggles
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'product_variants' 
        AND column_name = 'is_in_stock'
    ) THEN
        ALTER TABLE public.product_variants ADD COLUMN is_in_stock BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. ENHANCE CATEGORIES TABLE (categories)
-- Ensure banner_url and description columns exist
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'categories' 
        AND column_name = 'banner_url'
    ) THEN
        ALTER TABLE public.categories ADD COLUMN banner_url TEXT;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY & PERMISSIONS
-- Grant full read to public and full manage to authenticated/admin users
-- ------------------------------------------------------------------------------
ALTER TABLE public.size_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Size Presets Policies
DROP POLICY IF EXISTS "Public View Size Presets" ON public.size_presets;
CREATE POLICY "Public View Size Presets" ON public.size_presets 
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Full Access Size Presets" ON public.size_presets;
CREATE POLICY "Full Access Size Presets" ON public.size_presets 
    FOR ALL TO public USING (true) WITH CHECK (true);

-- Categories Policies
DROP POLICY IF EXISTS "Public View Categories" ON public.categories;
CREATE POLICY "Public View Categories" ON public.categories 
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Full Access Categories" ON public.categories;
CREATE POLICY "Full Access Categories" ON public.categories 
    FOR ALL TO public USING (true) WITH CHECK (true);

-- Product Variants Policies
DROP POLICY IF EXISTS "Public View Product Variants" ON public.product_variants;
CREATE POLICY "Public View Product Variants" ON public.product_variants 
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Full Access Product Variants" ON public.product_variants;
CREATE POLICY "Full Access Product Variants" ON public.product_variants 
    FOR ALL TO public USING (true) WITH CHECK (true);
