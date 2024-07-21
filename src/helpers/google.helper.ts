import { vars } from '../config/variables';
import { responseCodes } from '../constants/response-codes';
import { responseMessages } from '../constants/response-messages';
import { CustomError } from './error.helper';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(
  vars.GOOGLE_CLIENT_ID,
  vars.GOOGLE_CLIENT_SECRET,
  vars.GOOGLE_REDIRECT_URL
);

export abstract class GoogleHelper {
  public static async getUserProfile(token: string) {
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: vars.GOOGLE_CLIENT_ID,
      });
      const { sub: id, name, picture, email } = ticket.getPayload();

      return {
        id, name, email, picture,
        token: { access_token: '', refresh_token: '' },
      };
    } catch (error) {
      console.log('error', error)
      throw new CustomError(
        responseCodes.ERROR_TECHNICAL,
        responseMessages.resourceNotFound('requested user profile'), 500,
        error.response ? error.response.data : error);
    }
  }
}
