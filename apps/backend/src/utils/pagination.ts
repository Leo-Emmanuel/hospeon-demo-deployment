import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional().default(''),
  sort: z.string().trim().optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const getPagination = (query: Partial<PaginationQuery>) => {
  const page = query.page || 1;
  const limit = query.limit || 20;
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
};

export const getPaginationMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
