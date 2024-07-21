import mongoose, { Document } from 'mongoose';
import { app } from '../constants/constants';
import { AuthHelper } from '../helpers/auth.helper';
import { getEnumFromObject } from '../lib/utils';
import { UserRoles } from '../types';

export enum UserStatus {
  Enabled = 'enabled',
  Blocked = 'blocked',
  Pending = 'pending'
}

export enum AuthServices {
  Google = 'google',
  Local = 'local',
  Twitter = 'twitter',
  Facebook = 'facebook'
}

export interface IAuthServiceProfile extends Document {
  id: string;
  token: string;
  refreshToken: string;
  tokenSecret?: string;
  service: AuthServices;
}

export interface IUser extends Document {
  email: string;
  password?: string;
  profile?: IAuthServiceProfile;
  authServices: AuthServices[],
  token: string;
  requestedEmailVerification: boolean;
  emailVerified: boolean;
  lastLoggedInAt: string | Date;
  status: UserStatus;
  role: UserRoles;
}

export interface IMember extends IUser {
  forceUpdate: 'email' | 'password' | 'none';
}

export interface IAdmin extends IUser {
}

const Schema = mongoose.Schema;

const AuthServiceProfileSchema = new Schema<IAuthServiceProfile>({
  service: { type: String, enum: [...getEnumFromObject(AuthServices)], required: true },
  id: String,
  token: String, // accessToken
  tokenSecret: String,
  refreshToken: String
});

const UserSchemaDefinition = {
  email: { type: String, required: true, match: app.EMAIL_REGEX, trim: true, unique: true },
  password: { type: String, default: null },
  profile: { type: AuthServiceProfileSchema, default: null },
  authServices: [{ type: String, enum: [...getEnumFromObject(AuthServices)] }],
  token: { type: String, default: null },
  requestedEmailVerification: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  lastLoggedInAt: { type: Date, default: () => Date.now() },
  status: { type: String, enum: [...getEnumFromObject(UserStatus)], default: UserStatus.Pending },
};

const UserSchema = new Schema<IUser>(UserSchemaDefinition, { timestamps: true, discriminatorKey: 'role' });

UserSchema.pre('save', async function (next) {
  await AuthHelper.handleUserPassword(this, next);
});

const AdminSchema = new Schema({
});

const MemberSchema = new Schema({
  forceUpdate: { type: String, enum: ['email', 'password', 'none'], default: 'none' }
});

export const User = mongoose.model<IUser>('User', UserSchema);
export const Admin = User.discriminator<IAdmin>('Admin', AdminSchema);
export const Member = User.discriminator<IMember>('Member', MemberSchema);
