-- DropForeignKey
ALTER TABLE "public"."doctors" DROP CONSTRAINT "doctors_hospitalId_fkey";

-- AlterTable
ALTER TABLE "public"."doctors" ALTER COLUMN "hospitalId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."doctors" ADD CONSTRAINT "doctors_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "public"."hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
