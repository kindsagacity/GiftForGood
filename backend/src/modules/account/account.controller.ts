import {
  BadRequestException,
  Body,
  Controller,
  forwardRef,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiModelProperty, ApiOkResponse, ApiResponse, ApiUseTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import AccountService from './account.service';
import { generalConfig } from '../../config';
import User from '../../interfaces/user.interface';
import { AuthSignInResponseDto, UserProfileDto } from '../auth/auth.dto';
import { PublicAccessibleRoute, CurrentUser } from '../auth/auth.decorator';
import { transformUserObject } from '../auth/auth.helpers';
import AuthService from '../auth/auth.service';
import {
  AccountAvailableDto,
  AccountAvailableResponseDto,
  AvailabilityForRegistration,
  ChangePasswordDto,
  RequestChangePasswordDto,
  VerifyEmailDto,
} from './account.dto';
import { VerificationEmailType } from './account.definitions';
import UserService from './user.service';
import FeedService from '../feed/feed.service';

class AccountStaticOKResponse {
  @ApiModelProperty({ default: 'ok' })
  message: string;
}

@ApiUseTags('Account')
@Controller('account')
export default class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly userService: UserService,
    @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
    private readonly feedService: FeedService,
  ) {}

  @ApiOperation({
    title: 'Request change password',
    description: 'Start reset password flow. The email with a reset password link will be sent.',
  })
  @ApiOkResponse({ type: AccountStaticOKResponse })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Unable to send email' })
  @PublicAccessibleRoute()
  @Post('request-change-password')
  public async requestChangePassword(@Body() payload: RequestChangePasswordDto) {
    await this.accountService.requestChangePassword(payload.email);
    return { message: 'ok' };
  }

  @ApiOperation({ title: 'Change password', description: 'Last step of reset password flow.' })
  @ApiOkResponse({ type: AuthSignInResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Verification code invalid or expired' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Unable to change password' })
  @PublicAccessibleRoute()
  @Post('change-password')
  public async resetPassword(@Body() payload: ChangePasswordDto) {
    const user = await this.getUserByCode(payload.code, VerificationEmailType.ResetPassword);
    if (!this.accountService.changePassword(user, payload.password)) {
      throw new HttpException(
        'Unable to change the password. Please try again later',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    await this.accountService.invalidateVerificationRecord(payload.code);
    // In according to story https://distillery.atlassian.net/browse/GG-125 we have to automatically sign in the user
    const session = await this.authService.startSession(user);
    return {
      access_token: session.id,
      profile: transformUserObject(user),
    };
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: UserProfileDto })
  @ApiOperation({ title: 'Reduced profile', description: 'User profile with less amount of data' })
  @Get('/reduced-profile')
  reducedProfile(@CurrentUser() user: User) {
    return transformUserObject(user);
  }

  @ApiOperation({
    title: 'Request email verification',
    description: 'The email with a verification link will be sent.',
  })
  @ApiOkResponse({ type: AccountStaticOKResponse })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Unable to send verification email' })
  @ApiBearerAuth()
  @Post('request-email-verification')
  public async requestEmailVerification(@CurrentUser() user: User) {
    if (user.emailVerified) {
      throw new BadRequestException('The email is already verified');
    }
    try {
      await this.accountService.sendAccountVerificationEmail(user);
    } catch (err) {
      throw new HttpException(
        'Could not send verification email. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return { message: 'ok' };
  }

  @ApiOperation({
    title: 'Email verification',
    description: 'The email will be verified if the correct code will be provided.',
  })
  @ApiResponse({ status: HttpStatus.FOUND, description: 'Redirect on /confirm-email/success or /confirm-email/fail' })
  @PublicAccessibleRoute()
  @Get('verify-email/:code')
  public async verifyEmail(@Param() payload: VerifyEmailDto, @Res() res: Response) {
    let user;
    try {
      user = await this.getUserByCode(payload.code, VerificationEmailType.AccountVerification);
    } catch (err) {
      user = null;
    }
    const hostPostfix = process.env.NODE_ENV === 'development' ? '' : '/jobs';
    if (user && user.emailVerified) {
      return res.redirect(`${generalConfig.applicationHost + hostPostfix}/confirm-email/success`);
    }
    if (!user || !(await this.accountService.verifyEmail(user))) {
      return res.redirect(`${generalConfig.applicationHost + hostPostfix}/confirm-email/fail`);
    }
    await this.feedService.createNewUserGlobalPost(
      user.type === 'creator' ? user.id : null,
      user.type === 'employer' ? user.id : null,
    );
    await this.accountService.invalidateVerificationRecord(payload.code);
    return res.redirect(`${generalConfig.applicationHost + hostPostfix}/confirm-email/success`);
  }

  @ApiOperation({ title: 'Account availability check', description: 'Get account availability by email/username.' })
  @ApiOkResponse({ type: AccountAvailableResponseDto })
  @ApiBearerAuth()
  @Get('available')
  async available(@CurrentUser() user: User, @Query() query: AccountAvailableDto) {
    const account = await this.userService.GetUserBy(query.value, query.field);
    let status = AvailabilityForRegistration.Available;
    if (account) {
      status = AvailabilityForRegistration.Unavailable;
      if (account.type === user.type && account.id === user.id) {
        status = AvailabilityForRegistration.Available;
      }
    }
    return { status };
  }

  protected async getUserByCode(code: string, type: VerificationEmailType) {
    const user = await this.accountService.getUserByVerificationCode(code, type);
    if (!user) {
      throw new HttpException('Verification code invalid or expired', HttpStatus.BAD_REQUEST);
    }
    return user;
  }
}
