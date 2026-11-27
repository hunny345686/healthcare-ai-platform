import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      role: "PATIENT" | "DOCTOR" | "ADMIN";
    };

    user: {
      sub: string;
      role: "PATIENT" | "DOCTOR" | "ADMIN";
    };
  }
}
