import type { FastifyPluginAsync } from "fastify";

import { AppError } from "../../common/errors/app-error.js";
import { doctorParamsSchema } from "./doctor.schema.js";
import { createDoctorService } from "./doctor.service.js";

const doctorRoutes: FastifyPluginAsync = async (app) => {
  const doctorService = createDoctorService(app.prisma);

  app.get("/", async () => {
    const doctors = await doctorService.getAllDoctors();

    return {
      success: true,
      data: doctors,
    };
  });

  app.get("/:doctorId", async (request) => {
    const result = doctorParamsSchema.safeParse(request.params);

    if (!result.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid doctor ID");
    }

    const doctor = await doctorService.getDoctorById(result.data.doctorId);

    return {
      success: true,
      data: doctor,
    };
  });
};

export default doctorRoutes;
