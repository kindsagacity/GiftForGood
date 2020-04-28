import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import UserService from './user.service';
import { VALID_PASSWORD_RE } from './account.definitions';

@ValidatorConstraint({ async: true })
@Injectable()
export class CheckCurrentPassword implements ValidatorConstraintInterface {
  constructor(private readonly userService: UserService) {}

  validate(value: string, args: ValidationArguments) {
    const userType = args.constraints[0];

    // tslint:disable-next-line:no-string-literal
    const id = String(args.object['id']);
    // tslint:disable-next-line:no-string-literal
    const password = args.object['password'];
    // tslint:disable-next-line:no-string-literal
    const email = args.object['email'] || args.object['workEmail'];
    return this.userService.GetUserByType(id, userType).then(account => {
      if (!account) {
        return true;
      }

      // if (account.socialAccount && !account.password && password && !email) {
      if (account.socialAccount && password && !email) {
        return true;
      }
      if (VALID_PASSWORD_RE.test(value) && value.length >= 6 && value.length <= 50) {
        return true;
      }

      return false;
    });
  }
}

export default function ValidateCurrentPassword(userType: string, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      constraints: [userType],
      options: validationOptions,
      validator: CheckCurrentPassword,
    });
  };
}
