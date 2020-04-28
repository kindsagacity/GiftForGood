import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import UserService from '../account/user.service';
import AuthController from './auth.controller';
import AuthService from './auth.service';
import Session from './auth.session.entity';
import { BearerStrategy, LocalStrategy } from './auth.strategy';
import { IpActionModule } from '../ipAction';

@Module({
  imports: [TypeOrmModule.forFeature([Session]), IpActionModule],
  controllers: [AuthController],
  providers: [BearerStrategy, LocalStrategy, AuthService, UserService],
  exports: [AuthService, UserService],
})
export default class AuthModule {}
