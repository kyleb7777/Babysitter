import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sitters = [
  {
    name: "Jamie Rivera",
    phone: "+15551110001",
    availability: "Fri/Sat evenings, Sun afternoons",
    priority: 10,
  },
  {
    name: "Alex Chen",
    phone: "+15551110002",
    availability: "Weeknights after 6pm",
    priority: 20,
  },
  {
    name: "Priya Patel",
    phone: "+15551110003",
    availability: "Weekends only",
    priority: 30,
  },
  {
    name: "Sam O'Neill",
    phone: "+15551110004",
    availability: "Flexible, some school nights",
    priority: 40,
  },
  {
    name: "Morgan Lee",
    phone: "+15551110005",
    availability: "Saturdays only",
    priority: 50,
  },
];

async function main() {
  for (const s of sitters) {
    await prisma.sitter.upsert({
      where: { phone: s.phone },
      update: s,
      create: s,
    });
  }
  console.log(`Seeded ${sitters.length} sitters.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
