import { app } from '../constants/constants';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.helper';

export interface PaginateQuery {
  itemsPerPage?: number;
  page: number;
}

export interface PaginateResponse {
  items: number;
  page: number;
  itemsPerPage: number;
  pages: number;
}

class paginationHelper {
  /**
   * Merges the current aggregation stages with the pagination aggregation stage setup
   */
  mergePaginateAggregationStage(baseAggregations: any[], page: PaginateQuery): any[] {
    const limit = page.itemsPerPage || app.ITEMS_PER_PAGE;
    return [
      ...baseAggregations,
      {
        '$facet': {
          'meta': [
            {
              '$count': 'items'
            }, {
              '$addFields': {
                'page': page.page,
                'itemsPerPage': limit,
                'pages': {
                  '$ceil': {
                    '$divide': [
                      '$items', limit
                    ]
                  }
                }
              }
            }
          ],
          'data': [
            {
              '$skip': (page.page - 1) * limit
            }, {
              '$limit': limit
            }
          ]
        }
      }, {
        '$unwind': {
          'path': '$meta',
          'preserveNullAndEmptyArrays': true
        }
      }, {
        '$addFields': {
          'meta': {
            '$ifNull': ['$meta', {
              'items': 0,
              'page': page.page,
              'itemsPerPage': limit,
              'pages': 0
            }]
          }
        }
      }
    ];
  }

  /**
   * Returns pagination object if `itemsPage` is added to request query params
   * @param req
   * @param res
   * @param next
   */
  addPageObject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { itemsPage, itemsPerPage } = req.query;
    if (itemsPage) {
      req.page = <PaginateQuery>{ // add pagination options to request object if itemsPage is defined
        page: Number(itemsPage),
        itemsPerPage: itemsPerPage ? Number(itemsPerPage) : app.ITEMS_PER_PAGE
      };
    }

    next();
  }
}
export const PaginationHelper = new paginationHelper();
