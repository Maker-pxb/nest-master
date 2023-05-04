import { ExceptionFilter } from '@nestjs/common';
import { Request, Response } from 'express';

export class HttpFilter implements ExceptionFilter {
  catch(exception: any, host: import('@nestjs/common').ArgumentsHost) {
    console.log(
      '🚀 ~ file: http.filter.ts:6 ~ HttpFilter ~ exception:',
      exception,
    );
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    if (!exception?.getStatus) {
      response.status(500).json({
        status: 500,
        time: new Date().toLocaleDateString(),
        message: '服务器错误',
        path: request.url,
      });
    } else {
      const status = exception.getStatus();
      response.status(status).json({
        status,
        time: new Date().toLocaleDateString(),
        message: exception.message,
        path: request.url,
      });
    }
  }
}
