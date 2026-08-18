-- 08_store_settings.sql: Store Settings Table for Global Delivery Charges and Store Configuration
-- Run this SQL in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)

CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    delivery_fee NUMERIC(10, 2) DEFAULT 60.00,
    free_shipping_above NUMERIC(10, 2) DEFAULT 999.00,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial default settings row if it doesn't exist
INSERT INTO public.store_settings (id, delivery_fee, free_shipping_above)
VALUES ('default', 60.00, 999.00)
ON CONFLICT (id) DO NOTHING;

-- Enable Row-Level Security and Allow Full Public Access
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'store_settings' 
        AND policyname = 'Public Full Store Settings'
    ) THEN
        DROP POLICY "Public Full Store Settings" ON public.store_settings;
    END IF;
END $$;

CREATE POLICY "Public Full Store Settings" ON public.store_settings FOR ALL TO public USING (true) WITH CHECK (true);
