-- 07_storage_and_gallery_setup.sql: Complete Supabase Storage Bucket & Product Gallery Setup
-- Run this SQL in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)

-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE STORAGE BUCKETS (product-images & banner-images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('product-images', 'product-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('banner-images', 'banner-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- 3. POLICIES ON STORAGE.OBJECTS (Do NOT run ALTER TABLE on storage.objects as it is owned by Supabase system)
DROP POLICY IF EXISTS "Public Read Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Full Storage Access" ON storage.objects;

CREATE POLICY "Public Read Product Images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('product-images', 'banner-images'));

CREATE POLICY "Public Insert Product Images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id IN ('product-images', 'banner-images'));

CREATE POLICY "Public Update Product Images"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id IN ('product-images', 'banner-images'))
WITH CHECK (bucket_id IN ('product-images', 'banner-images'));

CREATE POLICY "Public Delete Product Images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id IN ('product-images', 'banner-images'));

-- 4. ENSURE PRODUCT_IMAGES TABLE EXISTS AND HAS PROPER SCHEMA & RLS
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for high-performance gallery lookups by product_id
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_display_order ON public.product_images(product_id, display_order);

-- Enable RLS and create public policy on product_images
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Product Images" ON public.product_images;
CREATE POLICY "Public Full Product Images" ON public.product_images FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. RE-VERIFY PRODUCTS & VARIANTS RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Products" ON public.products;
CREATE POLICY "Public Full Products" ON public.products FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Product Variants" ON public.product_variants;
CREATE POLICY "Public Full Product Variants" ON public.product_variants FOR ALL TO public USING (true) WITH CHECK (true);
