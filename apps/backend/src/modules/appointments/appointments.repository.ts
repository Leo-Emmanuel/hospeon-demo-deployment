import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export class AppointmentsRepository {
	findMany(where: Prisma.AppointmentWhereInput, skip?: number, take?: number) {
		return prisma.appointment.findMany({
			where,
			skip,
			take,
			orderBy: [{ startAt: 'asc' }],
			include: {
				patient: true,
				doctor: { select: { id: true, name: true } },
				department: true,
				visit: true,
			},
		});
	}

	count(where: Prisma.AppointmentWhereInput) {
		return prisma.appointment.count({ where });
	}
}

export const appointmentsRepository = new AppointmentsRepository();
