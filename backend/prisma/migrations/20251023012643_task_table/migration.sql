-- This migration was created to fix the missing migration file issue
-- TaskStatus enum already exists from 20251023000841_add_task_posting_models
-- This migration is intentionally a no-op to avoid duplicate enum creation
-- The enum was already created in the previous migration

-- No-op: TaskStatus enum already exists from add_task_posting_models migration
-- Using SELECT 1 to satisfy Prisma's requirement for valid SQL
SELECT 1;
