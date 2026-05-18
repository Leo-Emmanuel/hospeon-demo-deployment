export const appointmentStatusTransitions: Record<string, string[]> = {
	PENDING: ['CONFIRMED', 'CANCELLED'],
	CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
	CHECKED_IN: ['IN_CONSULTATION', 'CANCELLED'],
	IN_CONSULTATION: ['COMPLETED', 'CANCELLED'],
	COMPLETED: [],
	CANCELLED: [],
	NO_SHOW: [],
};

export const activeAppointmentStatuses = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION'];
