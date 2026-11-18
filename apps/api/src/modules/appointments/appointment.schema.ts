import { z } from "zod";

const validDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format")
  .refine((date) => {
    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    return (
      !Number.isNaN(parsedDate.getTime()) &&
      parsedDate.toISOString().slice(0, 10) === date
    );
  }, "Invalid calendar date");

export const getAvailableSlotsSchema = z.object({
  doctorId: z.string().uuid(),
  date: validDateSchema,
});

export type GetAvailableSlotsInput = z.infer<typeof getAvailableSlotsSchema>;
