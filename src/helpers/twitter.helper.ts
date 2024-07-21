import { vars } from '../config/variables';
import { responseCodes } from '../constants/response-codes';
import { generateRandomID } from '../lib/utils';
import { CustomError } from './error.helper';
import { Client, auth } from 'twitter-api-sdk';

export abstract class TwitterHelper {
  public static getAuthClient(): auth.OAuth2User {
    const authClient = new auth.OAuth2User({
      client_id: vars.TWITTER_CLIENT_ID,
      client_secret: vars.TWITTER_CLIENT_SECRET,
      callback: vars.TWITTER_CALLBACK_URL,
      scopes: ["users.read", "offline.access"],
    })
    return authClient;
  }

  public static async getRequestToken(): Promise<{ url: string } | undefined> {
    const url = this.getAuthClient()
      .generateAuthURL({
        code_challenge_method: 'plain',
        code_challenge: `${generateRandomID(32, false)}`,
        state: ''
      });
    return { url }
  }

  public static async getUserProfile(
    token: string
  ): Promise<{ token: string; refreshToken: string; id: string; } | undefined> {
    const authClient = this.getAuthClient();
    const data = await authClient
      .requestAccessToken(token)
      .catch((err) => {
        throw new CustomError(
          responseCodes.DEFAULT_ERROR_CODE,
          err.message,
          400,
          err
        );
      });

    // get user profile
    const client = new Client(authClient);
    const profile = await client.users.findMyUser()
      .catch((err) => {
        throw new CustomError(
          responseCodes.DEFAULT_ERROR_CODE,
          err.message,
          400,
          err
        );
      });

    return {
      token: data.token.access_token,
      refreshToken: data.token.refresh_token,
      id: profile.data.id
    };
  }

}
