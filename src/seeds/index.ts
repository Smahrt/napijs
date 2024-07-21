import { Seeder } from 'mongo-seeding';
import { Database } from '../config/database';
import path from 'path';
import { SeedLog } from '../models/seed';
import { NextFunction, Response } from 'express';
import { responseCodes } from '../constants/response-codes';
import { responseMessages } from '../constants/response-messages';
import { ResponseHelper } from '../helpers';
import { logger } from '../lib/logger';
import { AuthenticatedRequest } from '../helpers/auth.helper';

const config = {
  database: Database.uri,
};

const seedDefaultRecords = async ({ dropCollections }: { dropCollections: boolean; }) => {
  const seeder = new Seeder(config);

  try {
    const collections = seeder.readCollectionsFromPath(
      path.join(__dirname, './data'),
      {
        extensions: ['ts']
      }
    );

    await seeder.import(collections, { dropCollections });
    const description = `Seeded ${collections.length} collections in DB successfully!`;
    await SeedLog.create({ description, collections: collections.map(c => c.name) });
  } catch (err) {
    throw err;
  }
};

export const handleSeed = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { dropCollections = false } = req.body;
  // check if default records already exist
  // if so, return 409
  const defaultRecords = await SeedLog.find();
  if (defaultRecords.length > 0 && !dropCollections) {
    return ResponseHelper.sendSuccess(res, null, 'Default records already exist!');
  }
  // else, seed default records
  try {
    await seedDefaultRecords({ dropCollections });
    return ResponseHelper.sendSuccess(res, null, 'Default records seeded successfully!');
  } catch (err) {
    logger.log('error', err);
    return ResponseHelper.sendError(res, responseCodes.ERROR_TECHNICAL, responseMessages.GENERIC, 500, err);
  }
}

