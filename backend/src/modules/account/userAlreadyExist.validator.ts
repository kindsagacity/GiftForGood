import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import UserService from './user.service';

/**
 * Validator class that check user is exists
 * @export
 * @class UserAlreadyExist
 * @implements {ValidatorConstraintInterface}
 */
@ValidatorConstraint({ async: true })
@Injectable()
export class UserAlreadyExist implements ValidatorConstraintInterface {
  constructor(private readonly userService: UserService) {}

  validate(value: string, args: ValidationArguments) {
    const field = args.constraints[0] || 'email';
    let id: number;
    if (args.object.hasOwnProperty('id')) {
      // tslint:disable-next-line:no-string-literal
      id = args.object['id'] as number;
    }
    return this.userService.GetUserBy(value, field).then(account => {
      if (!id) {
        return !account;
      }

      if (id && account) {
        return id === account.id;
      }

      return true;
    });
  }
}

/**
 * Validator helper function
 * @export
 * @param {string} field
 * @param {ValidationOptions} [validationOptions]
 * @returns {Function}
 */
export default function IsUserAlreadyExist(field: string, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [field],
      validator: UserAlreadyExist,
    });
  };
}
