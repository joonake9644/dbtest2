-- supabase/migrations/[날짜]_create_users_table.sql
CREATE TABLE users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);