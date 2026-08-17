-- 00_wipe_and_reset.sql: Wipes public schema views, tables, sequences, and types
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

    FOR r IN (SELECT table_name FROM information_schema.views WHERE table_schema = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.table_name) || ' CASCADE;';
    END LOOP;

    FOR r IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.table_name) || ' CASCADE;';
    END LOOP;

    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE;';
    END LOOP;

    FOR r IN (SELECT typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e') LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE;';
    END LOOP;
END $$;
