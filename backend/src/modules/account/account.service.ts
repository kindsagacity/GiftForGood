import { MailerProvider } from '@nest-modules/mailer';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Raw, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { generalConfig, mailContentOptions } from '../../config';
import User from '../../interfaces/user.interface';
import { HashPassword } from '../auth/auth.helpers';
import AccountVerify from './account.verify.entity';
import { VerificationEmailType } from './account.definitions';
import UserService from './user.service';

@Injectable()
export default class AccountService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    @InjectRepository(AccountVerify)
    private readonly emailVerifyRepository: Repository<AccountVerify>,
    @Inject('MailerProvider') private readonly mailerProvider: MailerProvider,
    private readonly userService: UserService,
  ) {}

  /**
   * Send account verification email
   * @param {User} user Current user
   * @returns True if successfully
   * @memberof AccountService
   */
  public async sendAccountVerificationEmail(user: User) {
    if (user.email.indexOf('@example.com') !== -1) {
      return true;
    }
    const record = await this.createVerificationRecord(user, VerificationEmailType.AccountVerification);
    const fullName = user.type === 'creator' ? user.firstName + ' ' + user.lastName : user.fullName;
    const profileLink =
      generalConfig.applicationHost + (process.env.NODE_ENV !== 'production' ? '/settings' : '/jobs/work-in-progress');
    const response = await this.mailerProvider.sendMail({
      ...mailContentOptions.confirmEmail,
      to: user.email,
      context: {
        host: generalConfig.applicationHost,
        profileLink,
        code: record.verificationCode,
        fullName,
      },
    });
    if (Array.isArray(response.rejected) && response.rejected.length) {
      throw new HttpException(
        'Unable to send verification email. Please try again later',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return true;
  }

  /**
   * Set email status as verified
   * @param {User} user Current user
   * @returns True if successfully
   * @memberof AccountService
   */
  public async verifyEmail(user: User) {
    const [result] = await this.entityManager.query(
      `UPDATE "${user.type}" SET "emailVerified" = TRUE WHERE id=$1 RETURNING id`,
      [user.id],
    );
    return result && !!result.id;
  }

  /**
   * Send reset password email
   * @param {string} email User email
   * @returns True if email successfully sended
   * @memberof AccountService
   */
  public async requestChangePassword(email: string) {
    if (email.indexOf('@example.com') !== -1) {
      return true;
    }
    const user = await this.userService.GetUserByEmail(email);
    if (!user) {
      return false;
    }
    const record = await this.createVerificationRecord(user, VerificationEmailType.ResetPassword);
    const hostPostfix = process.env.NODE_ENV === 'development' ? '' : '/jobs';
    const response = await this.mailerProvider.sendMail({
      ...mailContentOptions.resetPassword,
      to: user.email,
      context: {
        host: generalConfig.applicationHost + hostPostfix,
        code: record.verificationCode,
        fullName: user.fullName,
        email: user.email,
      },
    });
    if (Array.isArray(response.rejected) && response.rejected.length) {
      throw new HttpException('Unable to send email. Please try again later', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return true;
  }

  /**
   * Change password for current user
   * @param {User} user Current user
   * @param {string} password Password
   * @returns {Promise<boolean>}
   * @memberof AccountService
   */
  public async changePassword(user: User, password: string): Promise<boolean> {
    const hash = await HashPassword(password);
    const [result] = await this.entityManager.query(
      `UPDATE "${user.type}" SET password=$1, "passwordInited"=true WHERE id=$2 RETURNING id`,
      [hash, user.id],
    );
    return result && !!result.id;
  }

  /**
   * Get user by verification code
   * @param {string} code Verification code
   * @param {VerificationEmailType} emailType Type of email
   * @returns User
   * @memberof AccountService
   */
  public async getUserByVerificationCode(code: string, emailType: VerificationEmailType) {
    const [verificationRecord] = await this.emailVerifyRepository.find({
      where: {
        verificationCode: code,
        validTill: Raw(alias => `${alias} > NOW()`),
        emailType,
      },
      relations: ['creator', 'employer'],
    } as any);
    if (!verificationRecord) {
      return null;
    }
    const type = verificationRecord.creator ? 'creator' : 'employer';
    return { ...verificationRecord[type], type };
  }

  /**
   * Invalidate all expired verification codes
   * @param {string} code
   * @returns
   * @memberof AccountService
   */
  public async invalidateVerificationRecord(code: string) {
    return await this.entityManager.query(
      `DELETE FROM
        account_verify
      WHERE "validTill" < NOW()`,
    );
  }

  /**
   * Create and save to database verification record
   * @protected
   * @param {User} user
   * @param {VerificationEmailType} type
   * @returns
   * @memberof AccountService
   */
  protected createVerificationRecord(user: User, type: VerificationEmailType) {
    const code = uuidv4();
    const data = { verificationCode: code, [user.type]: user.id, emailType: type };
    Object.assign(data, {
      validTill: () => `NOW() + INTERVAL '` + generalConfig.passwordResetLifetime + ` second'`,
    });
    return this.emailVerifyRepository.save(data);
  }
}
