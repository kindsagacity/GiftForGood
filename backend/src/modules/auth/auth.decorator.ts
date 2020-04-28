import { ReflectMetadata, createParamDecorator } from '@nestjs/common';

export const PublicAccessibleRoute = () => ReflectMetadata('router:publicRoute', true);

export const CurrentUser = createParamDecorator((_, req) => req.user);

export const CurrentSession = createParamDecorator((_, req) => req.session);
