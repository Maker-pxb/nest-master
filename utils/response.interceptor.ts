import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

interface Data<T> {
  data: T;
}
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<Data<T>>> {
    return next.handle().pipe(
      map((data) => {
        return {
          status: 0,
          result: data,
          message: '请求成功',
        };
      }),
    );
  }
}
