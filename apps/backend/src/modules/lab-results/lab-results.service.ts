import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { writeAuditLog } from '../../utils/auditLog';

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export class LabResultsService {
  private async getOrderForResult(tx: any, orderId: string) {
    const order = await tx.labOrder.findUnique({ where: { id: orderId }, include: { testCatalog: true, result: true } });
    if (!order) throw new AppError(404, 'Lab order not found');
    if (!['SAMPLE_COLLECTED', 'PROCESSING'].includes(order.status)) {
      throw new AppError(422, 'Lab result can only be entered for sample_collected or processing orders');
    }
    return order;
  }

  async enter(orderId: string, data: any, actorId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const order = await this.getOrderForResult(tx, orderId);
      const numeric = toNumber(data.resultValue);
      const low = order.testCatalog.referenceRangeLow ? Number(order.testCatalog.referenceRangeLow) : undefined;
      const high = order.testCatalog.referenceRangeHigh ? Number(order.testCatalog.referenceRangeHigh) : undefined;
      const isAbnormal = data.isAbnormal ?? (numeric !== undefined && ((low !== undefined && numeric < low) || (high !== undefined && numeric > high)));
      const result = await tx.labResult.create({
        data: {
          ...data,
          labOrderId: orderId,
          technicianId: actorId!,
          resultUnit: data.resultUnit || order.testCatalog.unit,
          referenceRange: data.referenceRange || [low, high].filter((v) => v !== undefined).join(' - '),
          isAbnormal,
        },
      });
      await tx.labOrder.update({ where: { id: orderId }, data: { status: 'RESULTED' } });
      await writeAuditLog(tx, { actorId, action: 'CREATE', entityType: 'lab_results', entityId: result.id, newValues: result, ipAddress });
      return result;
    });
  }

  async get(orderId: string) {
    const result = await prisma.labResult.findUnique({ where: { labOrderId: orderId }, include: { technician: { select: { id: true, name: true } }, approver: { select: { id: true, name: true } }, labOrder: { include: { testCatalog: true } } } });
    if (!result) throw new AppError(404, 'Lab result not found');
    return result;
  }

  async update(orderId: string, data: any, actorId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.labResult.findUnique({ where: { labOrderId: orderId } });
      if (!existing) throw new AppError(404, 'Lab result not found');
      if (existing.approvedAt) throw new AppError(422, 'Approved lab results cannot be updated');
      const result = await tx.labResult.update({ where: { labOrderId: orderId }, data });
      await writeAuditLog(tx, { actorId, action: 'UPDATE', entityType: 'lab_results', entityId: result.id, oldValues: existing, newValues: result, ipAddress });
      return result;
    });
  }

  async approve(orderId: string, actorId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.labOrder.findUnique({ where: { id: orderId }, include: { result: true } });
      if (!order || !order.result) throw new AppError(404, 'Lab result not found');
      if (order.status !== 'RESULTED') throw new AppError(422, 'Approval only allowed when lab order status is resulted');
      const result = await tx.labResult.update({ where: { labOrderId: orderId }, data: { approvedBy: actorId, approvedAt: new Date() } });
      const approvedOrder = await tx.labOrder.update({ where: { id: orderId }, data: { status: 'APPROVED' } });
      if (order.orderedBy !== actorId) {
        await tx.notification.create({
          data: {
            userId: order.orderedBy,
            type: 'lab_result_approved',
            title: 'Lab result approved',
            message: 'A lab result you ordered has been approved.',
            entityType: 'lab_orders',
            entityId: orderId,
          },
        });
      }
      await writeAuditLog(tx, { actorId, action: 'APPROVE', entityType: 'lab_results', entityId: result.id, oldValues: order.result, newValues: { result, order: approvedOrder }, ipAddress });
      return result;
    });
  }
}

export const labResultsService = new LabResultsService();
