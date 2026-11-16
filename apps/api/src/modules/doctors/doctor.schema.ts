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

export const doctorAvailabilityExceptionParamsSchema = z.object({
  doctorId: z.string().uuid(),
  date: validDateSchema,
});

const availabilityExceptionWindowSchema = z
  .object({
    startMinute: z.number().int().min(0).max(1439),
    endMinute: z.number().int().min(1).max(1440),
  })
  .refine((window) => window.startMinute < window.endMinute, {
    message: "Start time must be earlier than end time",
    path: ["endMinute"],
  });

const customHoursSchema = z
  .object({
    type: z.literal("CUSTOM_HOURS"),
    reason: z.string().trim().max(500).optional(),
    windows: z.array(availabilityExceptionWindowSchema).min(1),
  })
  .superRefine((data, ctx) => {
    for (let i = 0; i < data.windows.length; i++) {
      const first = data.windows[i];

      if (!first) continue;

      for (let j = i + 1; j < data.windows.length; j++) {
        const second = data.windows[j];

        if (!second) continue;

        const isOverlapping =
          first.startMinute < second.endMinute &&
          second.startMinute < first.endMinute;

        if (isOverlapping) {
          ctx.addIssue({
            code: "custom",
            message: "Availability windows must not overlap",
            path: ["windows", j, "startMinute"],
          });
        }
      }
    }
  });

const closedHoursSchema = z.object({
  type: z.literal("CLOSED"),
  reason: z.string().trim().max(500).optional(),
});

export const upsertAvailabilityExceptionSchema = z.discriminatedUnion("type", [
  closedHoursSchema,
  customHoursSchema,
]);

export type UpsertAvailabilityExceptionInput = z.infer<
  typeof upsertAvailabilityExceptionSchema
>;
