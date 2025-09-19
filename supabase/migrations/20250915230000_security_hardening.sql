-- Security hardening: hash passwords, column grants, RPCs, and public view

-- 1) Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Add password_hash and backfill, then drop plain password
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS password_hash TEXT;
UPDATE reservations
SET password_hash = crypt(reserver_password, gen_salt('bf'::text))
WHERE reserver_password IS NOT NULL AND (password_hash IS NULL OR pas

