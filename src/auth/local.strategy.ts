import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly longer = new Logger(LocalStrategy.name);
  constructor(private readonly authService: AuthService) {
    super();
  }

  public async validate(username: string, password: string): Promise<any> {
    this.longer.debug(`Validating user ${username}-${password}`);
    return await this.authService.validateUser(username, password);
  }
}
