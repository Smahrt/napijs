import { responseCodes } from '../../constants/response-codes';
import { responseMessages } from '../../constants/response-messages';
import { DbHelper } from '../../helpers';
import { CustomError } from '../../helpers/error.helper';
import { PaginateQuery, PaginationHelper } from '../../helpers/pagination.helper';
import { User } from '../../models/user';

const baseProjections = {
  'profile': 0,
  'password': 0,
  'requestedEmailVerification': 0,
  '__v': 0
};

export abstract class UserRepository {

  public static async findAllUsers(page?: PaginateQuery, q?: string) {
    try {
      let baseAgg: any = [
        { '$project': baseProjections }
      ];

      if (q) {
        const regex = new RegExp(q, 'i');
        baseAgg = [
          {
            $match: {
              $or: [
                { 'email': regex },
              ]
            }
          },
          ...baseAgg,
          { // only return these fields for searches
            $project: {
              'email': 1,
            }
          }
        ];
      }

      const agg = page ? PaginationHelper.mergePaginateAggregationStage(baseAgg, page) : baseAgg;

      const users = await DbHelper.aggregate(User, agg);
      return users;
    } catch (error) {
      throw new CustomError(responseCodes.ERROR_TECHNICAL, responseMessages.resourceNotFound('user'), 500, error);
    }
  }

  public static async findUserById(id: string) {
    return this.findSingleUser(id);
  }

  private static async findSingleUser(id: string, matchAggregations: any[] = []) {
    try {
      const agg = [
        { '$match': { '_id': DbHelper.toObjectId(id) } },
        ...matchAggregations,
        { '$project': baseProjections }
      ]
      const [user] = await DbHelper.aggregate(User, agg);
      return user;
    } catch (error) {
      throw new CustomError(responseCodes.ERROR_TECHNICAL, responseMessages.resourceNotFound('user'), 500, error);
    }
  }
}
