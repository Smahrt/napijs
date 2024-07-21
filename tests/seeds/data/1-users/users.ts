import { AuthHelper } from '../../../../src/helpers';
import { getObjectId } from '../../../helpers';

const users = [
  {
    _id: getObjectId('test-user'),
    email: 'test-user@gmail.com',
    password: AuthHelper.hashPassword('test-useruserpassword'),
    emailVerified: true,
    status: 'enabled',
    role: 'Member'
  },
  {
    _id: getObjectId('test-user-fan'),
    email: 'test-user.fan@gmail.com',
    mobile: '+2349061234567',
    password: AuthHelper.hashPassword('test-userfanpassword'),
    emailVerified: true,
    status: 'enabled',
    role: 'Member'
  },
  {
    _id: getObjectId('admin'),
    email: 'admin@admin.co',
    phoneNumber: '+2349064444567',
    password: AuthHelper.hashPassword('adminpass'),
    role: 'Admin'
  }
];

module.exports = users;
