import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    console.log(
      '🚀 ~ file: current-user.decorator.ts:8 ~ request.user:',
      request.user,
    );
    return request.user ?? null;
  },
);
