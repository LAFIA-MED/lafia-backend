/*
  Warnings:

  - You are about to drop the column `address` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `full_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `users` table. All the data in the column will be lost.
  - Added the required column `first_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isVerified` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "STATUS" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "address",
DROP COLUMN "full_name",
DROP COLUMN "title",
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL,
ADD COLUMN     "last_name" TEXT NOT NULL,
ADD COLUMN     "status" "STATUS" NOT NULL,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "date_of_birth" DROP NOT NULL;

-- DropEnum
DROP TYPE "TITLE";
