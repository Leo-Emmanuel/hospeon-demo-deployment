import { PrismaClient, Role, Gender } from '@prisma/client';
import { hashPassword } from '../src/utils/password.util';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. DEPARTMENTS
  const deptNames = [
    'Cardiology',
    'General Medicine',
    'Pediatrics',
    'Orthopedics',
    'Pulmonology',
    'Obstetrics & Gynecology'
  ];

  const departments: Record<string, string> = {};

  for (const name of deptNames) {
    const dept = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name }
    });
    departments[name] = dept.id;
    console.log(`Created/Upserted Department: ${name}`);
  }

  // 2. USERS
  const usersToSeed = [
    { email: 'admin@hospeon.com', pass: 'Admin@123', role: Role.ADMIN, name: 'System Admin' },
    { email: 'doctor1@hospeon.com', pass: 'Doctor@123', role: Role.DOCTOR, name: 'Dr. Rahul Sharma', deptName: 'Cardiology' },
    { email: 'doctor2@hospeon.com', pass: 'Doctor@123', role: Role.DOCTOR, name: 'Dr. Priya Patel', deptName: 'Pediatrics' },
    { email: 'lab@hospeon.com', pass: 'Lab@123', role: Role.LAB_TECHNICIAN, name: 'Lab Technician 1' },
    { email: 'receptionist@hospeon.com', pass: 'Recept@123', role: Role.RECEPTIONIST, name: 'Front Desk' },
    { email: 'nurse@hospeon.com', pass: 'Nurse@123', role: Role.NURSE, name: 'Head Nurse' },
    { email: 'pharmacist@hospeon.com', pass: 'Pharma@123', role: Role.PHARMACIST, name: 'Pharmacy Head' },
    { email: 'accountant@hospeon.com', pass: 'Acct@123', role: Role.ACCOUNTANT, name: 'Finance Admin' }
  ];

  for (const u of usersToSeed) {
    const passwordHash = await hashPassword(u.pass);
    const departmentId = u.deptName ? departments[u.deptName] : undefined;

    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash,
        role: u.role,
        departmentId
      },
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        departmentId
      }
    });
    console.log(`Created/Upserted User: ${u.email}`);
  }

  // 3. LAB TESTS CATALOG
  const labTests = [
    { name: 'CBC', code: 'CBC-001', category: 'Hematology', specimenType: 'Blood', referenceRangeLow: 4.0, referenceRangeHigh: 11.0, unit: 'x10^3/uL', turnaroundHours: 4 },
    { name: 'Blood Glucose (Fasting)', code: 'BGF-001', category: 'Biochemistry', specimenType: 'Blood', referenceRangeLow: 70, referenceRangeHigh: 100, unit: 'mg/dL', turnaroundHours: 2 },
    { name: 'HbA1c', code: 'HBA1C-001', category: 'Biochemistry', specimenType: 'Blood', referenceRangeLow: 4.0, referenceRangeHigh: 5.6, unit: '%', turnaroundHours: 4 },
    { name: 'Lipid Profile', code: 'LIPID-001', category: 'Biochemistry', specimenType: 'Blood', referenceRangeLow: null, referenceRangeHigh: 200, unit: 'mg/dL', turnaroundHours: 6 },
    { name: 'Liver Function Test', code: 'LFT-001', category: 'Biochemistry', specimenType: 'Blood', referenceRangeLow: null, referenceRangeHigh: null, unit: 'U/L', turnaroundHours: 6 },
    { name: 'Kidney Function Test', code: 'KFT-001', category: 'Biochemistry', specimenType: 'Blood', referenceRangeLow: 0.6, referenceRangeHigh: 1.2, unit: 'mg/dL', turnaroundHours: 6 },
    { name: 'Thyroid Profile (TSH)', code: 'TSH-001', category: 'Endocrinology', specimenType: 'Blood', referenceRangeLow: 0.4, referenceRangeHigh: 4.0, unit: 'mIU/L', turnaroundHours: 6 },
    { name: 'Urine Routine', code: 'UR-001', category: 'Clinical Pathology', specimenType: 'Urine', referenceRangeLow: null, referenceRangeHigh: null, unit: null, turnaroundHours: 2 },
    { name: 'ECG', code: 'ECG-001', category: 'Cardiology', specimenType: null, referenceRangeLow: null, referenceRangeHigh: null, unit: null, turnaroundHours: 1 },
    { name: 'Chest X-ray', code: 'CXR-001', category: 'Radiology', specimenType: null, referenceRangeLow: null, referenceRangeHigh: null, unit: null, turnaroundHours: 2 },
    { name: 'COVID-19 Antigen', code: 'COV-AG', category: 'Microbiology', specimenType: 'Nasal Swab', referenceRangeLow: null, referenceRangeHigh: null, unit: null, turnaroundHours: 1 },
    { name: 'Dengue NS1 Antigen', code: 'DEN-NS1', category: 'Microbiology', specimenType: 'Blood', referenceRangeLow: null, referenceRangeHigh: null, unit: null, turnaroundHours: 4 }
  ];

  for (const test of labTests) {
    await prisma.labTestCatalog.upsert({
      where: { code: test.code },
      update: {
        name: test.name,
        category: test.category,
        specimenType: test.specimenType,
        referenceRangeLow: test.referenceRangeLow,
        referenceRangeHigh: test.referenceRangeHigh,
        unit: test.unit,
        turnaroundHours: test.turnaroundHours,
        isActive: true
      },
      create: {
        ...test,
        isActive: true
      }
    });
    console.log(`Created/Upserted Lab Test: ${test.name}`);
  }

  // 4. PATIENTS
  const patients = [
    { uhid: 'HOSP-10001', firstName: 'Aarav', lastName: 'Kumar', dob: new Date('1990-05-15'), gender: Gender.MALE, phone: '9876543210' },
    { uhid: 'HOSP-10002', firstName: 'Neha', lastName: 'Singh', dob: new Date('1985-11-20'), gender: Gender.FEMALE, phone: '9876543211' },
    { uhid: 'HOSP-10003', firstName: 'Rajesh', lastName: 'Gupta', dob: new Date('1975-02-10'), gender: Gender.MALE, phone: '9876543212' }
  ];

  for (const p of patients) {
    await prisma.patient.upsert({
      where: { uhid: p.uhid },
      update: {},
      create: p
    });
    console.log(`Created/Upserted Patient: ${p.firstName} ${p.lastName}`);
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
