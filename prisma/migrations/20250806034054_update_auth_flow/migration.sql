/*
  Warnings:

  - Made the column `hospitalId` on table `doctors` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."doctors" DROP CONSTRAINT "doctors_hospitalId_fkey";

-- DropForeignKey
ALTER TABLE "public"."doctors" DROP CONSTRAINT "doctors_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."patients" DROP CONSTRAINT "patients_userId_fkey";

-- AlterTable
ALTER TABLE "public"."doctors" ALTER COLUMN "hospitalId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "gender" DROP NOT NULL,
ALTER COLUMN "first_name" DROP NOT NULL,
ALTER COLUMN "isVerified" SET DEFAULT false,
ALTER COLUMN "last_name" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING_VERIFICATION';

-- CreateTable
CREATE TABLE "public"."hospital_users" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospital_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hospital_users_userId_key" ON "public"."hospital_users"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "hospital_users_hospitalId_key" ON "public"."hospital_users"("hospitalId");

-- AddForeignKey
ALTER TABLE "public"."patients" ADD CONSTRAINT "patients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."doctors" ADD CONSTRAINT "doctors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."doctors" ADD CONSTRAINT "doctors_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "public"."hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hospital_users" ADD CONSTRAINT "hospital_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hospital_users" ADD CONSTRAINT "hospital_users_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "public"."hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
