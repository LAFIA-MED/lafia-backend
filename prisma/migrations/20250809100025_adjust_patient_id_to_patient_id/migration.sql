/*
  Warnings:

  - You are about to drop the column `doctorID` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `patientID` on the `appointments` table. All the data in the column will be lost.
  - Added the required column `doctorId` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientId` to the `appointments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_doctorID_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_patientID_fkey";

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "doctorID",
DROP COLUMN "patientID",
ADD COLUMN     "doctorId" TEXT NOT NULL,
ADD COLUMN     "patientId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
