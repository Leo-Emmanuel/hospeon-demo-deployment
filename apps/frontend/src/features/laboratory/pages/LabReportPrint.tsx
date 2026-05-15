import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLabOrder, useLabResult } from '@/features/laboratory/hooks/useLabQueries';
import { LoadingSkeleton, EmptyState } from '@/components/ui/EmptyState';
import { MonoNumber } from '@/components/ui/MonoNumber';

export function LabReportPrint() {
  const { id } = useParams<{ id: string }>();
  const orderQuery = useLabOrder(id || '');
  const resultQuery = useLabResult(id || '');

  const order = orderQuery.data?.data;
  const result = resultQuery.data?.data;

  useEffect(() => {
    if (order && result && !orderQuery.isLoading && !resultQuery.isLoading) {
      window.print();
    }
  }, [order, result, orderQuery.isLoading, resultQuery.isLoading]);

  if (orderQuery.isLoading || resultQuery.isLoading) {
    return <LoadingSkeleton rows={20} />;
  }

  if (!order || !result) {
    return <EmptyState title="Report not found" description="The requested lab report could not be found or is not yet resulted." />;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white text-black min-h-screen print:p-0">
      <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight">Hospeon Medical Center</h1>
          <p className="text-sm mt-1">123 Health Ave, Medical District · +91 98765 43210</p>
          <p className="text-sm">www.hospeon.com · contact@hospeon.com</p>
        </div>
        <div className="text-right">
          <div className="bg-black text-white px-3 py-1 font-bold text-sm mb-2">LABORATORY REPORT</div>
          <p className="text-sm font-bold">Report ID: <MonoNumber>{result.id.slice(0, 8).toUpperCase()}</MonoNumber></p>
          <p className="text-sm font-bold">Order ID: <MonoNumber>{order.id.slice(0, 8).toUpperCase()}</MonoNumber></p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
        <div className="space-y-1">
          <p><span className="font-bold w-24 inline-block">Patient:</span> {order.patient.firstName} {order.patient.lastName}</p>
          <p><span className="font-bold w-24 inline-block">UHID:</span> <MonoNumber>{order.patient.uhid}</MonoNumber></p>
          <p><span className="font-bold w-24 inline-block">Age/Gender:</span> {order.patient.gender} · {new Date().getFullYear() - new Date(order.patient.dob).getFullYear()}Y</p>
        </div>
        <div className="space-y-1 text-right">
          <p><span className="font-bold w-32 inline-block">Ordered Date:</span> {new Date(order.orderedAt).toLocaleDateString('en-IN')}</p>
          <p><span className="font-bold w-32 inline-block">Collected Date:</span> {result.enteredAt ? new Date(result.enteredAt).toLocaleDateString('en-IN') : '—'}</p>
          <p><span className="font-bold w-32 inline-block">Report Date:</span> {new Date().toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      <div className="mb-8">
        <div className="bg-gray-100 px-4 py-2 font-bold text-sm border-y border-gray-300 grid grid-cols-4">
          <div className="col-span-2">TEST NAME</div>
          <div>RESULT</div>
          <div>REFERENCE RANGE</div>
        </div>
        <div className="px-4 py-6 border-b border-gray-200 grid grid-cols-4 items-center">
          <div className="col-span-2 font-bold">{order.testCatalog.name}</div>
          <div className={result.isAbnormal ? 'font-bold underline' : ''}>
            <MonoNumber>{result.resultValue}</MonoNumber> {result.resultUnit}
          </div>
          <div className="text-sm text-gray-600">{result.referenceRange || order.testCatalog.referenceRangeLow + ' - ' + order.testCatalog.referenceRangeHigh}</div>
        </div>
      </div>

      {result.notes && (
        <div className="mb-12">
          <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Technician Notes</h3>
          <p className="text-sm italic">{result.notes}</p>
        </div>
      )}

      <div className="mt-24 grid grid-cols-2 gap-12 text-center text-sm">
        <div className="border-t border-black pt-2">
          <p className="font-bold">{result.technician?.name || 'Technician'}</p>
          <p className="text-xs text-gray-500 uppercase">Lab Technician</p>
        </div>
        <div className="border-t border-black pt-2">
          <p className="font-bold">{result.approver?.name || 'Consultant Doctor'}</p>
          <p className="text-xs text-gray-500 uppercase">Approved By</p>
        </div>
      </div>

      <div className="fixed bottom-8 left-8 right-8 text-[10px] text-gray-400 border-t pt-4 text-center print:static print:mt-12">
        This is a computer-generated diagnostic report and does not require a physical signature. 
        Please correlate clinically with patient history and other findings.
      </div>
    </div>
  );
}
