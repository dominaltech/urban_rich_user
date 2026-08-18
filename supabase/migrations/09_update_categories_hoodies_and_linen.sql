-- 09_add_hoodies_and_update_linen_pants.sql
-- Run this SQL in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)

-- 1. Ensure Women category is preserved with its own slug 'women'
INSERT INTO public.categories (id, name, slug, description, image_url, display_order)
VALUES ('c1000000-0000-0000-0000-000000000006', 'Women', 'women', 'Womens Urban Rich Collection', 'images/logo.jpg', 6)
ON CONFLICT (id) DO UPDATE 
SET name = 'Women',
    slug = 'women',
    description = 'Womens Urban Rich Collection';

-- 2. Add 'Hoodies' as a brand new distinct category
INSERT INTO public.categories (id, name, slug, description, image_url, display_order)
VALUES (
    'c1000000-0000-0000-0000-000000000007',
    'Hoodies',
    'hoodies',
    'Luxury heavyweight bio-washed fleece and French terry hoodies',
    'images/hero2.jpg',
    7
)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description;

-- 3. Update 'Pants' category description & title to Linen Pants & Trousers
UPDATE public.categories
SET name = 'Linen Pants',
    slug = 'pants',
    description = 'Breathable premium linen trousers and tailored relaxed fits'
WHERE slug = 'pants' OR id = 'c1000000-0000-0000-0000-000000000003';

INSERT INTO public.categories (id, name, slug, description, image_url, display_order)
VALUES (
    'c1000000-0000-0000-0000-000000000003',
    'Linen Pants',
    'pants',
    'Breathable premium linen trousers and tailored relaxed fits',
    'images/prod4.jpg',
    3
)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description;
