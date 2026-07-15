import { PrismaClient } from "@prisma/client";
import { comics } from "../src/content/comics";
import { dataTasks } from "../src/content/dataTasks";
import { robotTasks } from "../src/content/robotTasks";

const db = new PrismaClient();

async function main() {
  await db.exercise.deleteMany();
  const rows = [
    ...comics.map((c) => ({
      type: "comic",
      level: c.level,
      contentJson: JSON.stringify(c.content),
    })),
    ...dataTasks.map((c) => ({
      type: "data",
      level: c.level,
      contentJson: JSON.stringify(c.content),
    })),
    ...robotTasks.map((c) => ({
      type: "robot",
      level: c.level,
      contentJson: JSON.stringify(c.content),
    })),
  ];
  await db.exercise.createMany({ data: rows });
  await db.config.upsert({
    where: { key: "trialDays" },
    update: {},
    create: { key: "trialDays", value: "3" },
  });
  console.log(`Seeded ${rows.length} exercises`);
}

main().finally(() => db.$disconnect());
