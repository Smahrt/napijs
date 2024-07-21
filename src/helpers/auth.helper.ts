import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
import { CallbackWithoutResultAndOptionalError } from 'mongoose';
import { vars } from '../config/variables';
import { app } from '../constants/constants';
import { responseCodes } from '../constants/response-codes';
import { responseMessages } from '../constants/response-messages';
import { IUser } from '../models/user';
import { ResourceOwners, ResourceRoles, UserPayload, UserRoles } from '../types';
import { CustomError } from './error.helper';
import { checkResourceOwnership } from './rbac.helper';

const SECRET: string = vars.JWT_SECRET;
const EXPIRES_IN: string = vars.JWT_EXPIRY;

export abstract class AuthHelper {
  private static async verifyResourceAccess(req: Request, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role === UserRoles.Admin || req.permissions.role === ResourceRoles.Guest) { // express access for admin or guests
        return next();
      }

      if (!req.permissions.role.includes(req.user?.role)) { // check if user has permissions
        return next(new CustomError(responseCodes.ERROR_FORBIDDEN, responseMessages.ERROR_FORBIDDEN, 403));
      }

      // check if user is owner of resource
      await checkResourceOwnership(req);

      return next(); // grant access

    } catch (error) {
      return next(error);
    }
  }

  public static verifyToken(token: string, options?: jwt.VerifyOptions): Promise<UserPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, SECRET, options, (err: jwt.VerifyErrors, decoded: any) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(decoded);
        }
      });
    });
  }

  private static async checkAccessToken(req: Request, next: NextFunction) {
    try {
      let token: any = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
      if (token.startsWith('Bearer ')) {
        // Remove Bearer from string
        token = token.slice(7, token.length);
      }

      if (token) {
        const decoded = await AuthHelper.verifyToken(token).catch((e: any) => {
          return next(new CustomError(responseCodes.ERROR_EXPIRED_TOKEN, responseMessages.ERROR_EXPIRED_TOKEN, 400, e));
        });
        if (decoded) {
          return decoded;
        }
      } else {
        if (req.permissions.role === ResourceRoles.Guest) { return; }
        return next(new CustomError(responseCodes.ERROR_MISSING_TOKEN, responseMessages.ERROR_MISSING_TOKEN, 400));
      }
    } catch (error) {
      if (req.permissions.role === ResourceRoles.Guest) { return; }
      return next(new CustomError(responseCodes.ERROR_MISSING_TOKEN, responseMessages.ERROR_MISSING_TOKEN, 400));
    }
  }

  /**
   * Checks the user's access token as well permissions to access the specified resource
   * @param {ResourceRoles} role User role allowed to access specified resource
   * @param {ResourceOwners} owner Specifies the ownership status for this resource. Defaults to `Everyone`
  */
  public static checkAccess(role: ResourceRoles, owner: ResourceOwners = ResourceOwners.Everyone) {
    // Verify resource access
    return (req: Request, res: Response, next: NextFunction) => {
      (async () => {
        // Verify JWT
        req.permissions = { role, owner }; // 1. assign permissions for this endpoint to req
        req.user = <any>await AuthHelper.checkAccessToken(req, next);
        await AuthHelper.verifyResourceAccess(req, next);
      })();
    };
  }

  public static generateAccessToken(user: any): Promise<string> {
    let payload = _.pick(user, ['_id', 'role']);
    return new Promise(async (resolve, reject) => {
      jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN },
        (err: any, token: string) => {
          if (err) { return reject(err); }

          return resolve(token);
        });
    });
  }

  public static hashPassword(password: string) {
    try {
      // generate a salt
      const salt: any = bcrypt.genSaltSync(app.SALT_WORK_FACTOR);

      // hash the password along with our new salt
      return bcrypt.hashSync(password, salt);
    } catch (error) {
      throw error;
    }
  }
  /**
 * Hashes a user's password and calls `next()`
 * @param {any} user User document
 * @param {NextFunction} next Express' next function
 */
  public static async handleUserPassword(
    user: IUser,
    next: CallbackWithoutResultAndOptionalError
  ) {
    // only hash the password if it has been modified (or is new)
    if (!user.isModified("password")) {
      return next();
    }

    // override the cleartext password with the hashed one
    user["password"] = this.hashPassword(user["password"]);

    return next();
  }

  /**
   * Compare hashed password with plain text password
   */
  public static async comparePassword(password: string, passToTest: string) {
    return await bcrypt.compare(passToTest, password)
      .catch(e => { throw new CustomError(responseCodes.ERROR_FAILED_AUTH, responseMessages.ERROR_FAILED_AUTH, 400, JSON.stringify(e)); });
  }

  public static compareToken(user: any, token: string) { return (new Promise(resolve => resolve(token === user.confirmationToken))); }

}
