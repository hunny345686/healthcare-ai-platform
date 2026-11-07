import { z } from "zod";

export const doctorParamsSchema = z.object({
  doctorId: z.string().regex(/^\d+$/, {
    message: "Doctor ID must contain only numbers",
  }),
});

export const doctorSearchQuerySchema = z.object({
  specialization: z.string().optional(),
  city: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
});
