import { FilterQuery } from "mongoose";
import normalizeEmail from "normalize-email";
import { app } from "../../constants/constants";
import { responseCodes } from "../../constants/response-codes";
import { responseMessages } from "../../constants/response-messages";
import {
  AuthHelper,
  DbHelper,
  EmailHelper,
  FacebookHelper,
  GoogleHelper,
  TwitterHelper,
} from "../../helpers";
import { CustomError } from "../../helpers/error.helper";
import { PaginateQuery } from "../../helpers/pagination.helper";
import { logger } from "../../lib/logger";
import { generateRandomID } from "../../lib/utils";
import {
  AuthServices,
  IAuthServiceProfile,
  IMember,
  IUser,
  Member,
  User,
  UserStatus,
} from "../../models/user";
import { UserRepository } from "./user.repository";

/* Interfaces and Enums */
type AuthUserResponse = Pick<IUser, 'status' | 'token' | '_id'>;

interface AuthUserOptions {
  email: string;
  service?: AuthServices;
  password?: string;
  profile?: IAuthServiceProfile;
  token?: string;
  verifier?: string; // used for twitter auth
  reason?: "onboarding" | "social";
  forceUpdate?: IMember["forceUpdate"];
}

const USER_VERIFICATION_FIELDS = {
  status: UserStatus.Enabled,
  requestedEmailVerification: true,
  emailVerified: true,
};

export abstract class UserHandler {
  /**
   * Fetches a user by supplied property
   * @param prop
   * @param lean
   */
  public static async getUserByProperty(
    prop: FilterQuery<IUser>,
    lean?: boolean
  ): Promise<IUser> {
    return await (<any>User.findOne(prop)
      .lean(lean || false)
      .exec());
  }

  /**
   * Fetches a user by id
   * @param id
   */
  public static async getSingleUser(id: string): Promise<IUser | null> {
    const user = await UserRepository.findUserById(id).catch((e) => {
      // ignore errors
      logger.error(`Failed to fetch user. Error: ${e.toString()}`);
      return null;
    });
    return user;
  }

  /**
   * Generates onboarding email with auth token and sends to user
   * @param user User doc
   */
  public static async generateAndSendEmailToken(
    user: any,
    additionalData = {}
  ): Promise<IUser> {
    const emailData = {
      email: user.email,
      ...additionalData,
      token: generateRandomID(6, true),
    };

    user.token = emailData.token;
    user.requestedEmailVerification = true;

    const savedUser = await DbHelper.save(user).catch((err) => {
      throw err;
    });
    await EmailHelper.sendEmail(
      user.email,
      app.CONFIRM_ACCOUNT_SUBJECT,
      emailData,
      app.CONFIRM_ACCOUNT_TEMPLATE
    ).catch((e) => {
      throw e;
    });
    return savedUser;
  }

  /**
   * Fetches all users in the database and returns a `
   Promise ` that resolves
   * to an array of found docs or an empty array
   * @returns {Promise<IUser[]>} array of users
   */
  public static async getAllUsers(
    pageObj?: PaginateQuery,
    query?: { q?: string }
  ): Promise<IUser[]> {
    const q = query?.q;
    const users = await UserRepository.findAllUsers(pageObj, q).catch((e) =>
      logger.log("error", `Failed to fetch users. Error: ${e.toString()}`)
    );

    return Array.isArray(users) && users.length > 0 ? users : [];
  }

  /**
   * Creates a new user record on the database and returns a `Promise` that resolves to the created doc
   * @returns {IUser} user
   */
  public static async createUser(opts: AuthUserOptions): Promise<AuthUserResponse> {
    let normalizedEmail = this.normalizeEmailAddress(opts.email);

    const [existingUser] = await DbHelper.find(User, {
      email: normalizedEmail,
    }).catch((e) => {
      throw new CustomError(
        responseCodes.ERROR_TECHNICAL,
        responseMessages.ERROR_NOT_FOUND,
        500,
        e
      );
    });

    if (existingUser) {
      throw new CustomError(
        responseCodes.ERROR_ALREADY_EXISTS,
        responseMessages.resourceAlreadyExists("user"),
        409
      );
    }

    const verifyUserFields = {
      ...("social".includes(opts.reason) ? USER_VERIFICATION_FIELDS : {}),
    };

    const user = new Member({
      ...opts,
      email: normalizedEmail,
      ...verifyUserFields,
      authServices: [opts.service || AuthServices.Local],
      reason: null,
      forceUpdate: opts.forceUpdate,
    });

    const savedUser = await DbHelper.save(user).catch((err) => {
      throw new CustomError(
        responseCodes.ERROR_NOT_CREATED,
        responseMessages.ERROR_USER_NOT_CREATED,
        500,
        err
      );
    });

    if (opts.reason !== "social") {
      this.generateAndSendEmailToken(savedUser);
    }
    const { token, status, _id } = savedUser;
    return { token, status, _id };
  }

  public static async getSocialAuthUrl(service: AuthServices): Promise<string> {
    let res: { url: string };
    switch (service) {
      case AuthServices.Twitter:
        res = await TwitterHelper.getRequestToken();
        return res.url;

      case AuthServices.Facebook:
        res = await FacebookHelper.getAuthUrl();
        return res.url;
      default:
        throw new CustomError(
          responseCodes.ERROR_NOT_FOUND,
          responseMessages.ERROR_NOT_FOUND,
          404
        );
    }
  }

  /**
   * Logs in an authorized user
   * @returns {Promise<AuthUserResponse>} User doc
   * */
  public static async loginUser(
    service: AuthServices,
    opts: AuthUserOptions
  ): Promise<AuthUserResponse> {
    let user: any;
    let normalizedEmail: string;
    let authId: string;
    let forceUpdate: IMember["forceUpdate"] = "none";

    if (service !== AuthServices.Local) {
      // create user if user does not exist for social auth
      let authEmail: string;
      let accessToken: string;
      let refreshToken: string;

      if (service === AuthServices.Google) {
        const { email, id } = await GoogleHelper.getUserProfile(opts.token);
        authId = id;
        authEmail = email;
      }

      if (service === AuthServices.Twitter) {
        const {
          token,
          refreshToken: rt,
          id,
        } = await TwitterHelper.getUserProfile(opts.token);
        authId = id;
        accessToken = token;
        refreshToken = rt;
      }

      if (service === AuthServices.Facebook) {
        const { email, id, token } = await FacebookHelper.getUserProfile(
          opts.token
        );
        authId = id;
        authEmail = email;
        accessToken = token;
      }

      if (authId && !authEmail) {
        // create user with authId as email and send email to user to update email
        authEmail = `${authId}@${service}.com`;
        forceUpdate = "email";
      }

      normalizedEmail = this.normalizeEmailAddress(authEmail);

      user = await this.getUserByProperty({ email: normalizedEmail }).catch(
        (e) => {
          throw e;
        }
      );

      if (!user) {
        user = await this.createUser({
          email: normalizedEmail,
          service,
          reason: "social",
          forceUpdate,
          profile: {
            id: authId,
            service,
          } as any,
        });
      }

      // update user's access token
      if (accessToken && user) {
        await this.updateUser(user._id, {
          profile: { id: authId, token: accessToken, refreshToken, service },
        });
      }
    }

    if (service === AuthServices.Local) {
      // normalize gmail addresses
      normalizedEmail = this.normalizeEmailAddress(opts.email);

      // ? check if user exists using normalized email or the exact email typed in by user
      user = await this.getUserByProperty({
        $or: [{ email: opts.email }, { email: normalizedEmail }],
      }).catch((e) => {
        throw e;
      });

      if (!user) {
        throw new CustomError(
          responseCodes.ERROR_USER_NOT_FOUND,
          responseMessages.resourceNotFound("user"),
          404
        );
      }

      const isMatch = await AuthHelper.comparePassword(
        user["password"],
        opts.password
      ).catch((e) => {
        throw e;
      });

      if (!isMatch) {
        throw new CustomError(
          responseCodes.ERROR_FAILED_AUTH,
          responseMessages.ERROR_FAILED_AUTH,
          400,
          { input: opts.password }
        );
      }
    }

    if (user.status === UserStatus.Blocked) {
      throw new CustomError(
        responseCodes.ERROR_USER_BLOCKED,
        responseMessages.ERROR_USER_BLOCKED,
        400
      );
    }

    const updatedUser = await this.updateUser(user._id, {
      authServices: Array.from(
        new Set([...(user.authServices || []), service])
      ),
      lastLoggedInAt: new Date(Date.now()),
      ...(service !== AuthServices.Local ? USER_VERIFICATION_FIELDS : {}),
    });

    const token = await AuthHelper.generateAccessToken(updatedUser).catch(
      (e) => {
        throw new CustomError(
          responseCodes.ERROR_TECHNICAL,
          responseCodes.ERROR_FAILED_AUTH,
          500,
          e
        );
      }
    );
    return {
      _id: updatedUser._id,
      token,
      status: updatedUser.status,
    };
  }

  /**
   *  Sends a password reset email to the supplied email address if it exists in the DB
   *  */
  public static async forgotPassword(email: string): Promise<{}> {
    let normalizedEmail = this.normalizeEmailAddress(email);

    // ? check if user exists using normalized email or the exact email typed in by user
    const user = await this.getUserByProperty({
      $or: [{ email }, { email: normalizedEmail }],
    }).catch((e) => {
      throw e;
    });

    if (!user) {
      throw new CustomError(
        responseCodes.ERROR_NOT_FOUND,
        responseMessages.resourceNotFound("a user with that email"),
        404
      );
    }

    const token = `${generateRandomID(6, true)}`;
    await DbHelper.save(user);
    const data = { token };
    await EmailHelper.sendEmail(
      email,
      app.FORGOT_PASSWORD_SUBJECT,
      data,
      app.FORGOT_PASSWORD_TEMPLATE
    );

    const { _id } = user;

    return { _id, token: user.token } as any;
  }

  /**
   * Resets/Changes a user's password
   * Omit the `email` param to reset password
   **/
  public static async resetPassword(
    email: string,
    token: string,
    oldPassword: string,
    newPassword: string
  ): Promise<IUser> {
    let normalizedEmail = this.normalizeEmailAddress(email);

    // ? check if user exists using normalized email or the exact email typed in by user
    const user = await this.getUserByProperty(
      token ? { token } : { $or: [{ email }, { email: normalizedEmail }] }
    ).catch((e) => {
      throw e;
    });

    if (!user) {
      throw new CustomError(
        responseCodes.ERROR_NOT_FOUND,
        responseMessages.resourceNotFound("user"),
        404
      );
    }

    if (email) {
      const isMatch = await AuthHelper.comparePassword(
        user["password"],
        oldPassword
      ).catch((e) => {
        throw e;
      });

      if (!isMatch) {
        throw new CustomError(
          responseCodes.ERROR_FAILED_AUTH,
          responseMessages.ERROR_FAILED_AUTH,
          400
        );
      }
    }

    user["password"] = newPassword;

    const newUser = await DbHelper.save(user).catch((e) => {
      throw new CustomError(
        responseCodes.ERROR_TECHNICAL,
        responseMessages.errorSaving("user"),
        responseCodes.DEFAULT_ERROR_STATUS_CODE,
        e
      );
    });
    const { _id } = newUser;
    return { _id, email: newUser.email } as any;
  }

  private static normalizeEmailAddress(email?: string) {
    return email ? normalizeEmail(email) : undefined;
  }

  /**
   * Request verification email with 6-digit code for user
   * @param email User's email
   * @param resend if set to `true`, resends the verification email regardless of prev status
   */
  public static async requestEmailVerification(email: string, resend = false) {
    let normalizedEmail = this.normalizeEmailAddress(email);

    // ? check if user exists using normalized email or the exact email typed in by user
    const user = await this.getUserByProperty({
      $or: [{ email }, { email: normalizedEmail }],
    }).catch((e) => {
      throw e;
    });

    if (!user) {
      throw new CustomError(
        responseCodes.ERROR_NOT_FOUND,
        responseMessages.resourceNotFound("user"),
        404
      );
    }

    if (user.emailVerified) {
      throw new CustomError(
        responseCodes.ERROR_ALREADY_VERIFIED,
        responseMessages.ERROR_ALREADY_VERIFIED,
        400
      );
    }

    if (resend || !user.requestedEmailVerification) {
      const savedUser: any = await this.generateAndSendEmailToken(user).catch(
        (e) => {
          throw new CustomError(
            responseCodes.ERROR_NOT_CREATED,
            responseMessages.ERROR_USER_NOT_CREATED,
            500,
            e
          );
        }
      );
      const { _id, requestedEmailVerification, token } = savedUser;
      return { _id, requestedEmailVerification, token };
    } else {
      throw new CustomError(
        responseCodes.ERROR_DUPLICATE_VERIFY,
        responseMessages.ERROR_DUPLICATE_VERIFY,
        422
      );
    }
  }

  public static async verifyUserByEmailToken(token: string): Promise<AuthUserResponse & { emailVerified: boolean; }> {
    const user: any = await this.getUserByProperty({ token }).catch((e) => {
      throw e;
    });

    if (!user) {
      throw new CustomError(
        responseCodes.ERROR_USER_NOT_FOUND,
        responseMessages.resourceNotFound("user"),
        404
      );
    }

    if (user.emailVerified) {
      throw new CustomError(
        responseCodes.ERROR_ALREADY_VERIFIED,
        responseMessages.ERROR_ALREADY_VERIFIED,
        400
      );
    }

    user.status = UserStatus.Enabled;
    user.emailVerified = true;

    const savedUser: any = await DbHelper.save(user).catch((e) => {
      throw new CustomError(
        responseCodes.ERROR_TECHNICAL,
        responseMessages.errorSaving("user"),
        responseCodes.DEFAULT_ERROR_STATUS_CODE,
        e
      );
    });

    const t = await AuthHelper.generateAccessToken(
      user
    ); /* Generate new tokens for auth but dont save to DB */

    const { emailVerified, status, _id } = savedUser;
    return { emailVerified, status, token: t, _id };
  }

  /**
   * Updates all/one of the fields of the specified user with the `data` provided if the doc exists
   * @param {string} id unique identifier of the user
   * @param {any} data an object containing fields of properties to modify
   * @returns {Promise<IUser>} updated user
   */
  public static async updateUser(id: string, data: any): Promise<IUser> {
    const skipUpdate = ["createdAt", "updatedAt"];

    const existingUser = await DbHelper.findOne(User, id).catch((e) => {
      throw new CustomError(
        responseCodes.ERROR_NOT_FOUND,
        responseMessages.resourceNotFound("user"),
        500,
        e
      );
    });

    const updatedUser = await DbHelper.update(
      existingUser,
      data,
      skipUpdate
    ).catch((e) => {
      throw new CustomError(
        responseCodes.ERROR_FAILED_UPDATE,
        responseMessages.ERROR_FAILED_UPDATE,
        500,
        e
      );
    });
    return updatedUser;
  }

  /**
   * Deletes the specified user provided it exists
   * @param {string} id unique identifier of the user
   * @returns deleted user
   */
  public static async deleteUser(id: string): Promise<IUser> {
    return await DbHelper.findAndDelete(User, { _id: id }).catch((e) => {
      throw new CustomError(
        responseCodes.ERROR_TECHNICAL,
        responseMessages.GENERIC,
        500,
        e
      );
    });
  }
}
