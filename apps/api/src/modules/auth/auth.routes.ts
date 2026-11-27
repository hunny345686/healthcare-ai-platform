import type { FastifyPluginAsync } from "fastify";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { createAuthService } from "./auth.service.js";
import { authenticate, authorizeRoles } from "./auth.middleware.js";
const authRoutes: FastifyPluginAsync = async (app) => {
  const authService = createAuthService(app.prisma);

  app.post("/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }

    const patient = await authService.register(parsed.data);

    return reply.status(201).send({
      success: true,
      message: "Registration successful",
      data: patient,
    });
  });

  app.post("/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }

    const user = await authService.login(parsed.data);

    // Generate JWT access token
    const accessToken = await reply.jwtSign(
      {
        role: user.role,
      },
      {
        sign: {
          sub: user.id,
          expiresIn: "15m",
        },
      },
    );

    return reply.status(200).send({
      success: true,
      message: "Login successful",
      data: {
        user,
        accessToken,
      },
    });
  });

  app.get(
    "/me",
    {
      preHandler: authenticate,
    },
    async (request, reply) => {
      return reply.status(200).send({
        success: true,
        data: {
          user: request.user,
        },
      });
    },
  );

  app.get(
    "/admin-check",
    {
      preHandler: [authenticate, authorizeRoles("ADMIN")],
    },
    async (request, reply) => {
      return reply.status(200).send({
        success: true,
        message: "Admin access granted",
        data: {
          user: request.user,
        },
      });
    },
  );
};

export default authRoutes;
