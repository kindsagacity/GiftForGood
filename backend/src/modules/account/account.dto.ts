import { ApiModelProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDefined, IsEmail, IsIn, IsNotEmpty, IsString, Length } from 'class-validator';
import * as _ from 'lodash';

export enum AvailabilityForRegistration {
  Available = 'available',
  Unavailable = 'unavailable',
}

export class RequestChangePasswordDto {
  @ApiModelProperty({ format: 'email', description: 'User email' })
  @IsDefined()
  @IsEmail()
  public email: string;
}

export class ChangePasswordDto {
  @ApiModelProperty({ description: 'Verification code' })
  @IsDefined()
  @IsString()
  @Length(36)
  public code: string;

  @ApiModelProperty({ description: 'New password' })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(6, 50)
  public password: string;
}

export class VerifyEmailDto {
  @ApiModelProperty({ description: 'Verification code' })
  @IsDefined()
  @IsString()
  @Length(36)
  public code: string;
}

export class AccountAvailableDto {
  @ApiModelProperty({ description: 'Username or email' })
  @IsDefined()
  @IsString()
  @Transform(value => (value ? value.trim() : value))
  @Length(4, 320)
  public value: string;

  @ApiModelProperty({ enum: ['email', 'username'], description: 'Type of value' })
  @IsDefined()
  @IsIn(['email', 'username'])
  public field: string;
}

export class AccountAvailableResponseDto {
  @ApiModelProperty({ enum: _.values(AvailabilityForRegistration) })
  public status: string;
}
