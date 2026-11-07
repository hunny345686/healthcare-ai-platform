import type { FastifyPluginAsync } from "fastify";

import { AppError } from "../../common/errors/app-error.js";
import { doctorParamsSchema } from "./doctor.schema.js";

const doctorRoutes: FastifyPluginAsync = async (app) => {
  // Hook scoped to this plugin and its child routes
  app.addHook("preHandler", async (request) => {
    request.log.info("Doctor API request received");
  });

  app.get("/:doctorId", async (request, reply) => {
    const result = doctorParamsSchema.safeParse(request.params);

    if (!result.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid doctor ID");
    }

    const { doctorId } = result.data;

    if (doctorId === "999") {
      throw new AppError(404, "DOCTOR_NOT_FOUND", "Doctor not found");
    }

    return reply.code(200).send({
      success: true,
      doctor: {
        id: doctorId,
        name: "Dr. Rahul Sharma",
        specialization: "Cardiology",
      },
    });
  });
};

export default doctorRoutes;
