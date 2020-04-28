import { HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as PassportBearer } from 'passport-http-bearer';
import { Strategy as PassportLocal } from 'passport-local';
import AuthService from './auth.service';

@Injectable()
export class BearerStrategy extends PassportStrategy(PassportBearer, 'bearer') {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(token: string) {
    const data = await this.authService.getSession(token);
    if (!data) {
      throw new UnauthorizedException();
    }
    return data;
  }
}

@Injectable()
export class LocalStrategy extends PassportStrategy(PassportLocal, 'local') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string) {
    const user = await this.authService.authenticateUser(email, password);
    if (!user) {
      throw new HttpException('Invalid email or password', 401);
    }
    const session = await this.authService.startSession(user);
    return { user, session };
  }
}
