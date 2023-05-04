import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import * as session from 'express-session';
import * as cors from 'cors';
import { NextFunction, Request, Response } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ResponseInterceptor } from '../utils/response.interceptor';
import { HttpFilter } from '../utils/http.filter';

const blackList = ['auth/login'];
function MiddleWare(req: Request, res: Response, next: NextFunction) {
  console.log('中间件');
  if (blackList.includes(req.originalUrl)) {
    res.send('end');
  } else {
    next();
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // logger: ['error', 'warn', 'debug'],
  });
  app.use(cors());
  app.use(MiddleWare);
  app.useGlobalPipes(new ValidationPipe());
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useStaticAssets('public', {
    // prefix: '/static/',
  });
  app.use(
    session({
      secret: 'my-secret',
      // 强制在每个响应上设置会话标识符cookie。过期时间重置为原来的maxAge，重置过期倒计时。默认值为false。
      rolling: true,
      name: 'nest',
      cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpFilter());
  await app.listen(3000);
}

bootstrap();
