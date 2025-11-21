-- This migration was created to fix the missing migration file issue
-- UserRole enum already exists from 20251022193433_initial_auth_setup
-- This migration is intentionally a no-op to avoid duplicate enum creation
-- The enum was already created in the previous migration

-- No-op: UserRole enum already exists from initial_auth_setup migration
-- Using SELECT 1 to satisfy Prisma's requirement for valid SQL
SELECT 1;
