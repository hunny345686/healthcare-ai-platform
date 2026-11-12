import * as argon2 from "argon2";
import type { PrismaClient } from "../../generated/prisma/client.js";

import { AppError } from "../../common/errors/app-error.js";
import { isPrismaUniqueConstraintError } from "../../common/utils/prisma-errors.js";
import { createPatientRepository } from "./patient.repository.js";

export function createPatientService(prisma: PrismaClient) {
  const repository = createPatientRepository(prisma);

  return {
    async register(data: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    }) {
      const passwordHash = await argon2.hash(data.password);

      try {
        return await repository.create({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          passwordHash,
        });
      } catch (error) {
        if (isPrismaUniqueConstraintError(error)) {
          throw new AppError(
            409,
            "EMAIL_ALREADY_REGISTERED",
            "An account with this email already exists",
          );
        }

        throw error;
      }
    },
  };
}
