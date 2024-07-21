import { vars } from '../config/variables';
import { responseCodes } from '../constants/response-codes';
import { CustomError } from './error.helper';
import axios from 'axios';

const FACEBOOK_VERSION = 'v17.0';

export abstract class FacebookHelper {
  public static async getAuthUrl(): Promise<{ url: string } | undefined> {
    const url = `https://www.facebook.com/${FACEBOOK_VERSION}/dialog/oauth?`
      + `client_id=${vars.FACEBOOK_CLIENT_ID}`
      + `&redirect_uri=${vars.FACEBOOK_CALLBACK_URL}`
      + `&state=default`
      + `&scope=public_profile,email`
    return { url }
  }

  public static async getUserProfile(
    token: string
  ): Promise<{ token: string; email: string; id: string; } | undefined> {
    const url = `https://graph.facebook.com/${FACEBOOK_VERSION}/oauth/access_token?`
      + `client_id=${vars.FACEBOOK_CLIENT_ID}`
      + `&redirect_uri=${vars.FACEBOOK_CALLBACK_URL}`
      + `&client_secret=${vars.FACEBOOK_CLIENT_SECRET}`
      + `&code=${token}`
    const data = await axios.get<{ access_token: string; token_type: string; expires_in: number; }>(url)
      .then((res) => res.data)
      .catch((err) => {
        throw new CustomError(
          responseCodes.DEFAULT_ERROR_CODE,
          err.message,
          400,
          err
        );
      });

    // get user profile
    const profile = await axios.get<{ id: string; name: string; email: string; }>(`https://graph.facebook.com/${FACEBOOK_VERSION}/me?fields=id,email&access_token=${data.access_token}`)
      .then((res) => res.data)
      .catch((err) => {
        throw new CustomError(
          responseCodes.DEFAULT_ERROR_CODE,
          err.message,
          400,
          err
        );
      });

    return {
      token: data.access_token,
      email: profile.email,
      id: profile.id
    };
  }

}
