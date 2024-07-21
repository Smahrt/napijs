import mongoose, { ClientSession, Document, Model } from 'mongoose';
import { responseCodes } from '../constants/response-codes';
import { CustomError } from './error.helper';
import { responseMessages } from '../constants/response-messages';
import pluralize from 'pluralize';
import { logger } from '../lib/logger';

type ExtractDocument<M> = M extends Model<infer T, any> ? T : never;

export interface PopulateOptions {
  path: string;
  select?: string;
  populate?: PopulateOptions;
}

interface LookupStageOptions {
  from: string;
  localField?: string;
  foreignField?: string;
  let?: {
    [key: string]: string
  };
  pipeline?: any[];
  as: string;
}

interface LookupOptions {
  from: string;
  select?: string;
  localField?: string;
  foreignField?: string;
  as?: string;
  matchExpression?: any;
}

type LookupUnwindStage = {
  '$lookup': LookupStageOptions
} | {
  '$unwind'?: {
    path: string,
    preserveNullAndEmptyArrays: boolean
  }
};

export abstract class DbHelper {

  /**
   * Saves a document and returns the saved document
   * @param doc
   * @returns Document
   */
  public static save<T extends Document>(doc: T) { return doc.save(); }

  /**
   * Deletes a document and returns the deleted document
   * @param doc
   * @returns Document
   */
  public static deleteDocument<T extends Document>(doc: T) { return doc.deleteOne(); }

  /**
   * Deletes a document from a model that matches specified conditions
   * @param model
   * @param conditions
   * @returns Document
   */
  public static async findAndDelete<T extends Model<any>>(model: T, conditions: any): Promise<ExtractDocument<T>> {
    const docs = await model.find(conditions).exec();

    if (docs.length > 0) {
      return docs[0].deleteOne();
    } else {
      throw new CustomError(responseCodes.ERROR_NOT_FOUND, responseMessages.resourceNotFound(`resource with query: ${JSON.stringify(conditions)}`), 404);
    }
  }

  /**
   * Deletes a document from a model that matches specified conditions
   * @param model
   * @param conditions
   * @returns Document
   */
  public static async deleteMany<T extends Model<any>>(model: T, conditions: any): Promise<number> {
    try {
      const { deletedCount } = await model.deleteMany(conditions).exec();
      return deletedCount;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Finds documents in a collection and returns an array of found docs
   * @param model
   * @param conditions
   * @param sort
   * @param limit
   * @param populatePaths
   * @returns Document[]
   */
  public static async find<T extends Model<any>>(model: T, conditions?: any, sort?: any, limit?: number, populatePaths?: PopulateOptions[])
    : Promise<ExtractDocument<T>[]> {
    const query = model.find(conditions || {})
      .sort(sort || {})
      .limit(limit || 50);

    if (populatePaths && Array.isArray(populatePaths)) {
      populatePaths.forEach(p => {
        query.populate(p);
      });
    }
    return query.exec();
  }

  /**
   * Finds documents in a collection and returns an array of found docs
   * @param model
   * @param id
   */
  public static async findOne<T extends Model<any>>(model: T, id: string): Promise<ExtractDocument<T>> {
    const modelName = model.modelName.toLowerCase();
    const result = await model
      .findById(id)
      .exec()
      .catch(e => {
        throw new CustomError(responseCodes.ERROR_NOT_FOUND, responseMessages.resourceNotFound(`${modelName} with id: ${id}`), 500, e);
      });

    if (!result) {
      throw new CustomError(responseCodes.ERROR_NOT_FOUND, responseMessages.resourceNotFound(`${modelName} with id: ${id}`), 404);
    }

    return result;
  }

  public static aggregate<T extends Model<any>>(model: T, aggregations: any[]): Promise<ExtractDocument<T>[]> {
    return model.aggregate(aggregations).exec();
  }

  /**
   * Finds documents in a collection and returns an array of found docs
   * @param model
   * @param query
   * @returns number
   */
  public static count<T extends Model<any>>(model: T, query?: any): Promise<number> {
    return model[query ? 'countDocuments' : 'estimatedDocumentCount'](query).exec()
  }

  /**
   * Updates a model's fields dynamically
   * @param doc
   * @param {!any} params
   * @param model
   * @param {!String[]} skipUpdate
   * @param model
   */
  public static async update<T extends Document>(doc: T, params: any, skipUpdate: string[], model?: Model<any>): Promise<T> {
    const updateParams: any = {};
    if (typeof params !== 'object') {
      throw new CustomError(responseCodes.ERROR_INVALID_PARAMS, 'params is not an object', 400);
    }

    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        if (typeof doc[key] === 'undefined') {
          logger.info(`'key not found in doc', ${key}, 'skipping'`)
          continue;
        }

        if (skipUpdate.indexOf(key) < 0) {
          doc[key] = params[key];
          updateParams[key] = params[key];
        }
      }
    }

    return !model ? DbHelper.save(doc) :
      model.findOneAndUpdate({ _id: doc._id }, updateParams, { new: true, runValidators: true }).exec();
  }

  public static lookup(opts: LookupOptions, unwind: boolean = false) {
    const { from: col, select, localField, foreignField, as: fieldName } = opts;
    const name = fieldName || localField || col.slice(0, col.length - 1);
    let lookupStage: LookupStageOptions;

    lookupStage = {
      'from': col,
      'as': name
    };

    if (select) {
      const projectFields = select.split(' ').reduce((obj: { [key: string]: number }, s) => {
        obj[s] = 1;
        return obj;
      }, {});

      lookupStage['let'] = { 'docId': `$${localField || '_id'}` };
      const defaultMatchExpression =
      {
        // use $in operator if localField is an array
        [pluralize.isPlural(localField || '_id') ? '$in' : '$eq']: [`$${foreignField || '_id'}`, '$$docId'],
      };
      lookupStage['pipeline'] = [
        {
          '$match': {
            '$expr': {
              ...(opts.matchExpression ? {
                $and: [
                  opts.matchExpression,
                  defaultMatchExpression
                ]
              } : defaultMatchExpression
              )
            }
          }
        }, {
          '$project': {
            '_id': 1,
            ...projectFields
          }
        }
      ];

    } else {
      lookupStage['localField'] = localField || '_id';
      lookupStage['foreignField'] = foreignField || '_id';
    }
    const stage: LookupUnwindStage[] = [{ '$lookup': lookupStage }];
    if (unwind) {
      stage.push({
        '$unwind': {
          path: `$${name}`,
          preserveNullAndEmptyArrays: true
        }
      });
    }

    return stage;
  }

  public static async saveWithTransaction(...docs: Document[]) {
    const session = await mongoose.startSession();
    try {
      const savedDocs = await DbHelper.runTransactionWithRetry(docs, session);
      session.endSession();
      return savedDocs;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      if (error instanceof CustomError) { throw error; }
      throw new CustomError(responseCodes.DEFAULT_ERROR_CODE, responseMessages.GENERIC, 500, error);
    }
  }

  private static async runTransactionWithRetry(docs: Document[], session: ClientSession) {
    const sessionOptions = { session };
    try {
      session.startTransaction();
      // exectue tasks
      const savedDocs = await Promise.all([
        ...docs.map(doc => doc.save(sessionOptions))
      ]);
      await DbHelper.commitTransactionWithRetry(session);
      return savedDocs;
    } catch (error) {
      if (error instanceof CustomError) { throw error; }

      logger.info('runTransactionWithRetry:' + JSON.stringify(error, null, 2));

      // If transient error, retry the whole transaction
      if (error.errorLabels && error.errorLabels.includes('TransientTransactionError')) {
        logger.info('Encountered TransientTransactionError, retrying transaction...');
        await DbHelper.runTransactionWithRetry(docs, session);
      } else {
        throw error;
      }
    }
  }

  private static async commitTransactionWithRetry(session: ClientSession) {
    try {
      await session.commitTransaction();
    } catch (error) {
      if (error instanceof CustomError) { throw error; }

      logger.info('commitTransactionWithRetry:' + JSON.stringify(error, null, 2));

      if (error.errorLabels && error.errorLabels.includes('UnknownTransactionCommitResult')) {
        logger.info('Encountered UnknownTransactionCommitResult, retrying commit operation...');
        await DbHelper.commitTransactionWithRetry(session);
      } else {
        console.log('Error occurred while committing transaction', error);
        throw error;
      }
    }
  }

  public static toObjectId(id: string): mongoose.Types.ObjectId {
    return new mongoose.Types.ObjectId(id);
  }
}
