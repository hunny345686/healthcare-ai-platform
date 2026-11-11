import type { PrismaClient } from "../../generated/prisma/client.js";
import { AppError } from "../../common/errors/app-error.js";
import { createDoctorRepository } from "./doctor.repository.js";

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
  };
}
