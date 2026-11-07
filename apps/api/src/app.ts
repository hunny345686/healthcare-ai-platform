import Fastify from "fastify";

import { AppError } from "./common/errors/app-error.js";
import doctorRoutes from "./modules/doctors/doctor.routes.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

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

  app.register(doctorRoutes, {
    prefix: "/api/v1/doctors",
  });

  return app;
}
