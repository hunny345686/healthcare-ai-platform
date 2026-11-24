import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../common/errors/app-error.js";
import { createAppointmentService } from "./appointment.service.js";
import {
  createAppointmentSchema,
  getAvailableSlotsSchema,
  appointmentIdParamSchema,
} from "./appointment.schema.js";

const appointmentRoutes: FastifyPluginAsync = async (app) => {
  const appointmentService = createAppointmentService(app.prisma);

  // GET /availability
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

  // POST /
  app.post("/", async (request, reply) => {
    const bodyResult = createAppointmentSchema.safeParse(request.body);

    if (!bodyResult.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Invalid appointment booking request",
      );
    }

    const appointment = await appointmentService.createAppointment(
      bodyResult.data,
    );

    return reply.code(201).send({
      success: true,
      message: "Appointment booked successfully",
      data: appointment,
    });
  });

  // POST /:appointmentId/cancel
  app.post("/:appointmentId/cancel", async (request, reply) => {
    const paramsResult = appointmentIdParamSchema.safeParse(request.params);

    if (!paramsResult.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid appointment ID");
    }

    const { appointmentId } = paramsResult.data;

    const cancellation =
      await appointmentService.cancelAppointment(appointmentId);

    return reply.code(200).send({
      success: true,
      message: "Appointment cancelled successfully",
      data: cancellation,
    });
  });
};

export default appointmentRoutes;
