import { Expose } from 'class-transformer';
import { SelectQueryBuilder } from 'typeorm';

export interface PaginateOptions {
  limit: number;
  page: number;
  total?: boolean;
}

export class PaginationResult<T> {
  constructor(partial: Partial<PaginationResult<T>>) {
    Object.assign(this, partial);
  }
  @Expose()
  total: number;
  @Expose()
  first?: number;
  @Expose()
  last?: number;
  @Expose()
  page: number;
  @Expose()
  limit: number;
  @Expose()
  data: T[];
}

export async function paginate<T>(
  qb: SelectQueryBuilder<T>,
  options: PaginateOptions = {
    limit: 10,
    page: 1,
    total: true,
  },
): Promise<PaginationResult<T>> {
  const offset = (options.page - 1) * options.limit;
  const data = await qb.limit(options.limit).offset(offset).getMany();
  return new PaginationResult({
    first: offset + 1,
    last: offset + data.length,
    data,
    page: options.page,
    limit: options.limit,
    total: options.total ? await qb.getCount() : null,
  });
}
