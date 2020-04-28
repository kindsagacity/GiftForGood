import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Headers,
  HttpStatus,
  Inject,
  Patch,
  Post,
  Query,
  Req,
  Param,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiUseTags,
} from '@nestjs/swagger';
import {
  CancelPlanRequestDto,
  CardRequestDto,
  EmployerPlanRequestDto,
  PaymentInfo,
  PlanResponseDto,
  UpdatePlanRequestDto,
} from './payment.definitions';

import { EmployerPlanService } from './payment.service';
import { CurrentUser } from '../auth';
import { Employer } from '../employer';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import User from '../../interfaces/user.interface';
import { PublicAccessibleRoute } from '../auth/';
import { transformPlanObject } from './payment.helpers';

@ApiBearerAuth()
@ApiUseTags('Payment')
@Controller('payment')
export default class PaymentController {
  constructor(
    private readonly employerPlanService: EmployerPlanService,
    @InjectRepository(Employer)
    private readonly employerRepository: Repository<Employer>,
  ) {}

  @ApiOperation({
    title: 'Employer plan payment',
    description: ``,
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Plan was successfully bought' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Unable to pay' })
  @Post('/employer/plan/')
  async buyPlan(@CurrentUser() user: User, @Body() params: EmployerPlanRequestDto) {
    if (user.type !== 'employer') {
      throw new BadRequestException('The current plan can only be purchased by the employer.');
    }
    const employer = await this.employerRepository.findOne(user.id);
    await this.employerPlanService.buyPlan(employer, params.planId);
  }

  @ApiOperation({
    title: 'Cancel employer plan',
    description: ``,
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Plan was successfully cancelled' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Unable to cancel plan' })
  @Delete('/employer/plan')
  async cancelPlan(@CurrentUser() user: User, @Body() params: CancelPlanRequestDto) {
    if (user.type !== 'employer') {
      throw new BadRequestException('The plan can only be cancel by the employer.');
    }
    const employer = await this.employerRepository.findOne(user.id);
    try {
      await this.employerPlanService.cancelPlan(employer, params.planId);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @ApiOperation({
    title: 'Update employer plan',
    description: ``,
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Plan was successfully changed' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Unable to change plan' })
  @Patch('/employer/plan')
  async updatePlan(@CurrentUser() user: User, @Body() params: UpdatePlanRequestDto) {
    if (user.type !== 'employer') {
      throw new BadRequestException('The plan can only be updated by the employer.');
    }
    const employer = await this.employerRepository.findOne(user.id);
    try {
      await this.employerPlanService.updatePlan(employer, params.newPlanId);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @ApiOperation({
    title: 'Update employer card',
    description: ``,
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Card was successfully updated' })
  @ApiBadRequestResponse({ description: 'Unable to update card' })
  @Post('/employer/card')
  async updateEmployerCard(@CurrentUser() user: User, @Body() params: CardRequestDto) {
    if (user.type !== 'employer') {
      throw new BadRequestException('The card can updates only by the employer.');
    }
    const employer = await this.employerRepository.findOne(user.id);
    try {
      await this.employerPlanService.updatePayment(employer, params.stripeToken);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @ApiOperation({
    title: 'Get employer payment info',
    description: ``,
  })
  @ApiOkResponse({
    type: PaymentInfo,
    description: 'Payment info',
  })
  @ApiNotFoundResponse({ description: 'Employer not found' })
  @Get('/employer/:id(\\d+)')
  async getEmployerPayment(@Param('id') id: number) {
    // TODO ACL check owner
    const employer = await this.employerRepository.findOne(id);
    if (!employer) {
      throw new NotFoundException('Employer not found');
    }
    if (employer.stripeCustomerId) {
      return this.employerPlanService.getPaymentInfo(employer);
    }
  }

  @ApiOperation({
    title: 'Get plans for an employer',
    description: ``,
  })
  @ApiOkResponse({
    type: PlanResponseDto,
    isArray: true,
    description: 'Return list of plans',
  })
  @ApiBadRequestResponse({ description: 'Unable to get plan list' })
  @Get('/plans/employer')
  async getEmployerPlans(@CurrentUser() user: User) {
    if (user.type !== 'employer') {
      throw new BadRequestException('The plans can gets only by the employer.');
    }
    try {
      const plans = await this.employerPlanService.getProductPlans();
      return plans.data.map(transformPlanObject);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @ApiOperation({
    title: 'Stripe webhook',
    description: ``,
  })
  @ApiBadRequestResponse({ description: 'Failed to handle event' })
  @PublicAccessibleRoute()
  @Post('/webhook')
  async stripeWebhook(@Req() req, @Headers('stripe-signature') stripeSignature) {
    try {
      const stripeEvent = this.employerPlanService.constructEvent(stripeSignature, req.rawBody);
      await this.employerPlanService.handleEvent(stripeEvent);
    } catch (e) {
      throw new BadRequestException(e.message);
    }

    return { received: true };
  }
}
