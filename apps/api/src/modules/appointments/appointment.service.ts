import type { PrismaClient } from "../../generated/prisma/client.js";
import { Temporal } from "@js-temporal/polyfill";
import { AppError } from "../../common/errors/app-error.js";
import { createAppointmentRepository } from "./appointment.repository.js";
import type { CreateAppointmentInput } from "./appointment.schema.js";

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

// Detect PostgreSQL exclusion constraint violations.
function isAppointmentOverlapError(error: unknown): boolean {
  const pending: unknown[] = [error];
  const visited = new Set<object>();

  while (pending.length > 0) {
    const current = pending.pop();

    if (!current || typeof current !== "object") {
      continue;
    }

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    const record = current as Record<string, unknown>;

    if (
      record.code === "23P01" ||
      record.originalCode === "23P01" ||
      (typeof record.message === "string" &&
        record.message.includes("appointments_no_active_overlap"))
    ) {
      return true;
    }

    pending.push(record.cause, record.meta);
  }

  return false;
}

export function createAppointmentService(prisma: PrismaClient) {
  const repository = createAppointmentRepository(prisma);

  const service = {
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

    async createAppointment(input: CreateAppointmentInput) {
      // 1. Verify doctor existence and retrieve timezone.
      const doctor = await repository.findDoctorById(input.doctorId);

      if (!doctor) {
        throw new AppError(404, "DOCTOR_NOT_FOUND", "Doctor not found");
      }

      // 2. Verify patient existence.
      const patient = await repository.findPatientById(input.patientId);

      if (!patient) {
        throw new AppError(404, "PATIENT_NOT_FOUND", "Patient not found");
      }

      // 3. Parse and validate requested appointment time.
      const startAt = new Date(input.startAt);

      if (startAt.getTime() <= Date.now()) {
        throw new AppError(
          400,
          "INVALID_APPOINTMENT_TIME",
          "Appointment must be scheduled in the future",
        );
      }

      // 4. Derive the doctor's local calendar date.
      const localDate = Temporal.Instant.from(startAt.toISOString())
        .toZonedDateTimeISO(doctor.timezone)
        .toPlainDate()
        .toString();

      // 5. Revalidate that the requested time is available.
      const availability = await service.getAvailableSlots(
        input.doctorId,
        localDate,
      );

      const requestedSlot = availability.slots.find(
        (slot) => new Date(slot.startAt).getTime() === startAt.getTime(),
      );

      if (!requestedSlot) {
        throw new AppError(
          409,
          "SLOT_UNAVAILABLE",
          "The requested appointment slot is no longer available",
        );
      }

      // 6. Calculate appointment end time on the server.
      const endAt = new Date(
        startAt.getTime() + APPOINTMENT_DURATION_MINUTES * 60 * 1000,
      );

      // 7. Persist the appointment.
      try {
        return await repository.create({
          patientId: input.patientId,
          doctorId: input.doctorId,
          startAt,
          endAt,
        });
      } catch (error) {
        if (isAppointmentOverlapError(error)) {
          throw new AppError(
            409,
            "APPOINTMENT_CONFLICT",
            "This appointment slot has already been booked",
          );
        }

        throw error;
      }
    },
  };

  return service;
}
