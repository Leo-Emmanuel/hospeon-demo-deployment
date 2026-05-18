export const QK = {
  patients: {
    all:           () => ['patients'] as const,
    list:          (filters?: object) => ['patients', 'list', filters] as const,
    detail:        (id: string) => ['patients', id] as const,
    visits:        (id: string) => ['patients', id, 'visits'] as const,
    consultations: (id: string) => ['patients', id, 'consultations'] as const,
    labOrders:     (id: string) => ['patients', id, 'lab-orders'] as const,
    prescriptions: (id: string) => ['patients', id, 'prescriptions'] as const,
  },
  visits: {
    all:    () => ['visits'] as const,
    list:   (filters?: object) => ['visits', 'list', filters] as const,
    detail: (id: string) => ['visits', id] as const,
    today:  () => ['visits', 'today'] as const,
  },
  consultations: {
    all:    () => ['consultations'] as const,
    detail: (id: string) => ['consultations', id] as const,
  },
  labOrders: {
    all:    () => ['lab-orders'] as const,
    list:   (filters?: object) => ['lab-orders', 'list', filters] as const,
    detail: (id: string) => ['lab-orders', id] as const,
  },
  labResults: {
    all:    () => ['lab-results'] as const,
    detail: (orderId: string) => ['lab-results', orderId] as const,
  },
  dashboard: {
    summary:      (day?: string) => ['dashboard', 'summary', day] as const,
    opdQueue:     () => ['dashboard', 'opd-queue'] as const,
    labQueue:     () => ['dashboard', 'lab-queue'] as const,
    workload:     () => ['dashboard', 'doctor-workload'] as const,
    activity:     () => ['dashboard', 'recent-activity'] as const,
    pharmacyList: () => ['dashboard', 'pharmacy-worklist'] as const,
  },
  notifications: {
    unread: () => ['notifications', 'unread'] as const,
  },
  departments: {
    all: () => ['departments'] as const,
  },
  users: {
    doctors: () => ['users', 'doctors'] as const,
  },
  appointments: {
    all: () => ['appointments'] as const,
    list: (filters?: object) => ['appointments', 'list', filters] as const,
    detail: (id: string) => ['appointments', id] as const,
    slots: (doctorId?: string, date?: string) => ['appointments', 'slots', doctorId, date] as const,
  },
} as const;
