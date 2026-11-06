import Fastify from "fastify";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.get("/health", async () => {
    return {
      status: "ok",
      service: "healthcare-api",
      timestamp: new Date().toISOString(),
    };
  });

  app.get("/api/v1/doctors/:doctorId", async (request, reply) => {
    const { doctorId } = request.params as {
      doctorId: string;
    };

    return reply.code(200).send({
      message: "Doctor details fetched successfully",
      doctor: {
        id: doctorId,
        name: "Dr. Rahul Sharma",
        specialization: "Cardiology",
      },
    });
  });

  return app;
}
