import type { PrismaClient } from "../../generated/prisma/client.js";
import { AppError } from "../../common/errors/app-error.js";
import { createDoctorRepository } from "./doctor.repository.js";

import * as argon2 from "argon2";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export function createDoctorService(prisma: PrismaClient) {
  const repository = createDoctorRepository(prisma);

  return {
    async getDoctorById(id: string) {
      const doctor = await repository.findById(id);

      if (!doctor) {
        throw new AppError(404, "DOCTOR_NOT_FOUND", "Doctor not found");
      }

      return doctor;
    },

    async getAllDoctors() {
      return repository.findMany();
    },

    async createDoctor(data: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      specialty: string;
      licenseNumber: string;
    }) {
      const passwordHash = await argon2.hash(data.password);

      try {
        return await repository.create({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          passwordHash,
          specialty: data.specialty,
          licenseNumber: data.licenseNumber,
        });
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new AppError(
            409,
            "DOCTOR_ALREADY_EXISTS",
            "Email or license number is already registered",
          );
        }

        throw error;
      }
    },
  };
}
