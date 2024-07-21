import { AuthHelper, PaginationHelper } from '../../helpers';
import { HttpMethod, Route } from '../../helpers/route.helper';
import { ResourceOwners, ResourceRoles } from '../../types';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';

export const USER_URL = '/api/v1/users';

const userEndpoints: Route[] = [
  {
    path: `${USER_URL}/`,
    method: HttpMethod.GET,
    handler: [
      AuthHelper.checkAccess(ResourceRoles.Admin),
      PaginationHelper.addPageObject,
      UserController.getUsers,
    ]
  },
  {
    path: `${USER_URL}/:id`,
    method: HttpMethod.GET,
    handler: [
      AuthHelper.checkAccess(ResourceRoles.All),
      UserController.getSingleUser
    ]
  },
  {
    path: `${USER_URL}/all/search`,
    method: HttpMethod.GET,
    handler: [
      AuthHelper.checkAccess(ResourceRoles.All),
      PaginationHelper.addPageObject,
      UserController.searchUsers,
    ]
  },
  {
    path: `${USER_URL}/auth/me`,
    method: HttpMethod.GET,
    handler: [
      AuthHelper.checkAccess(ResourceRoles.Guest),
      UserController.getAuthUser
    ]
  },
  {
    path: `${USER_URL}/auth/social/:service/url`,
    method: HttpMethod.GET,
    handler: [
      AuthHelper.checkAccess(ResourceRoles.Guest),
      UserController.getSocialAuthUrl
    ]
  },
  {
    path: `${USER_URL}/`,
    method: HttpMethod.POST,
    handler: [
      UserValidation.validateCreateUser,
      UserController.createUser
    ]
  },
  {
    path: `${USER_URL}/auth/local`,
    method: HttpMethod.POST,
    handler: [
      UserValidation.validateLoginUser,
      UserController.loginUser
    ]
  },
  {
    path: `${USER_URL}/auth/social/:service`,
    method: HttpMethod.POST,
    handler: [
      UserValidation.validateSocialLoginUser,
      UserController.loginUserSocial
    ]
  },
  {
    path: `${USER_URL}/auth/forgot-password`,
    method: HttpMethod.POST,
    handler: [
      UserValidation.validateForgotPassword,
      UserController.forgotPassword
    ]
  },
  {
    path: `${USER_URL}/auth/change-password`,
    method: HttpMethod.POST,
    handler: [
      AuthHelper.checkAccess(ResourceRoles.All),
      UserValidation.validateChangePassword,
      UserController.changePassword
    ]
  },
  {
    path: `${USER_URL}/auth/reset-password`,
    method: HttpMethod.POST,
    handler: [
      UserValidation.validateResetPassword,
      UserController.resetPassword
    ]
  },
  {
    path: `${USER_URL}/verifications/request`,
    method: HttpMethod.POST,
    handler: [
      UserValidation.validateRequestVerification,
      UserController.requestVerification
    ]
  },
  {
    path: `${USER_URL}/verifications/confirm`,
    method: HttpMethod.POST,
    handler: [
      UserValidation.validateVerifyUser,
      UserController.verifyUser
    ]
  },
  {
    path: `${USER_URL}/:id`,
    method: HttpMethod.PUT,
    handler: [
      AuthHelper.checkAccess(ResourceRoles.All, ResourceOwners.Self),
      UserController.updateUser
    ]
  },
  {
    path: `${USER_URL}/:id`,
    method: HttpMethod.DELETE,
    handler: [
      AuthHelper.checkAccess(ResourceRoles.All, ResourceOwners.Self),
      UserController.deleteUser
    ]
  },
];

export default userEndpoints;
