-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "typeOfCare" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "appointmentType" TEXT NOT NULL,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "additionalNote" TEXT NOT NULL,
    "patientID" TEXT NOT NULL,
    "doctorID" TEXT NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientID_fkey" FOREIGN KEY ("patientID") REFERENCES "patients"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorID_fkey" FOREIGN KEY ("doctorID") REFERENCES "doctors"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
