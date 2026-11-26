import argon2 from "argon2";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { AppError } from "../../common/errors/app-error.js";
import { createAuthRepository } from "./auth.repository.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

export function createAuthService(prisma: PrismaClient) {
  const authRepository = createAuthRepository(prisma);

  return {
    async register(input: RegisterInput) {
      const existingUser = await authRepository.findByEmail(input.email);

      if (existingUser) {
        throw new AppError(
          409,
          "EMAIL_ALREADY_EXISTS",
          "Email is already registered",
        );
      }

      const passwordHash = await argon2.hash(input.password, {
        type: argon2.argon2id,
      });

      const patient = await authRepository.create({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        passwordHash,
      });

      return patient;
    },

    async login(input: LoginInput) {
      const user = await authRepository.findByEmail(input.email);

      if (!user) {
        throw new AppError(
          401,
          "INVALID_CREDENTIALS",
          "Invalid email or password",
        );
      }

      const passwordMatches = await argon2.verify(
        user.passwordHash,
        input.password,
      );

      if (!passwordMatches) {
        throw new AppError(
          401,
          "INVALID_CREDENTIALS",
          "Invalid email or password",
        );
      }

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      };
    },
  };
}
