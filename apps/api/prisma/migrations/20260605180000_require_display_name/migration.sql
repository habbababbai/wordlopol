-- Backfill existing users before enforcing NOT NULL
UPDATE "User"
SET "displayName" = split_part(email, '@', 1)
WHERE "displayName" IS NULL;

ALTER TABLE "User" ALTER COLUMN "displayName" SET NOT NULL;
