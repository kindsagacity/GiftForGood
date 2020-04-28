import { config } from 'dotenv';
config(); // Configuration should be done as early as possible

import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { generalConfig } from './config';
import { AppModule } from './modules/app';
import { IsDomainInList } from './utils';

import * as helmet from 'helmet';
import { AuthGuard, BetaAccess, UserResponseTransformer } from './modules/auth';
import { useContainer } from 'class-validator';
import { AclGuard } from './modules/acl';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: new Logger('main') });
  // DI for class validator
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.setGlobalPrefix('api');

  const reflector = app.get('Reflector');
  const aclService = app.get('AclService');
  app.useGlobalGuards(new AuthGuard(reflector));
  app.useGlobalGuards(new BetaAccess(reflector));
  app.useGlobalGuards(new AclGuard(reflector, aclService));
  app.useGlobalInterceptors(new UserResponseTransformer());
  app.useGlobalPipes(new ValidationPipe({ skipMissingProperties: true, whitelist: true }));
  app.use(helmet());
  app.enableCors({
    origin: (origin, callback) => {
      // Browser may not send origin in case it match the app(no cors)
      if (origin === undefined || IsDomainInList(origin, generalConfig.allowDomains)) {
        return callback(null, true);
      }
      Logger.warn(`Request from origin "${origin}" was rejected by CORS`);
      callback(new Error('Rejected by CORS'));
    },
    credentials: false,
  });

  if (process.env.NODE_ENV !== 'production') {
    const options = new DocumentBuilder()
      .setTitle('Girlgaze')
      .setDescription('Girlgaze API')
      .setVersion(process.env.npm_package_version)
      .setBasePath('api')
      .setSchemes('https', 'http')
      .addBearerAuth('Authorization', 'header')
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(process.env.NODE_PORT || 3000);
}
bootstrap();
