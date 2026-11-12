import { z } from "zod";

export const doctorParamsSchema = z.object({
  doctorId: z.string().uuid(),
});

export const createDoctorSchema = z.object({
  firstName: z.string().trim().min(2).max(100),

  lastName: z.string().trim().min(2).max(100),

  email: z.string().trim().email().max(255),

  password: z.string().min(12).max(128),

  specialty: z.string().trim().min(2).max(100),

  licenseNumber: z.string().trim().min(3).max(100),
});
