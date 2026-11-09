import Fastify from "fastify";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { AppError } from "./common/errors/app-error.js";
import doctorRoutes from "./modules/doctors/doctor.routes.js";

import databasePlugin from "./infrastructure/database/prisma.plugin.js";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const projectRoot = resolve(currentDirectory, "../../..");

dotenv.config({
  path: resolve(projectRoot, ".env"),
});

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(databasePlugin);

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    return reply.status(500).send({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    });
  });

  app.get("/health", async () => ({
    status: "ok",
    service: "healthcare-api",
    timestamp: new Date().toISOString(),
  }));

  app.get("/health/database", async (request, reply) => {
    await request.server.prisma.$queryRaw`SELECT 1`;

    return reply.code(200).send({
      success: true,
      database: "connected",
    });
  });

  app.register(doctorRoutes, {
    prefix: "/api/v1/doctors",
  });

  return app;
}
