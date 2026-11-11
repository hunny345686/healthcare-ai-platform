import type { PrismaClient } from "../../generated/prisma/client.js";

export function createDoctorRepository(prisma: PrismaClient) {
  return {
    findById(id: string) {
      return prisma.doctorProfile.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });
    },

    findMany() {
      return prisma.doctorProfile.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    },
  };
}
