import type { PrismaClient } from "../../generated/prisma/client.js";
import { Temporal } from "@js-temporal/polyfill";
import { AppError } from "../../common/errors/app-error.js";
import { createAppointmentRepository } from "./appointment.repository.js";

const APPOINTMENT_DURATION_MINUTES = 30;
const SLOT_INTERVAL_MINUTES = 30;

const WEEKDAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

// Convert a doctor's local working minute into a UTC instant.
function localMinuteToInstant(
  date: Temporal.PlainDate,
  minute: number,
  timezone: string,
): Date {
  const targetDate = minute === 1440 ? date.add({ days: 1 }) : date;

  const targetMinute = minute === 1440 ? 0 : minute;

  const plainDateTime = targetDate.toPlainDateTime({
    hour: Math.floor(targetMinute / 60),
    minute: targetMinute % 60,
  });

  return new Date(
    Number(plainDateTime.toZonedDateTime(timezone).epochMilliseconds),
  );
}

export function createAppointmentService(prisma: PrismaClient) {
  const repository = createAppointmentRepository(prisma);

  return {
    async getAvailableSlots(doctorId: string, date: string) {
      // 1. Parse the requested calendar date.
      const localDate = Temporal.PlainDate.from(date);

      // PostgreSQL DATE representation.
      const databaseDate = new Date(`${date}T00:00:00.000Z`);

      // 2. Fetch doctor schedule and exception.
      const doctor = await repository.findDoctorScheduleData(
        doctorId,
        databaseDate,
      );

      if (!doctor) {
        throw new AppError(404, "DOCTOR_NOT_FOUND", "Doctor not found");
      }

      // 3. Calculate UTC boundaries for the doctor's local day.
      const dayStartUtc = new Date(
        Number(
          localDate.toZonedDateTime(doctor.timezone).startOfDay()
            .epochMilliseconds,
        ),
      );

      const nextDate = localDate.add({ days: 1 });

      const dayEndUtc = new Date(
        Number(
          nextDate.toZonedDateTime(doctor.timezone).startOfDay()
            .epochMilliseconds,
        ),
      );

      // 4. Determine applicable working hours.
      const exception = doctor.availabilityExceptions[0];

      let workingWindows: Array<{
        startMinute: number;
        endMinute: number;
      }> = [];

      if (exception?.type === "CLOSED") {
        return {
          doctorId,
          date,
          timezone: doctor.timezone,
          durationMinutes: APPOINTMENT_DURATION_MINUTES,
          slots: [],
        };
      }

      if (exception?.type === "CUSTOM_HOURS") {
        workingWindows = exception.windows;
      } else {
        const weekday = WEEKDAYS[localDate.dayOfWeek - 1];

        if (!weekday) {
          throw new Error("Unable to determine weekday");
        }

        workingWindows = doctor.weeklyAvailability
          .filter((schedule) => schedule.dayOfWeek === weekday)
          .map((schedule) => ({
            startMinute: schedule.startMinute,
            endMinute: schedule.endMinute,
          }));
      }

      // 5. Fetch existing appointments for this local calendar day.
      const appointments = await repository.findBlockingAppointments(
        doctorId,
        dayStartUtc,
        dayEndUtc,
      );

      // 6. Generate candidate slots and remove overlapping bookings.
      const slots: Array<{
        startAt: string;
        endAt: string;
      }> = [];

      for (const window of workingWindows) {
        for (
          let startMinute = window.startMinute;
          startMinute + APPOINTMENT_DURATION_MINUTES <= window.endMinute;
          startMinute += SLOT_INTERVAL_MINUTES
        ) {
          const endMinute = startMinute + APPOINTMENT_DURATION_MINUTES;

          const startAt = localMinuteToInstant(
            localDate,
            startMinute,
            doctor.timezone,
          );

          const endAt = localMinuteToInstant(
            localDate,
            endMinute,
            doctor.timezone,
          );

          // Half-open interval overlap detection.
          const isBooked = appointments.some(
            (appointment) =>
              appointment.startAt < endAt && appointment.endAt > startAt,
          );

          if (!isBooked) {
            slots.push({
              startAt: startAt.toISOString(),
              endAt: endAt.toISOString(),
            });
          }
        }
      }

      return {
        doctorId,
        date,
        timezone: doctor.timezone,
        durationMinutes: APPOINTMENT_DURATION_MINUTES,
        slots,
      };
    },
  };
}
