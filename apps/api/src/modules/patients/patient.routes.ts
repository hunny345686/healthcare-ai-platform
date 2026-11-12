import type { FastifyPluginAsync } from "fastify";

import { AppError } from "../../common/errors/app-error.js";
import { createPatientSchema } from "./patient.schema.js";
import { createPatientService } from "./patient.service.js";

const patientRoutes: FastifyPluginAsync = async (app) => {
  const patientService = createPatientService(app.prisma);

  app.post("/", async (request, reply) => {
    const result = createPatientSchema.safeParse(request.body);

    if (!result.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Invalid patient registration details",
      );
    }

    const patient = await patientService.register(result.data);

    return reply.code(201).send({
      success: true,
      message: "Patient registered successfully",
      data: patient,
    });
  });
};

export default patientRoutes;
