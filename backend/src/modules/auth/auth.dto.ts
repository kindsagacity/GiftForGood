import { ApiModelProperty } from '@nestjs/swagger';
import { IsDefined, IsEmail, IsIn, IsPositive, IsString, Length } from 'class-validator';

export class LoginCredentialsDto {
  @ApiModelProperty({ type: 'string', format: 'email', description: `User's email` })
  @IsDefined()
  @IsString()
  @IsEmail()
  @Length(6, 320)
  public email: string;

  @ApiModelProperty({ description: `User's password` })
  @IsDefined()
  @IsString()
  @Length(6, 50)
  public password: string;
}

export class TokenCredentialsDto {
  @ApiModelProperty({ description: 'Token from social network to sign in' })
  @IsDefined()
  @IsString()
  @Length(32, 1024)
  public token: string;

  @ApiModelProperty({ enum: ['google', 'facebook'], description: 'Social network to sign in' })
  @IsDefined()
  @IsIn(['facebook', 'google'])
  public type: string;
}

export class UserProfileDto {
  @ApiModelProperty({ readOnly: true, type: 'number' })
  public id: number = 0;

  @ApiModelProperty({ readOnly: true, format: 'email' })
  public email: string = '';

  @ApiModelProperty({ readOnly: true })
  public emailVerified: boolean = false;

  @ApiModelProperty({ readOnly: true })
  public username: string = '';

  @ApiModelProperty({ readOnly: true, enum: ['creator', 'employer'] })
  public type: string = '';

  @ApiModelProperty({ readOnly: true })
  public verified: boolean = false;

  @ApiModelProperty({ readOnly: true })
  public blocked: boolean = false;

  @ApiModelProperty({ readOnly: true })
  public photo: string = '';

  @ApiModelProperty({ readOnly: true })
  public coverPhoto: string = '';

  @ApiModelProperty({ readOnly: true })
  public firstName: string = '';

  @ApiModelProperty({ readOnly: true })
  public lastName: string = '';

  @ApiModelProperty({ readOnly: true })
  public fullName: string = '';

  @ApiModelProperty({ readOnly: true, format: 'url' })
  public profileLink: string = '';

  @ApiModelProperty({ readOnly: true })
  public onboardingCompleted: boolean = false;

  @ApiModelProperty({ readOnly: true, type: Number })
  public onboardingStep: number = 0;

  @ApiModelProperty({ readOnly: true })
  public socialAccount: boolean = false;

  @ApiModelProperty({ readOnly: true })
  public betaTester: boolean = false;

  @ApiModelProperty({ readOnly: true })
  public betaAccessBy: string = '';

  @ApiModelProperty({ readOnly: true })
  public passwordInited: boolean = false;
}

export class AuthSignInResponseDto {
  @ApiModelProperty()
  public access_token: string;

  @ApiModelProperty()
  public profile: UserProfileDto;
}
