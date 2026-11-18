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
  };
}
