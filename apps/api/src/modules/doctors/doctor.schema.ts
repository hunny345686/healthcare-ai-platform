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

const weeklyAvailabilityItemSchema = z
  .object({
    dayOfWeek: z.enum([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ]),
    startMinute: z.number().int().min(0).max(1439),
    endMinute: z.number().int().min(1).max(1440),
  })
  .refine((schedule) => schedule.startMinute < schedule.endMinute, {
    message: "End time must be later than start time",
    path: ["endMinute"],
  });

export const replaceWeeklyAvailabilitySchema = z
  .object({
    schedules: z.array(weeklyAvailabilityItemSchema),
  })
  .superRefine((data, ctx) => {
    const schedules = data.schedules;

    for (let i = 0; i < schedules.length; i++) {
      const first = schedules[i];

      if (!first) {
        continue;
      }

      for (let j = i + 1; j < schedules.length; j++) {
        const second = schedules[j];

        if (!second) {
          continue;
        }

        const isSameDay = first.dayOfWeek === second.dayOfWeek;

        const isOverlapping =
          first.startMinute < second.endMinute &&
          second.startMinute < first.endMinute;

        if (isSameDay && isOverlapping) {
          ctx.addIssue({
            code: "custom",
            message: `Overlapping working hours on ${second.dayOfWeek}`,
            path: ["schedules", j, "startMinute"],
          });
        }
      }
    }
  });

export type ReplaceWeeklyAvailabilityInput = z.infer<
  typeof replaceWeeklyAvailabilitySchema
>;
