import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function seedDatabase() {
    const seed = {};
}

async function main() {
    await seedDatabase();
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
