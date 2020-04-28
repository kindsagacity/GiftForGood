import { Module } from '@nestjs/common';
import PaymentController from './payment.controller';
import { EmployerPlanService } from './payment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployerSubscriptionPlan, EmployerNextPlan } from './payment.entity';
import Employer from '../employer/employer.entity';
import { Creator } from '../creator';
import { Job } from '../job';

@Module({
  imports: [TypeOrmModule.forFeature([EmployerSubscriptionPlan, EmployerNextPlan, Employer, Creator, Job])],
  controllers: [PaymentController],
  providers: [EmployerPlanService],
})
export default class PaymentModule {}
