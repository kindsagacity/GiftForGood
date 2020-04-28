import { ApiModelProperty } from '@nestjs/swagger';
import { IsDefined, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class EmployerPlanRequestDto {
  @ApiModelProperty({
    type: 'string',
    description: 'Stripe plan id',
  })
  @IsString()
  @IsNotEmpty()
  @IsDefined()
  public planId: string;
}

export class CardRequestDto {
  @ApiModelProperty({
    type: 'string',
    description: 'Stripe token card to save customer card',
  })
  @IsString()
  @IsNotEmpty()
  @IsDefined()
  public stripeToken: string;
}

export class CancelPlanRequestDto {
  @ApiModelProperty({
    type: 'string',
    description: 'Stripe plan id',
  })
  @IsString()
  @IsNotEmpty()
  @IsDefined()
  public planId: string;
}

export class UpdatePlanRequestDto {
  @ApiModelProperty({
    type: 'string',
    description: 'Stripe plan id',
  })
  @IsString()
  @IsNotEmpty()
  @IsDefined()
  public newPlanId: string;
}

export class EmployerPlanMetadata {
  @ApiModelProperty({
    type: 'string',
    description: 'The number of job posts which employer can add',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  public active_posts: string;

  @ApiModelProperty({
    type: 'string',
  })
  @IsOptional()
  public seal: string;

  @ApiModelProperty({
    type: 'string',
    description: 'The number of recruiter which employer can invite',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  public hiring_users: string;
}

export class PlanResponseDto {
  @ApiModelProperty({
    type: 'string',
    description: 'Stripe plan id',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  public id: string = '';

  @ApiModelProperty({
    type: 'number',
    description: 'The amount in cents to be charged on the interval specified',
  })
  @IsNumber()
  @IsDefined()
  public amount: number = 0;

  @ApiModelProperty({
    type: 'string',
    description: 'One of day, week, month or year. The frequency with which a subscription should be billed',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  public interval: string = '';

  @ApiModelProperty({
    type: EmployerPlanMetadata,
    description: 'Plan metadata',
  })
  public metadata: EmployerPlanMetadata = null;

  @ApiModelProperty({
    type: 'string',
    description: 'Plan name',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  public nickname: string = '';

  @ApiModelProperty({
    type: 'number',
    description: 'Default number of trial days when subscribing a customer to this plan ',
  })
  @IsNumber()
  @IsDefined()
  public trial_period_days: number = 0;
}

export class CardResponseDto {
  @ApiModelProperty({
    type: 'string',
    description: 'The brand of the card',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  public brand: string = '';

  @ApiModelProperty({
    type: 'string',
    description: 'Two-letter ISO code representing the country of the card',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  public country: string = '';

  @ApiModelProperty({
    type: 'string',
    description: 'Two-digit number representing the card’s expiration month',
  })
  @IsNumber()
  @IsDefined()
  public exp_month: number = 0;

  @ApiModelProperty({
    type: 'string',
    description: 'Four-digit number representing the card’s expiration year',
  })
  @IsNumber()
  @IsDefined()
  public exp_year: number = 0;

  @ApiModelProperty({
    type: 'string',
    description: 'The last four digits of the card',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  public last4: string = '';
}

export class PaymentInfo {
  @ApiModelProperty({
    type: PlanResponseDto,
    description: 'Current plan data',
  })
  @IsOptional()
  public plan: PlanResponseDto;

  @ApiModelProperty({
    type: CardResponseDto,
    description: 'Default customer card',
  })
  @IsOptional()
  public card: CardResponseDto;
}
