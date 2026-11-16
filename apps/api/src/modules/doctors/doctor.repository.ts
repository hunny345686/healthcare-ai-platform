import type { PrismaClient, Weekday } from "../../generated/prisma/client.js";
import type { UpsertAvailabilityExceptionInput } from "./doctor.schema.js";

export function createDoctorRepository(prisma: PrismaClient) {
  return {
    findById(id: string) {
      return prisma.doctorProfile.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });
    },

    findMany() {
      return prisma.doctorProfile.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    },

    async replaceWeeklyAvailability(
      doctorId: string,
      schedules: Array<{
        dayOfWeek: Weekday;
        startMinute: number;
        endMinute: number;
      }>,
    ) {
      return prisma.$transaction(async (tx) => {
        // 1. Check whether the doctor exists.
        const doctor = await tx.doctorProfile.findUnique({
          where: { id: doctorId },
          select: { id: true },
        });

        if (!doctor) {
          return null;
        }

        // 2. Remove the doctor's existing weekly schedule.
        await tx.doctorWeeklyAvailability.deleteMany({
          where: { doctorId },
        });

        // 3. Insert the replacement schedule.
        if (schedules.length > 0) {
          await tx.doctorWeeklyAvailability.createMany({
            data: schedules.map((schedule) => ({
              doctorId,
              dayOfWeek: schedule.dayOfWeek,
              startMinute: schedule.startMinute,
              endMinute: schedule.endMinute,
            })),
          });
        }

        // 4. Return the saved schedule.
        return tx.doctorWeeklyAvailability.findMany({
          where: { doctorId },
          orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
        });
      });
    },

    async upsertAvailabilityException(
      doctorId: string,
      date: Date,
      data: UpsertAvailabilityExceptionInput,
    ) {
      return prisma.$transaction(async (tx) => {
        // 1. Check whether the doctor exists.
        const doctor = await tx.doctorProfile.findUnique({
          where: { id: doctorId },
          select: { id: true },
        });

        if (!doctor) {
          return null;
        }

        // 2. Create or update the exception for this doctor and date.
        const exception = await tx.doctorAvailabilityException.upsert({
          where: {
            doctorId_date: {
              doctorId,
              date,
            },
          },
          create: {
            doctorId,
            date,
            type: data.type,
            reason: data.reason ?? null,
          },
          update: {
            type: data.type,
            reason: data.reason ?? null,
          },
        });

        // 3. Remove previously configured windows.
        await tx.doctorAvailabilityExceptionWindow.deleteMany({
          where: {
            exceptionId: exception.id,
          },
        });

        // 4. Insert new windows only for CUSTOM_HOURS.
        if (data.type === "CUSTOM_HOURS") {
          await tx.doctorAvailabilityExceptionWindow.createMany({
            data: data.windows.map((window) => ({
              exceptionId: exception.id,
              startMinute: window.startMinute,
              endMinute: window.endMinute,
            })),
          });
        }

        // 5. Return the saved exception with its windows.
        return tx.doctorAvailabilityException.findUnique({
          where: {
            id: exception.id,
          },
          include: {
            windows: {
              orderBy: {
                startMinute: "asc",
              },
            },
          },
        });
      });
    },

    async create(data: {
      firstName: string;
      lastName: string;
      email: string;
      passwordHash: string;
      specialty: string;
      licenseNumber: string;
    }) {
      return prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            passwordHash: data.passwordHash,
            role: "DOCTOR",
          },
        });

        const doctor = await tx.doctorProfile.create({
          data: {
            userId: user.id,
            specialty: data.specialty,
            licenseNumber: data.licenseNumber,
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        });

        return doctor;
      });
    },
  };
}
