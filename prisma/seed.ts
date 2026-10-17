import { prisma } from "../src/app/lib/prisma";
import { logger } from "../src/app/utils/logger";

async function main() {
  logger.info("🌱 Seeding database...");
  // Seed initial data if needed
  logger.info("✅ Seeding completed.");
}

main()
  .catch((e) => {
    logger.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
