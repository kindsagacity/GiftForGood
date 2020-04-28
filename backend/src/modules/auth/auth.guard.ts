import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

const SplitUserAndSession = (request: any) => {
  if (!request.user || !request.user.hasOwnProperty('session')) {
    return;
  }
  const { user, session } = request.user;
  request.user = user;
  request.session = { id: session.id, validTill: session.validTill };
};

@Injectable()
export default class GlobalAuthGuard extends AuthGuard('bearer') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const isPublicAccessible = this.reflector.get<boolean>('router:publicRoute', context.getHandler());
    try {
      await super.canActivate(context);
    } catch (e) {
      if (isPublicAccessible) {
        return true;
      }
      throw e;
    }
    const request = context.switchToHttp().getRequest();
    SplitUserAndSession(request);
    return true;
  }
}

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext) {
    if (!(await super.canActivate(context))) {
      return false;
    }
    const request = context.switchToHttp().getRequest();
    SplitUserAndSession(request);
    return true;
  }
}
