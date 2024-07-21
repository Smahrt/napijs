import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import { ValidationHelper } from '../../helpers/validation.helper';

export abstract class UserValidation {
  /**
   * Validate Request Verification
   */
  public static async validateRequestVerification(req: Request, res: Response, next: NextFunction) {
    const bodySchema = Joi.object().keys({
      email: Joi.string().email().required()
    });

    const querySchema = Joi.object().keys({
      type: Joi.string().required().pattern(/email/),
      resend: Joi.string().optional().max(1).equal('1')
    });

    await Promise.all([ValidationHelper.validate(req.body, bodySchema), ValidationHelper.validate(req.query, querySchema)]).catch(e => next(e));
    return next();
  }


  /**
   * Validate Verify User
   */
  public static async validateVerifyUser(req: Request, res: Response, next: NextFunction) {
    const body: any = { token: Joi.string().required().length(6) };

    const bodySchema = Joi.object().keys(body);

    const querySchema = Joi.object().keys({
      type: Joi.string().required().pattern(/email/)
    });

    await Promise.all([ValidationHelper.validate(req.body, bodySchema), ValidationHelper.validate(req.query, querySchema)]).catch(e => next(e));
    return next();
  }

  /**
   * Validate Create User
   */
  public static async validateCreateUser(req: Request, res: Response, next: NextFunction) {
    const bodySchema = Joi.object().keys({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required()
    });

    await ValidationHelper.validate(req.body, bodySchema).catch(e => next(e));
    return next();
  }

  /**
   * Validate Login User
   */
  public static async validateLoginUser(req: Request, res: Response, next: NextFunction) {
    const bodySchema = Joi.object().keys({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required()
    });

    await ValidationHelper.validate(req.body, bodySchema).catch(e => next(e));
    return next();
  }

  /**
   * Validate Social Login User
   */
  public static async validateSocialLoginUser(req: Request, res: Response, next: NextFunction) {
    const bodySchema = Joi.object().keys({
      token: Joi.string().required(),
    });

    await ValidationHelper.validate(req.body, bodySchema).catch(e => next(e));
    return next();
  }

  /**
   * Validate Forgot Password
   */
  public static async validateForgotPassword(req: Request, res: Response, next: NextFunction) {
    const bodySchema = Joi.object().keys({
      email: Joi.string().email().required()
    });

    await ValidationHelper.validate(req.body, bodySchema).catch(e => next(e));
    return next();
  }

  /**
   * Validate Reset Password
   */
  public static async validateResetPassword(req: Request, res: Response, next: NextFunction) {
    const bodySchema = Joi.object().keys({
      token: Joi.string().required(),
      newPassword: Joi.string().required()
    });

    await ValidationHelper.validate(req.body, bodySchema).catch(e => next(e));
    return next();
  }

  /**
   * Validate Change Password
   */
  public static async validateChangePassword(req: Request, res: Response, next: NextFunction) {
    const bodySchema = Joi.object().keys({
      email: Joi.string().email().required(),
      oldPassword: Joi.string().required(),
      newPassword: Joi.string().required()
    });

    await ValidationHelper.validate(req.body, bodySchema).catch(e => next(e));
    return next();
  }
}
