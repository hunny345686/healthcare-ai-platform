import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";

const databasePlugin: FastifyPluginAsync = async (app) => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const adapter = new PrismaPg({
    connectionString,
  });

  const prisma = new PrismaClient({
    adapter,
  });

  await prisma.$connect();

  app.decorate("prisma", prisma);

  app.addHook("onClose", async (instance) => {
    await instance.prisma.$disconnect();
  });

  app.log.info("PostgreSQL connected successfully");
};

export default fp(databasePlugin, {
  name: "database-plugin",
});
