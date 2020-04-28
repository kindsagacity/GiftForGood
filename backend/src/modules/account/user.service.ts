import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import User from '../../interfaces/user.interface';
import { GetUserByIdQuery, GetUserQuery } from './account.helpers';

/**
 * There are a lot of functionality in account service that may be reused in other modules and cause a circular
 * dependencies. To avoid them let's move user neutral methods to own service
 */
export default class UserService {
  constructor(@InjectEntityManager() private readonly entityManager: EntityManager) {}

  public async GetUserByEmail(value: string) {
    return await this.GetUserBy(value);
  }

  public async GetUserBy(value: string, field: string = 'email'): Promise<User> {
    const [account] = await this.entityManager.query(GetUserQuery(field), [value.toLowerCase()]);
    return account;
  }

  public async GetUserByType(value: string, type?: string): Promise<User> {
    const [account] = await this.entityManager.query(GetUserByIdQuery(value, type), [value.toLowerCase(), type]);
    return account;
  }
}
