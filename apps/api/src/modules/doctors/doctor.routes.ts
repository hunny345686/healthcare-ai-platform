import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../common/errors/app-error.js";
import { createDoctorService } from "./doctor.service.js";
import {
  doctorParamsSchema,
  createDoctorSchema,
  replaceWeeklyAvailabilitySchema,
} from "./doctor.schema.js";

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

  app.post("/", async (request, reply) => {
    const result = createDoctorSchema.safeParse(request.body);

    if (!result.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Invalid doctor registration details",
      );
    }

    const doctor = await doctorService.createDoctor(result.data);

    return reply.code(201).send({
      success: true,
      message: "Doctor created successfully",
      data: doctor,
    });
  });

  app.put("/:doctorId/availbility/weekly", async (request, reply) => {
    // 1. Validate doctor ID.
    const paramsResult = doctorParamsSchema.safeParse(request.params);

    if (!paramsResult.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid doctor ID");
    }

    // 2. Validate weekly schedule.
    const bodyResult = replaceWeeklyAvailabilitySchema.safeParse(request.body);

    if (!bodyResult.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Invalid weekly availability schedule",
      );
    }

    // 3. Execute business logic.
    const schedule = await doctorService.replaceWeeklyAvailability(
      paramsResult.data.doctorId,
      bodyResult.data,
    );

    // 4. Return response.
    return reply.code(200).send({
      success: true,
      message: "Weekly availability updated successfully",
      data: schedule,
    });
  });
};

export default doctorRoutes;
