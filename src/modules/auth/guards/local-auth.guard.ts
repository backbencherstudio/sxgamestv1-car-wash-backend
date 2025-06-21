import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context: ExecutionContext, status) {
    // You can throw an exception based on either "info" or "err" arguments
    const request = context.switchToHttp().getRequest();
    const { email, password, fcm_token } = request.body;

    if (err || !user) {
      if (!email) {
        throw new HttpException(
          { message: 'email not provided' },
          HttpStatus.OK,
        );
      } else if (!password) {
        throw new HttpException(
          { message: 'password not provided' },
          HttpStatus.OK,
        );
      } else if (!fcm_token) {
        throw new HttpException(
          { message: 'Device not Found' },
          HttpStatus.OK,
        );
      } else {
        throw err || new UnauthorizedException();
      }
    }
    
    // Add fcm_token to the user object so it can be accessed in the controller
    return {
      ...user,
      fcm_token: fcm_token
    };
  }
}
