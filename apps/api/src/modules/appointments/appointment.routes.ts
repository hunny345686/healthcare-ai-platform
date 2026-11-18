import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../common/errors/app-error.js";
import { createAppointmentService } from "./appointment.service.js";
import { getAvailableSlotsSchema } from "./appointment.schema.js";

const appointmentRoutes: FastifyPluginAsync = async (app) => {
  const appointmentService = createAppointmentService(app.prisma);

  app.get("/availability", async (request, reply) => {
    const queryResult = getAvailableSlotsSchema.safeParse(request.query);

    if (!queryResult.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Invalid availability query parameters",
      );
    }

    const { doctorId, date } = queryResult.data;

    const availability = await appointmentService.getAvailableSlots(
      doctorId,
      date,
    );

    return reply.code(200).send({
      success: true,
      message: "Available appointment slots retrieved successfully",
      data: availability,
    });
  });
};

export default appointmentRoutes;
