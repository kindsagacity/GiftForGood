import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth';
import AccountController from './account.controller';
import AccountService from './account.service';
import AccountVerify from './account.verify.entity';
import { UserAlreadyExist } from './userAlreadyExist.validator';
import FeedModule from '../feed/feed.module';
import FeedService from '../feed/feed.service';
import { CheckCurrentPassword } from './validateCurrentPassword.validator';

@Module({
  controllers: [AccountController],
  imports: [TypeOrmModule.forFeature([AccountVerify]), forwardRef(() => AuthModule), FeedModule],
  providers: [AccountService, UserAlreadyExist, CheckCurrentPassword, FeedService],
  exports: [AccountService],
})
export default class AccountModule {}
