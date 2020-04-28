import { ExecutionContext, NestInterceptor } from '@nestjs/common';
import { classToPlain } from 'class-transformer';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Make sure passwords and other private fields marked using @Exclude will never send
 * to the client
 * @export
 * @class UserResponseTransformer
 * @implements {NestInterceptor}
 */
export default class UserResponseTransformer implements NestInterceptor {
  intercept(context: ExecutionContext, call$: Observable<any>): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const permission = request.aclPermission || { filter: data => data };
    return call$.pipe(map(data => permission.filter(classToPlain(data))));
  }
}
