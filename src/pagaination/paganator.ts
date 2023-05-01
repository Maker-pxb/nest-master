import { SelectQueryBuilder } from 'typeorm';

export interface PaginateOptions {
  limit: number;
  currentPage: number;
  total: boolean;
}

export interface PaginateResult<T> {
  total: number;
  data: T[];
  first?: number;
  last?: number;
  currentPage: number;
  limit: number;
}

export async function paginate<T>(
  qb: SelectQueryBuilder<T>,
  options: PaginateOptions = {
    limit: 10,
    currentPage: 1,
    total: true,
  },
): Promise<PaginateResult<T>> {
  const offset = (options.currentPage - 1) * options.limit;
  const data = await qb.limit(options.limit).offset(offset).getMany();
  return {
    first: offset + 1,
    last: offset + data.length,
    data,
    currentPage: options.currentPage,
    limit: options.limit,
    total: options.total ? await qb.getCount() : null,
  };
}
