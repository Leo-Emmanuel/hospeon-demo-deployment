import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export class UsersRepository {
  async findAll(where: Prisma.UserWhereInput, skip?: number, take?: number) {
    return prisma.user.findMany({
      where,
      skip,
      take,
      include: {
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(where: Prisma.UserWhereInput) {
    return prisma.user.count({ where });
  }

  async findById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        department: true,
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async create(data: Prisma.UserCreateInput | Prisma.UserUncheckedCreateInput, tx?: any) {
    const client = tx || prisma;
    return client.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput | Prisma.UserUncheckedUpdateInput, tx?: any) {
    const client = tx || prisma;
    return client.user.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string, tx?: any) {
    const client = tx || prisma;
    return client.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const usersRepository = new UsersRepository();
