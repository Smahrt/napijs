import path from 'path';
import ejs from 'ejs';
import { app } from '../constants/constants';
import { vars } from '../config/variables';
import { logger } from '../lib/logger';
import * as postmark from 'postmark';

// Configure transport options
const client = new postmark.ServerClient(vars.POSTMARK_API_KEY);

class emailHelper {
  /**
   * @param To - Email recipient
   * @param Subject - Email subject
   * @param data - Data to be sent
   * @param templateName - (optional) EJS template to be used
   * @param content - (optional) Body of the email
   */
  sendEmail(To: string, Subject: string, data: any, templateName?: string, content?: string) {
    return new Promise((resolve) => {
      const reject = (data: any) => {
        console.log(data);
        logger.log('error', 'Problem sending email:' + JSON.stringify(data, null, 2));
      };
      const mailOptions: any = { From: 'Napijs Team no-reply@napijs.app', To, Subject };
      data.currentYear = new Date().getFullYear();

      if (templateName) {
        data.baseUrl = app.BASE_URL;
        const templatePath = path.join(__dirname, '..', 'lib', 'email-templates', `${templateName}.ejs`);
        ejs.renderFile(templatePath, data, (err, template) => {
          if (err) {
            reject({ error: err, message: 'Problem rendering email template:' + templatePath });
          } else {
            mailOptions["HtmlBody"] = template;

            return client.sendEmail(mailOptions)
              .then(resolve)
              .catch(reject);
          }
        });

      } else {
        mailOptions["TextBody"] = content;

        return client.sendEmail(mailOptions)
          .then(resolve)
          .catch(reject);
      }
    });
  }
}

export const EmailHelper = new emailHelper();
