export interface AppointmentSlot {
	startAt: string;
	endAt: string;
	status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
	bookedCount: number;
	capacity: number;
}
