import {
  Body,
  Controller,
  HttpException,
  NotImplementedException,
  Post,
  UseGuards,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiModelProperty, ApiOkResponse, ApiResponse, ApiUseTags, ApiOperation } from '@nestjs/swagger';
import User from '../../interfaces/user.interface';
import { CurrentSession, CurrentUser, PublicAccessibleRoute } from './auth.decorator';
import { AuthSignInResponseDto, LoginCredentialsDto, TokenCredentialsDto } from './auth.dto';
import { LocalAuthGuard } from './auth.guard';
import { getGoogleAccount, transformUserObject } from './auth.helpers';
import AuthService from './auth.service';
import { UserSession } from './auth.session.entity';
import { IpActionService } from '../ipAction';
import { UserAction } from '../ipAction/ipAction.entity';

class SignoutOkResponse {
  @ApiModelProperty({ default: 'ok' })
  message: string;
}

@ApiUseTags('Auth')
@Controller('auth')
export default class AuthController {
  constructor(private readonly authService: AuthService, private readonly ipActionService: IpActionService) {}

  @ApiOperation({ title: 'Sign in', description: 'Sign in via credentials' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid email or password' })
  @ApiOkResponse({ type: AuthSignInResponseDto })
  @Post('signin')
  @PublicAccessibleRoute() // Disable global auth guard
  @UseGuards(new LocalAuthGuard()) // And use local auth guard instead
  public async signin(
    @Req() req,
    @Body() credentials: LoginCredentialsDto,
    @CurrentUser() user: User,
    @CurrentSession() session: UserSession,
  ) {
    await this.ipActionService.createOne(req, UserAction.Login);
    return {
      access_token: session.id,
      profile: transformUserObject(user),
      passwordInited: user.passwordInited,
    };
  }

  @ApiOperation({ title: 'Sign out' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Unable to find session' })
  @ApiOkResponse({ type: SignoutOkResponse })
  @ApiBearerAuth()
  @Post('signout')
  public async signout(@CurrentSession() session: UserSession) {
    await this.authService.finishSession(session.id);

    return {
      message: 'ok',
    };
  }

  @ApiOperation({ title: 'Sign in (social)', description: 'Sign in via social account' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unable to find account' })
  @ApiOkResponse({ type: AuthSignInResponseDto })
  @Post('signin/social')
  @PublicAccessibleRoute()
  public async signinSocial(@Req() req, @Body() credentials: TokenCredentialsDto) {
    if (credentials.type !== 'google') {
      throw new NotImplementedException();
    }

    const account = await getGoogleAccount(credentials.token);
    const user = await this.authService.authenticateUser(account.email, null, true);
    if (!user) {
      throw new HttpException('Unable to find girlgaze account', HttpStatus.UNAUTHORIZED);
    }
    await this.ipActionService.createOne(req, UserAction.Login);
    const session = await this.authService.startSession(user);
    return {
      access_token: session.id,
      profile: transformUserObject(user),
      passwordInited: user.passwordInited,
    };
  }
}
