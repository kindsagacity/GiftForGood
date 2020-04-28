import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import * as _ from 'lodash';
import { EntityManager, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { generalConfig } from '../../config';
import User from '../../interfaces/user.interface';
import { IsStaff } from '../staff/staff.helpers';
import { IsPasswordCorrect } from './auth.helpers';
import Session from './auth.session.entity';

@Injectable()
export default class AuthService {
  /**
   * Creates an instance of AuthService.
   * @param {EntityManager} entityManager
   * @param {Repository<Session>} sessionRepository
   * @memberof AuthService
   */
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  /**
   * Authenticate user
   * @remarks Since we have no additional requirements to authenticate staff(admin, moderator)
   * Going to user this method to start their session as well
   * @param {string} email
   * @param {string} password
   * @param {boolean} [socialLogin=false] true if external logi
   * @returns Promise<false | User>
   * @memberof AuthService
   */
  public async authenticateUser(email: string, password: string, socialLogin = false) {
    const [account] = await this.entityManager.query(
      `SELECT * FROM (
        SELECT id, email, password, blocked, "emailVerified", "isDeleted", 'employer' as type FROM employer
        UNION
        SELECT id, email, password, blocked, "emailVerified", "isDeleted", 'creator' as type FROM creator
        UNION
        SELECT id, email, password, blocked, TRUE as "emailVerified", FALSE as "isDeleted", type FROM staff
      ) AS dataset WHERE email = $1 AND blocked = FALSE AND "isDeleted" = FALSE`,
      [email.toLowerCase()],
    );

    if (!account) {
      return false;
    }

    if (!socialLogin) {
      if (!account.password || !account.password.length) {
        return false;
      }

      if (!(await IsPasswordCorrect(password, account.password))) {
        return false;
      }
    }

    // Using services instead of direct select to be able to add serializers in the future
    const user = await this.findUserById(account.type, account.id);
    user.type = account.type;
    return user;
  }

  /**
   * Get session by token
   * @param {string} token
   * @returns {Promise<{user: User, session: any}>}
   * @memberof AuthService
   */
  public async getSession(token: string) {
    const [session] = await this.entityManager.query(
      `UPDATE "session"
        SET "validTill" = NOW() + INTERVAL '${generalConfig.sessionLifetime} second'
        WHERE "id" = $1 AND "validTill" > NOW()
      RETURNING *;`,
      [token],
    );

    if (!session || (session.creatorId === null && session.employerId === null && session.staffId === null)) {
      return null;
    }
    const type = ['staff', 'creator', 'employer'].filter(item => session[item + 'Id'] !== null)[0];
    const user = await this.findUserById(type, session[type + 'Id']);
    if (type !== 'staff') {
      user.type = type;
    }
    return { user, session };
  }

  /**
   * Start user session
   * @param {User} user Current user
   * @returns {Promise<Session>}
   * @memberof AuthService
   */
  public async startSession(user: User) {
    const type = IsStaff(user.type) ? 'staff' : user.type;
    const data = { id: uuidv4(), [type]: user };
    Object.assign(data, { validTill: () => `NOW() + INTERVAL '` + generalConfig.sessionLifetime + ` second'` });
    const session = this.sessionRepository.create(data);
    return this.sessionRepository.save(session);
  }

  /**
   * Finish session by id
   * @param {string} id Session id
   * @returns {Promise<DeleteResult>}
   * @memberof AuthService
   */
  public finishSession(id: string) {
    return this.sessionRepository.delete({ id });
  }
  /**
   * Finish session by id for concreate type of user
   * @param {number} id Session id
   * @param {string} type Type of user
   * @returns {Promise<any>}
   * @memberof AuthService
   */
  public finishSessionByUser(id: number, type: string) {
    return this.sessionRepository.query(`DELETE FROM session where "${type}Id" = $1`, [id]);
  }

  /**
   * Find user by id
   * @protected
   * @param {string} type Type of user
   * @param {number} id User id
   * @returns {Promise<User>} User
   * @memberof AuthService
   */
  protected findUserById(type: string, id: number): Promise<User> {
    const repositoryName = IsStaff(type) ? 'Staff' : _.startCase(type);
    return this.entityManager.getRepository<User>(repositoryName).findOne({ id });
  }
}
