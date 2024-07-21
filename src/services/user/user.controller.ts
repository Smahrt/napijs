import { UserHandler } from './user.handler';
import { NextFunction, Request, Response } from 'express';
import { ResponseHelper } from '../../helpers';
import { VerificationType } from '../../constants/constants';
import { AuthServices, IUser } from '../../models/user';

const sanitizeUser = (user: IUser): IUser => {
  const sanitizedUser = JSON.parse(JSON.stringify(user));
  delete sanitizedUser['password'];
  delete sanitizedUser['profile'];
  delete sanitizedUser['requestedEmailVerification'];
  delete sanitizedUser['emailVerified'];
  delete sanitizedUser['authServices'];
  delete sanitizedUser['forceUpdate'];
  delete sanitizedUser['email'];
  delete sanitizedUser['token'];
  delete sanitizedUser['lastLoggedInAt'];
  return sanitizedUser as IUser;
}
export abstract class UserController {
  public static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UserHandler.getAllUsers(req.page);
      return ResponseHelper.sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  }

  public static async searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UserHandler.getAllUsers(req.page, req.query);
      return ResponseHelper.sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  }

  public static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserHandler.createUser(req.body);
      return ResponseHelper.sendSuccess(res, user, 'Your account has been created!');
    } catch (error) {
      next(error);
    }
  }

  public static async loginUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserHandler.loginUser(AuthServices.Local, req.body);
      return ResponseHelper.sendSuccess(res, user, 'You are logged in!');
    } catch (error) {
      next(error);
    }
  }

  public static async getSingleUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UserHandler.getSingleUser(id);
      return ResponseHelper.sendSuccess(res, sanitizeUser(user));
    } catch (error) {
      next(error);
    }
  }

  public static async getAuthUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { return ResponseHelper.sendSuccess(res); }
      const user = await UserHandler.getSingleUser(req.user._id);
      return ResponseHelper.sendSuccess(res, sanitizeUser(user));
    } catch (error) {
      next(error);
    }
  }

  public static async getSocialAuthUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { service } = req.params;
      const url = await UserHandler.getSocialAuthUrl(service as AuthServices);
      return ResponseHelper.sendSuccess(res, url);
    } catch (error) {
      next(error);
    }
  }

  public static async loginUserSocial(req: Request, res: Response, next: NextFunction) {
    try {
      const { service } = req.params;
      const user = await UserHandler.loginUser(service as AuthServices, req.body);
      return ResponseHelper.sendSuccess(res, user, 'You are logged in!');
    } catch (error) {
      next(error);
    }
  }

  public static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserHandler.forgotPassword(req.body.email);
      return ResponseHelper.sendSuccess(res, user, 'An email has been sent to your supplied address');
    } catch (error) {
      next(error);
    }
  }

  public static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      const user = await UserHandler.resetPassword(null, token, null, newPassword);
      return ResponseHelper.sendSuccess(res, user, 'Your password has been reset. You can log in again.');
    } catch (error) {
      next(error);
    }
  }

  public static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, newPassword, oldPassword } = req.body;
      const user = await UserHandler.resetPassword(email, null, oldPassword, newPassword);
      return ResponseHelper.sendSuccess(res, sanitizeUser(user), 'Your password has been updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sends a verification email to verify a user via email or OTP to verify
   *  a user via phone number
   */
  public static async requestVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const { type, resend } = req.query as { type: VerificationType; resend?: '1' | string; };

      const requestVerificationMap = {
        [VerificationType.Email]: (email: string, resend: boolean) => UserHandler.requestEmailVerification(email, resend)
      }

      const requestVerification = requestVerificationMap[type];

      const user = await requestVerification(email, resend === '1');

      return ResponseHelper.sendSuccess(res, user, 'A verification email has been sent to your address');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirms a new user's registration via email confirmation token
   */
  public static async verifyUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      const { type } = req.query as { type: VerificationType };

      const verifyMethodMap = {
        [VerificationType.Email]: (token: string) => UserHandler.verifyUserByEmailToken(token),
      };

      const verify = verifyMethodMap[type];

      const user = await verify(token);

      return ResponseHelper.sendSuccess(res, user, 'Your account has been verified!');
    } catch (error) {
      next(error);
    }
  }

  public static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UserHandler.updateUser(id === 'me' ? req.user._id : id, req.body);
      return ResponseHelper.sendSuccess(res, sanitizeUser(user), 'Changes saved!');
    } catch (error) {
      next(error);
    }
  }

  public static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UserHandler.deleteUser(id);
      return ResponseHelper.sendSuccess(res, sanitizeUser(user), 'User has been removed successfully!');
    } catch (error) {
      next(error);
    }
  }
}
