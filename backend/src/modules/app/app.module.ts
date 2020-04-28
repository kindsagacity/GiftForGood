import { MailerModule } from '@nest-modules/mailer';
import { HttpException, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RavenInterceptor, RavenModule } from 'nest-raven';
import { dbConnectionOptions, generalConfig, mailOptions } from '../../config';
import { AccountModule } from '../account';
import { AclModule } from '../acl';
import { AuthModule } from '../auth';
import { BrandModule } from '../brand';
import { CreatorModule } from '../creator';
import { EmployerModule } from '../employer';
import { FeedModule } from '../feed';
import { InviteModule } from '../invite';
import { MediaModule } from '../media';
import { TagModule } from '../tag';
import { ProjectModule } from '../project';
import { JobModule } from '../job';
import { S3Module } from '../s3';
import { FeedbackModule } from '../feedback';
import { StaffModule } from '../staff';
import { SubscriptionModule } from '../subscription';
import AppController from './app.controller';
// import { PaymentModule } from '../payment';
import { IpActionModule } from '../ipAction';
import { MailChimpModule } from '../mailchimp';
import { OGPModule } from '../ogp';
import { MessagingModule } from '../sendbird';

@Module({
  imports: [
    TypeOrmModule.forRoot(dbConnectionOptions),
    MailerModule.forRoot(mailOptions),
    PassportModule.register({
      session: false,
    }),
    AuthModule,
    AclModule,
    AccountModule,
    StaffModule,
    TagModule,
    CreatorModule,
    EmployerModule,
    BrandModule,
    MediaModule,
    ProjectModule,
    JobModule,
    S3Module,
    FeedbackModule,
    // PaymentModule,
    SubscriptionModule,
    FeedModule,
    RavenModule.forRoot(generalConfig.sentryDSN),
    IpActionModule,
    InviteModule,
    MailChimpModule,
    MessagingModule,
    OGPModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RavenInterceptor({
        filters: [{ type: HttpException, filter: (exception: HttpException) => 500 > exception.getStatus() }],
      }),
    },
  ],
})
export default class AppModule {}
