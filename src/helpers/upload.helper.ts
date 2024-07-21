import multer from 'multer';
import { Environment, vars } from '../config/variables';
import * as path from 'path';
import { CustomError } from './error.helper';
import { responseCodes } from '../constants/response-codes';
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

const s3Config = new S3Client({
  region: vars.AWS_REGION,
  credentials: {
    accessKeyId: vars.AWS_ACCESS_KEY_ID,
    secretAccessKey: vars.AWS_SECRET_ACCESS_KEY
  }
});

export abstract class UploadHelper {
  /**
   * Retrives multer's upload middleware
  */
  static uploadToStorage(field?: string, mode: 'single' | 'array' = 'single') {
    const storage = multerS3({
      s3: s3Config,
      bucket: vars.AWS_BUCKET_NAME,
      acl: 'public-read',
      key: function (req: any, file, cb) {
        try {
          const fileName = `${vars.NODE_ENV !== Environment.Production ? vars.NODE_ENV + '_' : ''}NapijsMedia/${req.body.reason ? `${req.body.reason}/` : ''}${req.user._id}_${Date.now()}${path.extname(file.originalname)}`;
          cb(null, fileName);
        } catch (error) {
          cb(error, '')
        }
      }
    });

    return multer({
      storage,
      limits: {
        // 16MB
        fileSize: 1024 * 1024 * 16
      },
      fileFilter(req, file, cb) {
        // upload only image and video files
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|mp4)$/)) {
          return cb(new CustomError(responseCodes.ERROR_INVALID_PARAMS, 'Please upload a PNG or JPG image', 400));
        }
        cb(undefined, true)
      }
    })[mode](field || 'file', mode === 'array' ? 4 : undefined);
  }
}
