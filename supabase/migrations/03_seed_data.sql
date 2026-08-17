-- 03_seed_data.sql: Default categories, hero banners, products, variants, and test items

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

INSERT INTO public.banners (title, subtitle, image_url, link_url, badge_text, display_order)
VALUES
  ('URBAN RICH STREETWEAR', 'EST. 2026 — PREMIUM OVERSIZED & BAGGY COLLECTION', 'images/logo.jpg', 'oversize.html', 'NEW ARRIVALS 2026', 1),
  ('OVERSIZED HEAVYWEIGHTS', '240 GSM COMBED COTTON · LUXURY STREET FIT', 'images/logo.jpg', 'oversize.html', 'POPULAR FIT', 2),
  ('BAGGY CARGO & DENIM', 'RELAXED DROP FIT TROUSERS FOR URBAN STYLE', 'images/logo.jpg', 'pants.html', 'LIMITED EDITION', 3)
ON CONFLICT DO NOTHING;

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
  ),
  (
    'a1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'Urban Heavyweight Acid Wash Oversized Tee',
    'acid-wash-oversized-tee',
    'Heavy 240 GSM acid wash oversized streetwear tee with signature drop shoulders.',
    799.00,
    1499.00,
    'images/logo.jpg',
    true,
    true,
    'published'
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000002',
    'Retro Vintage Baggy Denim Cargo Pants',
    'retro-baggy-denim-cargo',
    'Deep indigo relaxed baggy denim with multi utility cargo pockets.',
    1299.00,
    2499.00,
    'images/logo.jpg',
    true,
    true,
    'published'
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000003',
    'Tactical Black Wide Leg Cargo Trousers',
    'tactical-black-wide-leg-cargo',
    'Ultra durable stretch cotton utility trousers with custom ankle drawstrings.',
    1199.00,
    2199.00,
    'images/logo.jpg',
    true,
    false,
    'published'
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    'c1000000-0000-0000-0000-000000000004',
    'Essential Jet Black Plain Boxy Tee',
    'essential-jet-black-plain-tee',
    'Clean unbranded matte black boxy fit t-shirt engineered for daily wear.',
    599.00,
    1199.00,
    'images/logo.jpg',
    false,
    true,
    'published'
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, color, stock_quantity)
VALUES
  ('a1000000-0000-0000-0000-000000000000', 'FREE', 'Black', 9999),
  ('a1000000-0000-0000-0000-000000000001', 'S', 'Acid Grey', 20),
  ('a1000000-0000-0000-0000-000000000001', 'M', 'Acid Grey', 25),
  ('a1000000-0000-0000-0000-000000000001', 'L', 'Acid Grey', 15),
  ('a1000000-0000-0000-0000-000000000001', 'XL', 'Acid Grey', 10),
  ('a1000000-0000-0000-0000-000000000002', '30', 'Vintage Blue', 12),
  ('a1000000-0000-0000-0000-000000000002', '32', 'Vintage Blue', 18),
  ('a1000000-0000-0000-0000-000000000002', '34', 'Vintage Blue', 14),
  ('a1000000-0000-0000-0000-000000000003', '30', 'Matte Black', 15),
  ('a1000000-0000-0000-0000-000000000003', '32', 'Matte Black', 20),
  ('a1000000-0000-0000-0000-000000000004', 'M', 'Jet Black', 30),
  ('a1000000-0000-0000-0000-000000000004', 'L', 'Jet Black', 25)
ON CONFLICT DO NOTHING;

INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount)
VALUES ('URBAN10', 'percentage', 10.00, 499.00)
ON CONFLICT (code) DO NOTHING;
