import * as svgCaptcha from 'svg-captcha';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  create() {
    const captcha = svgCaptcha.create({
      size: 4,
      width: 160,
      height: 60,
      fontSize: 50,
      background: '#cc9966',
    });
    return captcha;
  }
}
