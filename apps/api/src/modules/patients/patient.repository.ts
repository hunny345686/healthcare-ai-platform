import type { PrismaClient } from "../../generated/prisma/client.js";

type CreatePatientData = {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
};

export function createPatientRepository(prisma: PrismaClient) {
  return {
    async create(data: CreatePatientData) {
      return prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            passwordHash: data.passwordHash,
            role: "PATIENT",
          },
        });

        const patient = await tx.patientProfile.create({
          data: {
            userId: user.id,
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

        return patient;
      });
    },
  };
}
