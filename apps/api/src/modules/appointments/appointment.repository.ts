import type { PrismaClient } from "../../generated/prisma/client.js";

export function createAppointmentRepository(prisma: PrismaClient) {
  return {
    findDoctorScheduleData(doctorId: string, date: Date) {
      return prisma.doctorProfile.findUnique({
        where: { id: doctorId },
        select: {
          id: true,
          timezone: true,

          weeklyAvailability: {
            orderBy: {
              startMinute: "asc",
            },
          },

          availabilityExceptions: {
            where: { date },
            include: {
              windows: {
                orderBy: {
                  startMinute: "asc",
                },
              },
            },
          },
        },
      });
    },

    findBlockingAppointments(
      doctorId: string,
      dayStartUtc: Date,
      dayEndUtc: Date,
    ) {
      return prisma.appointment.findMany({
        where: {
          doctorId,
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
          startAt: {
            lt: dayEndUtc,
          },
          endAt: {
            gt: dayStartUtc,
          },
        },
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
        },
        orderBy: {
          startAt: "asc",
        },
      });
    },
    findDoctorById(doctorId: string) {
      return prisma.doctorProfile.findUnique({
        where: { id: doctorId },
        select: {
          id: true,
          timezone: true,
        },
      });
    },

    findPatientById(patientId: string) {
      return prisma.patientProfile.findUnique({
        where: { id: patientId },
        select: { id: true },
      });
    },

    create(data: {
      patientId: string;
      doctorId: string;
      startAt: Date;
      endAt: Date;
    }) {
      return prisma.appointment.create({
        data: {
          patientId: data.patientId,
          doctorId: data.doctorId,
          startAt: data.startAt,
          endAt: data.endAt,
        },
        select: {
          id: true,
          patientId: true,
          doctorId: true,
          startAt: true,
          endAt: true,
          status: true,
          createdAt: true,
        },
      });
    },

    cancelIfCancellable(appointmentId: string) {
      return prisma.appointment.updateMany({
        where: {
          id: appointmentId,
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
        },
        data: {
          status: "CANCELLED",
        },
      });
    },

    findAppointmentStatusById(appointmentId: string) {
      return prisma.appointment.findUnique({
        where: {
          id: appointmentId,
        },
        select: {
          id: true,
          status: true,
        },
      });
    },

    findPatientAppointments(
      patientId: string,
      options: {
        skip: number;
        take: number;
        status?: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
      },
    ) {
      return prisma.appointment.findMany({
        where: {
          patientId,
          ...(options.status && {
            status: options.status,
          }),
        },
        skip: options.skip,
        take: options.take,
        orderBy: {
          startAt: "desc",
        },
        select: {
          id: true,
          doctorId: true,
          patientId: true,
          startAt: true,
          endAt: true,
          status: true,
          createdAt: true,
          doctor: {
            select: {
              specialty: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });
    },

    countPatientAppointments(
      patientId: string,
      status?: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED",
    ) {
      return prisma.appointment.count({
        where: {
          patientId,
          ...(status && {
            status,
          }),
        },
      });
    },
  };
}
