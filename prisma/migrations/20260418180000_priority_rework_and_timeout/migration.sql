-- Priority now uses a 1-10 scale where higher = asked first (was 100 default,
-- lower = asked first). Reset any out-of-range existing values to the new
-- default and update the column default.
UPDATE "Sitter" SET "priority" = 5 WHERE "priority" > 10 OR "priority" < 1;
ALTER TABLE "Sitter" ALTER COLUMN "priority" SET DEFAULT 5;

-- Per-request reply timeout (replaces the global REPLY_TIMEOUT_MINUTES env var).
ALTER TABLE "SitterRequest" ADD COLUMN "timeoutMinutes" INTEGER NOT NULL DEFAULT 30;
