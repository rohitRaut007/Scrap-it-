const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Metal',      rateLabel: '₹40–50/kg',  iconKey: 'metal' },
  { name: 'Paper',      rateLabel: '₹14–18/kg',  iconKey: 'paper' },
  { name: 'Plastic',    rateLabel: '₹8–12/kg',   iconKey: 'plastic' },
  { name: 'E-Waste',    rateLabel: '₹20–100/kg', iconKey: 'electronics' },
  { name: 'Appliances', rateLabel: '₹15–30/kg',  iconKey: 'appliances' },
  { name: 'Glass',      rateLabel: '₹2–5/kg',    iconKey: 'glass' },
];

async function main() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {
        rateLabel: category.rateLabel,
        iconKey: category.iconKey,
        active: true,
      },
      create: { ...category, active: true },
    });
  }
  const total = await prisma.category.count();
  console.log(`[seed] categories upserted; total active rows: ${total}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
