import React from 'react';
import { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Role } from '@hospeon/shared';

import { Dashboard as DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { AIAdminCopilot } from '@/features/dashboard/pages/AIAdminCopilot';
import { AIClinical } from '@/features/dashboard/pages/AIAssistant';
import { AIContentReview } from '@/features/dashboard/pages/AIContentReview';
import { DoctorDashboard } from '@/features/dashboard/pages/DoctorDashboard';
import { LabDashboard } from '@/features/dashboard/pages/LabDashboard';
import { OperationsDashboard } from '@/features/dashboard/pages/OperationsDashboard';
import { PharmacyDashboard } from '@/features/dashboard/pages/PharmacyDashboard';
import { ReceptionDashboard } from '@/features/dashboard/pages/ReceptionDashboard';
import { StubPage } from '@/features/dashboard/pages/Stub';
import { BedBoard, IPD } from '@/features/admissions/pages/IPDPage';
import { DischargeSummary } from '@/features/admissions/pages/DischargeSummary';
import { MAR } from '@/features/admissions/pages/MAR';
import { NewAdmission } from '@/features/admissions/pages/NewAdmission';
import { NursingStation } from '@/features/admissions/pages/NursingStation';
import { AppointmentCalendar } from '@/features/appointments/pages/AppointmentCalendar';
import { NewAppointment } from '@/features/appointments/pages/NewAppointment';
import { AuditLog } from '@/features/audit/pages/AuditLog';
import { Invoices } from '@/features/billing/pages/BillingPage';
import { CreateInvoice } from '@/features/billing/pages/CreateInvoice';
import { Payments } from '@/features/billing/pages/Payments';
import { Refunds } from '@/features/billing/pages/Refunds';
import { Consultation } from '@/features/consultations/pages/Consultation';
import { FollowUps } from '@/features/consultations/pages/FollowUps';
import { Prescriptions } from '@/features/consultations/pages/Prescriptions';
import { Templates } from '@/features/consultations/pages/Templates';
import { LabOrders, LabReportReview } from '@/features/laboratory/pages/LabPage';
import { LabCatalog } from '@/features/laboratory/pages/LabCatalog';
import { LabReportPrint } from '@/features/laboratory/pages/LabReportPrint';
import { Radiology } from '@/features/laboratory/pages/Radiology';
import { ResultEntry } from '@/features/laboratory/pages/ResultEntry';
import { SampleCollection } from '@/features/laboratory/pages/SampleCollection';
import { AIPatientSummary } from '@/features/patients/pages/AIPatientSummary';
import { PatientNew } from '@/features/patients/pages/PatientNew';
import { Patients as PatientsPage } from '@/features/patients/pages/PatientsPage';
import { PatientProfile } from '@/features/patients/pages/PatientProfile';
import { ExpiryAlerts } from '@/features/pharmacy/pages/ExpiryAlerts';
import { Medicines } from '@/features/pharmacy/pages/PharmacyPage';
import { PharmacySale } from '@/features/pharmacy/pages/PharmacySale';
import { PurchaseOrders } from '@/features/pharmacy/pages/PurchaseOrders';
import { StockEntry } from '@/features/pharmacy/pages/StockEntry';
import { Queue } from '@/features/queue/pages/Queue';
import { QueueDisplay } from '@/features/queue/pages/QueueDisplay';
import { AIReportExplainer } from '@/features/reports/pages/AIReportExplainer';
import { AppointmentReport } from '@/features/reports/pages/AppointmentReport';
import { DayClosing } from '@/features/reports/pages/DayClosing';
import { DoctorPerformanceReport } from '@/features/reports/pages/DoctorPerformanceReport';
import { PharmacyReport } from '@/features/reports/pages/PharmacyReport';
import { RevenueReport } from '@/features/reports/pages/Reports';
import { BranchesSettings } from '@/features/settings/pages/BranchesSettings';
import { DepartmentsSettings } from '@/features/settings/pages/DepartmentsSettings';
import { Integrations } from '@/features/settings/pages/Integrations';
import { OrganizationSettings } from '@/features/settings/pages/OrganizationSettings';
import { RolesPermissions, Staff } from '@/features/settings/pages/Settings';
import { Security } from '@/features/settings/pages/Security';

const clinicalRoles = [Role.DOCTOR, Role.NURSE, Role.ADMIN];
const frontDeskRoles = [Role.ADMIN, Role.RECEPTIONIST];
const diagnosticRoles = [Role.ADMIN, Role.DOCTOR, Role.LAB_TECHNICIAN];
const pharmacyRoles = [Role.ADMIN, Role.PHARMACIST];
const billingRoles = [Role.ADMIN, Role.ACCOUNTANT, Role.RECEPTIONIST];
const adminRoles = [Role.ADMIN];

export const protectedRoutes: RouteObject[] = [
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '',
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'dashboard/doctor', element: <DoctorDashboard /> },
          { path: 'dashboard/reception', element: <ReceptionDashboard /> },
          { path: 'dashboard/pharmacy', element: <PharmacyDashboard /> },
          { path: 'dashboard/lab', element: <LabDashboard /> },
          { path: 'dashboard/accounting', element: <OperationsDashboard /> },
          { path: 'dashboard/staff', element: <OperationsDashboard /> },
          { path: 'queue', element: <Queue /> },
          { path: 'opd-queue', element: <Queue /> },
          { path: 'queue/display', element: <QueueDisplay /> },
          { path: 'calendar', element: <AppointmentCalendar /> },
          { 
            path: 'patients', 
            element: <ProtectedRoute allowedRoles={[Role.DOCTOR, Role.NURSE, Role.ADMIN, Role.RECEPTIONIST]} />, 
            children: [
              { path: '', element: <PatientsPage /> },
              { path: 'register', element: <PatientNew /> },
              { path: 'new', element: <PatientNew /> },
              { path: ':id/timeline', element: <PatientProfile /> },
              { path: ':id', element: <PatientProfile /> }
            ]
          },
          { path: 'appointments', element: <AppointmentCalendar /> },
          { path: 'appointments/new', element: <NewAppointment /> },
          { path: 'visits/today', element: <Queue /> },
          { path: 'visits/:id/consult', element: <ProtectedRoute allowedRoles={clinicalRoles} />, children: [{ index: true, element: <Consultation /> }] },
          { path: 'consultations', element: <ProtectedRoute allowedRoles={clinicalRoles} />, children: [{ index: true, element: <Consultation /> }] },
          { path: 'prescriptions', element: <ProtectedRoute allowedRoles={clinicalRoles} />, children: [{ index: true, element: <Prescriptions /> }] },
          { path: 'followups', element: <ProtectedRoute allowedRoles={clinicalRoles} />, children: [{ index: true, element: <FollowUps /> }] },
          { path: 'ipd', element: <ProtectedRoute allowedRoles={[...clinicalRoles, Role.RECEPTIONIST]} />, children: [{ index: true, element: <IPD /> }] },
          { path: 'ipd/new', element: <ProtectedRoute allowedRoles={frontDeskRoles} />, children: [{ index: true, element: <NewAdmission /> }] },
          { path: 'beds', element: <ProtectedRoute allowedRoles={[...clinicalRoles, Role.RECEPTIONIST]} />, children: [{ index: true, element: <BedBoard /> }] },
          { path: 'nursing', element: <ProtectedRoute allowedRoles={[Role.ADMIN, Role.NURSE, Role.DOCTOR]} />, children: [{ index: true, element: <NursingStation /> }] },
          { path: 'mar', element: <ProtectedRoute allowedRoles={[Role.ADMIN, Role.NURSE, Role.DOCTOR]} />, children: [{ index: true, element: <MAR /> }] },
          { path: 'discharge', element: <ProtectedRoute allowedRoles={clinicalRoles} />, children: [{ index: true, element: <DischargeSummary /> }] },
          { path: 'lab/queue', element: <ProtectedRoute allowedRoles={diagnosticRoles} />, children: [{ index: true, element: <LabOrders /> }] },
          { path: 'lab/orders', element: <ProtectedRoute allowedRoles={diagnosticRoles} />, children: [{ index: true, element: <LabOrders /> }] },
          { path: 'lab/catalog', element: <ProtectedRoute allowedRoles={[Role.ADMIN]} />, children: [{ index: true, element: <LabCatalog /> }] },
          { path: 'lab/orders/:id/results', element: <ProtectedRoute allowedRoles={[Role.ADMIN, Role.LAB_TECHNICIAN]} />, children: [{ index: true, element: <ResultEntry /> }] },
          { path: 'lab/reports', element: <ProtectedRoute allowedRoles={diagnosticRoles} />, children: [{ index: true, element: <LabReportReview /> }] },
          { path: 'lab/reports/:id/print', element: <LabReportPrint /> },
          { path: 'lab/collection', element: <ProtectedRoute allowedRoles={[Role.ADMIN, Role.LAB_TECHNICIAN]} />, children: [{ index: true, element: <SampleCollection /> }] },
          { path: 'lab/result-entry', element: <ProtectedRoute allowedRoles={[Role.ADMIN, Role.LAB_TECHNICIAN]} />, children: [{ index: true, element: <ResultEntry /> }] },
          { path: 'radiology', element: <ProtectedRoute allowedRoles={diagnosticRoles} />, children: [{ index: true, element: <Radiology /> }] },
          { path: 'pharmacy/sales', element: <ProtectedRoute allowedRoles={pharmacyRoles} />, children: [{ index: true, element: <PharmacySale /> }] },
          { path: 'pharmacy/medicines', element: <ProtectedRoute allowedRoles={pharmacyRoles} />, children: [{ index: true, element: <Medicines /> }] },
          { path: 'pharmacy/stock', element: <ProtectedRoute allowedRoles={pharmacyRoles} />, children: [{ index: true, element: <StockEntry /> }] },
          { path: 'pharmacy/purchase', element: <ProtectedRoute allowedRoles={pharmacyRoles} />, children: [{ index: true, element: <PurchaseOrders /> }] },
          { path: 'pharmacy/expiry', element: <ProtectedRoute allowedRoles={pharmacyRoles} />, children: [{ index: true, element: <ExpiryAlerts /> }] },
          { path: 'billing', element: <ProtectedRoute allowedRoles={billingRoles} />, children: [{ index: true, element: <Invoices /> }] },
          { path: 'billing/invoices', element: <ProtectedRoute allowedRoles={billingRoles} />, children: [{ index: true, element: <Invoices /> }] },
          { path: 'billing/invoices/new', element: <ProtectedRoute allowedRoles={billingRoles} />, children: [{ index: true, element: <CreateInvoice /> }] },
          { path: 'billing/payments', element: <ProtectedRoute allowedRoles={billingRoles} />, children: [{ index: true, element: <Payments /> }] },
          { path: 'billing/refunds', element: <ProtectedRoute allowedRoles={billingRoles} />, children: [{ index: true, element: <Refunds /> }] },
          { path: 'billing/day-closing', element: <ProtectedRoute allowedRoles={billingRoles} />, children: [{ index: true, element: <DayClosing /> }] },
          { path: 'ai/clinical', element: <ProtectedRoute allowedRoles={clinicalRoles} />, children: [{ index: true, element: <AIClinical /> }] },
          { path: 'ai/summary', element: <ProtectedRoute allowedRoles={clinicalRoles} />, children: [{ index: true, element: <AIPatientSummary /> }] },
          { path: 'ai/explainer', element: <ProtectedRoute allowedRoles={diagnosticRoles} />, children: [{ index: true, element: <AIReportExplainer /> }] },
          { path: 'ai/admin', element: <ProtectedRoute allowedRoles={adminRoles} />, children: [{ index: true, element: <AIAdminCopilot /> }] },
          { path: 'ai/review', element: <ProtectedRoute allowedRoles={adminRoles} />, children: [{ index: true, element: <AIContentReview /> }] },
          { path: 'reports/revenue', element: <ProtectedRoute allowedRoles={[...billingRoles, Role.ADMIN]} />, children: [{ index: true, element: <RevenueReport /> }] },
          { path: 'reports/appointments', element: <AppointmentReport /> },
          { path: 'reports/pharmacy', element: <ProtectedRoute allowedRoles={pharmacyRoles} />, children: [{ index: true, element: <PharmacyReport /> }] },
          { path: 'reports/doctors', element: <ProtectedRoute allowedRoles={[Role.ADMIN, Role.DOCTOR]} />, children: [{ index: true, element: <DoctorPerformanceReport /> }] },
          { path: 'reports/audit', element: <ProtectedRoute allowedRoles={adminRoles} />, children: [{ index: true, element: <AuditLog /> }] },
          { path: 'admin/audit', element: <ProtectedRoute allowedRoles={adminRoles} />, children: [{ index: true, element: <AuditLog /> }] },
          { path: 'settings/organization', element: <ProtectedRoute allowedRoles={adminRoles} />, children: [{ index: true, element: <OrganizationSettings /> }] },
          { path: 'settings/branches', element: <ProtectedRoute allowedRoles={adminRoles} />, children: [{ index: true, element: <BranchesSettings /> }] },
          { path: 'settings/departments', element: <ProtectedRoute allowedRoles={adminRoles} />, children: [{ index: true, element: <DepartmentsSettings /> }] },
          { path: 'settings/staff', element: <ProtectedRoute allowedRoles={adminRoles} />, children: [{ index: true, element: <Staff /> }] },
          { path: 'settings/roles', element: <ProtectedRoute allowedRoles={adminRoles} />, children: [{ index: true, element: <RolesPermissions /> }] },
          { path: 'settings/templates', element: <ProtectedRoute allowedRoles={adminRoles} />, children: [{ index: true, element: <Templates /> }] },
          { path: 'settings/integrations', element: <ProtectedRoute allowedRoles={adminRoles} />, children: [{ index: true, element: <Integrations /> }] },
          { path: 'settings/security', element: <ProtectedRoute allowedRoles={adminRoles} />, children: [{ index: true, element: <Security /> }] },
          {
            path: 'unauthorized',
            element: (
              <StubPage
                title="Access restricted"
                description="Your current role does not have permission to open this hospital operations area."
              />
            )
          }
        ]
      }
    ]
  }
];
