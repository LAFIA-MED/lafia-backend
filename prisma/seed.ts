// import { PrismaClient } from "@prisma/client";
// import path from "path";
// import xlsx from "xlsx";


// const prisma = new PrismaClient();

// // Define the Hospital interface
// interface Hospital {
//   "Hospital Name": string;
//   Address: string;
//   "License Number": string;
// }

// async function seedDatabase() {
//   const filePath = path.resolve(__dirname, '../utils/data.xlsx');

//   const workbook = xlsx.readFile(filePath);
//   const sheetName = workbook.SheetNames[0];
//   const sheet = workbook.Sheets[sheetName];

//   const hospitalData: Hospital[] = xlsx.utils.sheet_to_json(sheet);

//   for (const hospital of hospitalData) {
//     const email = `${hospital["Hospital Name"]
//       .replace(/\s+/g, "")
//       .toLowerCase()}@lafia.com`;
//     const phone = generatePhoneNumber();

//     try {
//       await prisma.hospital.create({
//         data: {
//           name: hospital["Hospital Name"],
//           address: hospital.Address,
//           license: hospital["License Number"],
//           phone,
//           email,
//         },
//       });
//     } catch (error) {
//       console.error(
//         `Error creating hospital record for ${hospital["Hospital Name"]}:`,
//         error
//       );
//     }
//   }
// }

// const generatePhoneNumber = () => {
//   const areaCode = Math.floor(100 + Math.random() * 900);
//   const numberPart1 = Math.floor(1000000 + Math.random() * 9000000);
//   return `${areaCode}-${numberPart1}`;
// };

// async function main() {
//   await seedDatabase();
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
