-- AlterTable
-- Existing rows are backfilled with the migration's own run time as their
-- consentAt, since consent wasn't tracked before this column existed; new
-- rows always set it explicitly at registration (see src/app/api/register/route.ts).
ALTER TABLE "Parent" ADD COLUMN "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Parent" ALTER COLUMN "consentAt" DROP DEFAULT;
