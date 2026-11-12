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

    async create(data: {
      firstName: string;
      lastName: string;
      email: string;
      passwordHash: string;
      specialty: string;
      licenseNumber: string;
    }) {
      return prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            passwordHash: data.passwordHash,
            role: "DOCTOR",
          },
        });

        const doctor = await tx.doctorProfile.create({
          data: {
            userId: user.id,
            specialty: data.specialty,
            licenseNumber: data.licenseNumber,
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        });

        return doctor;
      });
    },
  };
}
