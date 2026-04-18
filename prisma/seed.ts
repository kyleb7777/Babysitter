import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedSitter = {
  name: string;
  phone: string;
  availability: string;
  rate: string | null;
  priority: number;
};

const sitters: SeedSitter[] = [
  {
    name: "Kendall",
    phone: "+16827741550",
    availability: "Available: W, TH, F, S, Sun. Nursing student; schedule can be up and down with school breaks/exams.",
    rate: "$25",
    priority: 7,
  },
  {
    name: "Mackenzie",
    phone: "+19729510311",
    availability: "",
    rate: null,
    priority: 5,
  },
  {
    name: "Natalie",
    phone: "+17136791577",
    availability: "",
    rate: null,
    priority: 5,
  },
  {
    name: "Rocio",
    phone: "+12148748531",
    availability: "",
    rate: null,
    priority: 5,
  },
  {
    name: "Ava",
    phone: "+12146291411",
    availability: "Available: after school, S, Sun. Friend's step-daughter; high school student; lives close by.",
    rate: null,
    priority: 6,
  },
  {
    name: "Sara",
    phone: "+19727404578",
    availability: "Rarely available but lives close by.",
    rate: "$25",
    priority: 3,
  },
  {
    name: "Angela",
    phone: "+19728346219",
    availability: "Available: weekdays after 5:30, S, Sun. Teaches Sunday school. Not the most active — probably won't clean up, but kids love her.",
    rate: "$25",
    priority: 6,
  },
  {
    name: "Bayli",
    phone: "+14692747926",
    availability: "Haven't tried yet. ECEC 3s teacher.",
    rate: null,
    priority: 4,
  },
  {
    name: "Erica",
    phone: "+12149232722",
    availability: "Haven't tried yet. ECEC teacher.",
    rate: null,
    priority: 4,
  },
  {
    name: "Maria",
    phone: "+12147911143",
    availability: "Haven't tried yet. Sloane's 2s teacher.",
    rate: null,
    priority: 4,
  },
  {
    name: "Jasmine",
    phone: "+17204869433",
    availability: "Haven't tried yet.",
    rate: null,
    priority: 4,
  },
];

async function main() {
  let created = 0;
  let existing = 0;
  for (const s of sitters) {
    const result = await prisma.sitter.upsert({
      where: { phone: s.phone },
      update: {}, // never overwrite edits made through the UI
      create: s,
    });
    if (result.createdAt.getTime() >= Date.now() - 5_000) created++;
    else existing++;
  }
  console.log(`Seed complete: ${created} created, ${existing} already existed.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
