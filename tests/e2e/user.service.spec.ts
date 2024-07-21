import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon, { SinonStub } from 'sinon';
import app from '../../src/app/app';
import { responseMessages } from '../../src/constants/response-messages';
import { FacebookHelper, GoogleHelper, ResponseHelper, TwitterHelper } from '../../src/helpers';
import { generateRandomID } from '../../src/lib/utils';
import {
  TEST_TOKEN,
  TEST_TOKEN_ADMIN
} from '../config.spec';
import { getObjectId } from '../helpers';
import { expectValidationError } from '../methods';
import { Response } from 'express';

chai.use(chaiHttp);
const { expect } = chai;

describe('User Service', () => {
  const path = '/api/v1/users';
  let id: string, token: string, accessToken: string;

  const TEST_USER_DATA = {
    email: 'demo.hello@googlemail.com',
    password: 'demopass',
  }

  describe(`GET ${path} List all users`, () => {
    it('should list all users', done => {
      chai
        .request(app)
        .get(path)
        .set({ 'Authorization': TEST_TOKEN_ADMIN })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.eq('success');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).to.have.length.above(0);
          done();
        });
    });

    it('should list all users with pagination', done => {
      chai
        .request(app)
        .get(`${path}?itemsPage=1&itemsPerPage=12`)
        .set({ 'Authorization': TEST_TOKEN_ADMIN })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.eq('success');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).to.have.length.above(0);
          expect(res.body.meta).to.have.property('items');
          expect(res.body.meta).to.have.property('itemsPerPage');
          expect(res.body.meta).to.have.property('page');
          expect(res.body.meta).to.have.property('pages');
          done();
        });
    });
  });

  describe(`POST ${path} Signup User`, () => {
    it('should create account for user', done => {
      chai
        .request(app)
        .post(path)
        .send(TEST_USER_DATA)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.eq('success');
          expect(res.body.data).to.have.property('status');
          expect(res.body.data).to.have.property('token');

          id = res.body.data._id; // store id for further tests
          accessToken = res.body.data.token; // store refresh token for further tests
          done();
        });
    });

    it('should not create user with wrong/missing details', done => {
      chai
        .request(app)
        .post(path)
        .send({})
        .end((err, res) => {
          expectValidationError(res, expect);

          done();
        });
    });

    it('should not create user that already exists', done => {
      chai
        .request(app)
        .post(path)
        .send(TEST_USER_DATA)
        .end((err, res) => {
          expect(res).to.have.status(409);
          expect(res.body.status).to.eq('error');
          expect(res.body.message).to.eq(responseMessages.resourceAlreadyExists('user'));
          done();
        });
    });
  });

  describe(`GET ${path}/all/search Search Users`, () => {
    it('should search users', done => {
      chai
        .request(app)
        .get(`${path}/all/search?q=dem&itemsPage=1&itemsPerPage=12`)
        .set({ 'Authorization': TEST_TOKEN_ADMIN })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.eq('success');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).to.have.length.above(0);
          expect(res.body.meta).to.have.property('items');
          expect(res.body.meta).to.have.property('itemsPerPage');
          expect(res.body.meta).to.have.property('page');
          expect(res.body.meta).to.have.property('pages');
          done();
        });
    });
  });

  describe(`GET ${path}/auth/me Get authenticated user`, () => {
    it('should fetch auth user', done => {
      chai
        .request(app)
        .get(`${path}/auth/me`)
        .set({ 'Authorization': TEST_TOKEN })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.eq('success');
          expect(res.body.data).to.have.property('status');
          expect(res.body.data).to.have.property('_id', getObjectId('test-user').toString());
          done();
        });
    });

    it('should fetch auth user', done => {
      chai
        .request(app)
        .get(`${path}/auth/me`) // no token supplied
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.eq('success');
          expect(res.body.data).to.equal(null);
          done();
        });
    });
  });

  describe(`GET ${path}/:id Get single user`, () => {
    it('should fetch single user', done => {
      chai
        .request(app)
        .get(`${path}/${id}`)
        .set({ 'Authorization': TEST_TOKEN })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.eq('success');
          expect(res.body.data).to.have.property('status');
          expect(res.body.data).to.have.property('_id', id);
          done();
        });
    });
  });

  describe(`GET ${path}/auth/social/:service/url Get social auth URL`, () => {
    it('should fetch Twitter OAuth URL', done => {
      chai
        .request(app)
        .get(`${path}/auth/social/twitter/url`)
        .set({ 'Authorization': TEST_TOKEN })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.eq('success');
          expect(res.body.data).to.be.a('string');
          expect(res.body.data.startsWith('https')).to.equal(true);
          done();
        });
    });
    it('should fetch Facebook OAuth URL', done => {
      chai
        .request(app)
        .get(`${path}/auth/social/facebook/url`)
        .set({ 'Authorization': TEST_TOKEN })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.eq('success');
          expect(res.body.data).to.be.a('string');
          expect(res.body.data.startsWith('https')).to.equal(true);
          done();
        });
    });
  });

  describe(`User Controller error handling`, () => {
    // mock ResponseHelper.sendSuccess to throw an error to test error handling in controller methods
    let sendSuccessResponseStub: SinonStub<[res: Response, data?: any, message?: string], ReturnType<typeof ResponseHelper['sendSuccess']>>;
    before(() => {
      sendSuccessResponseStub = sinon.stub(ResponseHelper, 'sendSuccess').callsFake((res, data, message) => {
        throw new Error('something happened');
      });
    });

    it('should throw error while listing all users', done => {
      chai
        .request(app)
        .get(path)
        .set({ 'Authorization': TEST_TOKEN_ADMIN })
        .end((err, res) => {
          expect(res).to.have.status(500);
          expect(res.body.status).to.eq('error');
          done();
        });
    });

    it('should throw error while searching users', done => {
      chai
        .request(app)
        .get(`${path}/all/search?q=dem&itemsPage=1&itemsPerPage=12`)
        .set({ 'Authorization': TEST_TOKEN_ADMIN })
        .end((err, res) => {
          expect(res).to.have.status(500);
          expect(res.body.status).to.eq('error');
          done();
        });
    });

    it('should throw error while fetching single user', done => {
      chai
        .request(app)
        .get(`${path}/${id}`)
        .set({ 'Authorization': TEST_TOKEN_ADMIN })
        .end((err, res) => {
          expect(res).to.have.status(500);
          expect(res.body.status).to.eq('error');
          done();
        });
    });

    it('should throw error while fetching auth user', done => {
      chai
        .request(app)
        .get(`${path}/auth/me`)
        .set({ 'Authorization': TEST_TOKEN_ADMIN })
        .end((err, res) => {
          expect(res).to.have.status(500);
          expect(res.body.status).to.eq('error');
          done();
        });
    });

    it('should throw error while fetching social auth URL', done => {
      chai
        .request(app)
        .get(`${path}/auth/social/twitter/url`)
        .set({ 'Authorization': TEST_TOKEN_ADMIN })
        .end((err, res) => {
          expect(res).to.have.status(500);
          expect(res.body.status).to.eq('error');
          done();
        });
    });

    it('should throw error while logging in user via social', done => {
      chai
        .request(app)
        .post(`${path}/auth/social/google`)
        .send({ email: TEST_USER_DATA.email, token: '4/P7q7W91a-oMsCeLvIaQm6bTrgtp7&' })
        .set({ 'Authorization': TEST_TOKEN_ADMIN })
        .end((err, res) => {
          expect(res).to.have.status(500);
          expect(res.body.status).to.eq('error');
          done();
        });
    });

    it('should throw error while deleting user', done => {
      chai
        .request(app)
        .delete(`${path}/malformed-id`)
        .set({ 'Authorization': TEST_TOKEN_ADMIN })
        .end((err, res) => {
          expect(res).to.have.status(500);
          expect(res.body.status).to.eq('error');
          done();
        });
    });

    // restore ResponseHelper.sendSuccess
    after(() => {
      if (!sendSuccessResponseStub) return;
      sendSuccessResponseStub.restore();
    })
  })

  describe(`User Verification`, () => {
    let verifyToken: string;
    describe(`POST ${path}/verifications/request Request Email Verification`, () => {
      it('should throw an error if verification email has been sent already', done => {
        chai
          .request(app)
          .post(`${path}/verifications/request?type=email`)
          .set({ 'Authorization': accessToken })
          .send({ email: TEST_USER_DATA.email })
          .end((err, res) => {
            expect(res).to.have.status(422);
            expect(res.body.status).to.eq('error');
            expect(res.body.message).to.eq(responseMessages.ERROR_DUPLICATE_VERIFY);
            done();
          });
      });

      it('should throw an error if params are invalid or empty', done => {
        chai
          .request(app)
          .post(`${path}/verifications/request?type=email`)
          .set({ 'Authorization': accessToken })
          .send({}) // no email supplied
          .end((err, res) => {
            expectValidationError(res, expect);
            done();
          });
      });

      it('should throw an error if email is not found', done => {
        chai
          .request(app)
          .post(`${path}/verifications/request?type=email`)
          .set({ 'Authorization': accessToken })
          .send({ email: 'fake@email.com' })
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.status).to.eq('error');
            expect(res.body.message).to.eq(responseMessages.resourceNotFound('user'));
            done();
          });
      });

      it('should throw an error if email is already verified', done => {
        chai
          .request(app)
          .post(`${path}/verifications/request?type=email`)
          .set({ 'Authorization': accessToken })
          .send({ email: TEST_USER_DATA.email })
          .end((err, res) => {
            expect(res).to.have.status(422);
            expect(res.body.status).to.eq('error');
            expect(res.body.message).to.eq(responseMessages.ERROR_DUPLICATE_VERIFY);
            done();
          });
      });

      it('should force a resend of the verification code', done => {
        chai
          .request(app)
          .post(`${path}/verifications/request?type=email&resend=1`)
          .set({ 'Authorization': accessToken })
          .send({ email: TEST_USER_DATA.email })
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.status).to.eq('success');
            expect(res.body.data).to.have.property('_id');
            expect(res.body.data).to.have.property('requestedEmailVerification', true);

            verifyToken = res.body.data.token; // for use later in the tests

            done();
          });
      });
    });

    describe(`POST ${path}/verifications/confirm Verify Email`, () => {

      it('should verify user via email token', done => {
        chai
          .request(app)
          .post(`${path}/verifications/confirm?type=email`)
          .send({ token: verifyToken })
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.status).to.eq('success');
            expect(res.body.data).to.have.property('status', 'enabled');
            expect(res.body.data).to.have.property('emailVerified', true);
            expect(res.body.data).to.have.property('token');

            accessToken = res.body.data.token; // store refresh token for further tests

            done();
          });
      });

      it('should throw an error if email is already verified', done => {
        chai
          .request(app)
          .post(`${path}/verifications/confirm?type=email`)
          .send({ token: verifyToken })
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.status).to.eq('error');
            expect(res.body.message).to.eq(responseMessages.ERROR_ALREADY_VERIFIED);
            done();
          });
      });

      it('should throw an error if params are invalid or empty', done => {
        chai
          .request(app)
          .post(`${path}/verifications/confirm?type=email`)
          .send({}) // no email supplied
          .end((err, res) => {
            expectValidationError(res, expect);
            done();
          });
      });

      it('should throw an error if user is not found', done => {
        chai
          .request(app)
          .post(`${path}/verifications/confirm?type=email`)
          .send({ token: '001354' })
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.status).to.eq('error');
            expect(res.body.message).to.eq(responseMessages.resourceNotFound('user'));
            done();
          });
      });

    });
  });

  describe(`POST ${path}/auth/local Login User`, () => {
    it('should log in authorized user', done => {
      chai
        .request(app)
        .post(`${path}/auth/local`)
        .send(TEST_USER_DATA)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.eq('success');
          expect(res.body.data).to.have.property('_id');
          expect(res.body.data).to.have.property('status');
          expect(res.body.data).to.have.property('token');
          done();
        });
    });

    it('should throw not found error if user has not signed up', done => {
      chai
        .request(app)
        .post(`${path}/auth/local`)
        .send({ email: 'userx@xmen.com', password: 'somestuff' })
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body.status).to.eq('error');
          expect(res.body.message).to.eq(responseMessages.resourceNotFound('user'));
          done();
        });
    });

    it('should throw unauthorized error for invalid details', done => {
      chai
        .request(app)
        .post(`${path}/auth/local`)
        .send({ email: TEST_USER_DATA.email, password: 'somestuff' })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.eq('error');
          expect(res.body.message).to.eq(responseMessages.ERROR_FAILED_AUTH);
          done();
        });
    });
  });

  describe(`POST ${path}/auth/social/:service Social Login User`, () => {
    // mock [service].getUserProfile to return a valid user profile
    let getUserProfileGoogleStub: SinonStub<string[], ReturnType<typeof GoogleHelper['getUserProfile']>>,
      getUserProfileFacebookStub: SinonStub<string[], ReturnType<typeof FacebookHelper['getUserProfile']>>,
      getUserProfileTwitterStub: SinonStub<[token: string], ReturnType<typeof TwitterHelper['getUserProfile']>>;
    before(() => {
      getUserProfileGoogleStub = sinon.stub(GoogleHelper, 'getUserProfile').callsFake(() => (Promise.resolve({
        id: '1234567890',
        email: TEST_USER_DATA.email,
        token: { access_token: '', refresh_token: '' },
        name: 'John Doe',
        picture: 'https://lh3.goog',
      })));

      getUserProfileTwitterStub = sinon.stub(TwitterHelper, 'getUserProfile').callsFake(() => (Promise.resolve({
        id: '1234567890',
        token: 'xxx-xxxxxxxx-xxxx',
        refreshToken: 'xxx-xxxxx-xxxxx',
      })));

      getUserProfileFacebookStub = sinon.stub(FacebookHelper, 'getUserProfile').callsFake(() => (Promise.resolve({
        id: '1234567890',
        email: TEST_USER_DATA.email,
        token: '',
      })));
    });

    it('should log in already existing user via google auth', done => {
      chai
        .request(app)
        .post(`${path}/auth/social/google`)
        .send({ email: TEST_USER_DATA.email, token: '4/P7q7W91a-oMsCeLvIaQm6bTrgtp7&' })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.eq('success');
          expect(res.body.data).to.have.property('status');
          expect(res.body.data).to.have.property('token');
          done();
        });
    });

    it('should log in already existing user via twitter auth', done => {
      chai
        .request(app)
        .post(`${path}/auth/social/twitter`)
        .send({ email: TEST_USER_DATA.email, token: '4/P7q7W91a-oMsCeLvIaQm6bTrgtp7&' })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.eq('success');
          expect(res.body.data).to.have.property('status');
          expect(res.body.data).to.have.property('token');
          done();
        });
    });

    it('should log in already existing user via facebook auth', done => {
      chai
        .request(app)
        .post(`${path}/auth/social/facebook`)
        .send({ email: TEST_USER_DATA.email, token: '4/P7q7W91a-oMsCeLvIaQm6bTrgtp7&' })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.eq('success');
          expect(res.body.data).to.have.property('status');
          expect(res.body.data).to.have.property('token');
          done();
        });
    });

    it('should not create new user if token is not specified', done => {
      chai
        .request(app)
        .post(`${path}/auth/social/google`)
        .send({}) // token not specified
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.eq('error');
          expect(res.body.message).to.eq(responseMessages.ERROR_INVALID_PARAMS);
          done();
        });
    });

    it('should create user if not signed up', done => {
      chai
        .request(app)
        .post(`${path}/auth/social/google`)
        .send({ token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c' })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.eq('success');
          expect(res.body.data).to.have.property('status');
          expect(res.body.data).to.have.property('token');
          done();
        });
    });

    // restore stubs
    after(() => {
      if (getUserProfileGoogleStub) {
        getUserProfileGoogleStub.restore();
      }

      if (getUserProfileFacebookStub) {
        getUserProfileFacebookStub.restore();
      }

      if (getUserProfileTwitterStub) {
        getUserProfileTwitterStub.restore();
      }
    })
  });

  describe('Access Control', () => {
    it('should throw error if role is not owner of resource', done => {
      chai
        .request(app)
        .put(`${path}/${getObjectId('admin')}`)
        .set({ 'Authorization': accessToken })
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body.status).to.eq('error');
          expect(res.body.message).to.eq(responseMessages.ERROR_FORBIDDEN);

          done();
        });
    });
  });

  describe(`Password Management`, () => {
    describe(`POST ${path}/auth/forgot-password Forgot Password`, () => {
      it('should send a password reset email to user', done => {
        chai
          .request(app)
          .post(`${path}/auth/forgot-password`)
          .send({ email: TEST_USER_DATA.email })
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.status).to.eq('success');

            token = res.body.data.token; // store password reset token
            done();
          });
      });

      it('should throw an error if email does not exist', done => {
        chai
          .request(app)
          .post(`${path}/auth/forgot-password`)
          .send({ email: 'invalid@email.com' })
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.status).to.eq('error');
            expect(res.body.message).to.eq(responseMessages.resourceNotFound('a user with that email'));

            done();
          });
      });
    });

    describe(`POST ${path}/auth/reset-password Reset Password`, () => {
      it('should reset a users password', done => {
        chai
          .request(app)
          .post(`${path}/auth/reset-password`)
          .send({ token, newPassword: 'myfreshpass' })
          .end((error, response) => {
            expect(response).to.have.status(200);
            expect(response.body.status).to.eq('success');

            chai
              .request(app)
              .post(`${path}/auth/local`) // attempt login with new password
              .send({ email: response.body.data.email, password: 'myfreshpass' })
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.status).to.eq('success');

                expect(res.body.data).to.have.property('_id');
                expect(res.body.data).to.have.property('token');
                done();
              });
          });
      });

      it('should throw an error if user does not exist', done => {
        chai
          .request(app)
          .post(`${path}/auth/reset-password`)
          .send({ token: '445566', newPassword: 'myfreshpass' })
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.status).to.eq('error');
            expect(res.body.message).to.eq(responseMessages.resourceNotFound('user'));

            done();
          });
      });
    });

    describe(`POST ${path}/auth/change-password Change Password`, () => {
      it('should change a users password', done => {
        chai
          .request(app)
          .post(`${path}/auth/change-password`)
          .set({ 'Authorization': accessToken })
          .send({ email: TEST_USER_DATA.email, oldPassword: 'myfreshpass', newPassword: 'mymodifiedpass' })
          .end((error, response) => {
            expect(response).to.have.status(200);
            expect(response.body.status).to.eq('success');

            chai
              .request(app)
              .post(`${path}/auth/local`) // attempt login with new password
              .send({ email: TEST_USER_DATA.email, password: 'mymodifiedpass' })
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.status).to.eq('success');

                expect(res.body.data).to.have.property('_id');
                expect(res.body.data).to.have.property('token');
                done();
              });
          });
      });

      it('should throw an error if user does not exist', done => {
        chai
          .request(app)
          .post(`${path}/auth/change-password`)
          .set({ 'Authorization': accessToken })
          .send({ email: 'fake@email.com', oldPassword: 'myfreshpass', newPassword: 'mymodifiedpass' })
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.status).to.eq('error');
            expect(res.body.message).to.eq(responseMessages.resourceNotFound('user'));

            done();
          });
      });

      it('should throw an error if password does not match', done => {
        chai
          .request(app)
          .post(`${path}/auth/change-password`)
          .set({ 'Authorization': accessToken })
          .send({ email: TEST_USER_DATA.email, oldPassword: 'myfreshpass', newPassword: 'mymodifiedpass' })
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.status).to.eq('error');
            expect(res.body.message).to.eq(responseMessages.ERROR_FAILED_AUTH);

            done();
          });
      });
    });
  });

  describe(`PUT ${path}/:id Update User`, () => {
    it('should update a user\'s account', done => {
      chai
        .request(app)
        .put(`${path}/${id}`)
        .send({ status: 'pending' })
        .set({ 'Authorization': TEST_TOKEN_ADMIN })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data).to.have.property('_id');
          expect(res.body.data).to.have.property('status', 'pending');
          done();
        });
    });

    it('should update a current user user\'s account', done => {
      chai
        .request(app)
        .put(`${path}/me`)
        .send({ status: 'pending' })
        .set({ 'Authorization': TEST_TOKEN_ADMIN })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data).to.have.property('_id');
          expect(res.body.data).to.have.property('status', 'pending');
          done();
        });
    });

    it('should throw error if the user id is invalid', done => {
      chai
        .request(app)
        .put(`${path}/${generateRandomID(24)}`)
        .send({ status: 'pending' })
        .set({ 'Authorization': TEST_TOKEN_ADMIN })
        .end((err, res) => {
          expect(res).to.have.status(500);
          expect(res.body.message).to.eq(responseMessages.resourceNotFound('user'));
          done();
        });
    });

    it('should throw error if the user is not found', done => {
      chai
        .request(app)
        .put(`${path}/a156778d86eee54f90aa771f`)
        .send({ status: 'pending' })
        .set({ 'Authorization': TEST_TOKEN_ADMIN })
        .end((err, res) => {
          expect(res.body.data.status).to.eq(404);
          expect(res.body.message).to.eq(responseMessages.resourceNotFound('user'));
          done();
        });
    });
  });

  describe(`DELETE ${path}/:id Remove User`, () => {
    it('should delete a user\'s account', done => {
      chai
        .request(app)
        .delete(`${path}/${id}`)
        .set({ 'Authorization': TEST_TOKEN_ADMIN })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.message).to.eq('User has been removed successfully!');
          expect(res.body.data).to.have.property('_id');
          done();
        });
    });
  });
});
