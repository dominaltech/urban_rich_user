-- 06_admin_push_subscriptions.sql: Table for storing Admin PWA VAPID Web Push device subscriptions
CREATE TABLE IF NOT EXISTS public.admin_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_agent TEXT,
    endpoint TEXT NOT NULL UNIQUE,
    keys JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and safely drop/recreate policy
ALTER TABLE public.admin_push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'admin_push_subscriptions' 
        AND policyname = 'Public Full Push Subscriptions'
    ) THEN
        DROP POLICY "Public Full Push Subscriptions" ON public.admin_push_subscriptions;
    END IF;
END $$;

CREATE POLICY "Public Full Push Subscriptions" ON public.admin_push_subscriptions FOR ALL USING (true) WITH CHECK (true);
