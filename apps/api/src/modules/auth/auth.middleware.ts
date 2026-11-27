import type { FastifyReply, FastifyRequest } from "fastify";

const allowedRoles = ["PATIENT", "DOCTOR", "ADMIN"] as const;

type UserRole = (typeof allowedRoles)[number];

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
  }
}

export function authorizeRoles(...roles: ("PATIENT" | "DOCTOR" | "ADMIN")[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const userRole = request.user.role;

    if (!roles.includes(userRole)) {
      return reply.status(403).send({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to access this resource",
        },
      });
    }
  };
}

export async function authorizeSelfOrAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { userId?: string };
  const requestedUserId = params.userId;
  const authenticatedUserId = request.user.sub;
  const role = request.user.role;

  if (role === "ADMIN") {
    return;
  }

  if (!requestedUserId || requestedUserId !== authenticatedUserId) {
    return reply.status(403).send({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "You cannot access another user's resource",
      },
    });
  }
}
