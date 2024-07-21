import _ from "lodash";
import mongoose, { Model } from "mongoose";
import pluralize from "pluralize";
import { ResourceOwnerMap } from "../constants/resource-owner-map";
import { responseCodes } from "../constants/response-codes";
import { responseMessages } from "../constants/response-messages";
import { ResourceOwners } from "../types";
import { DbHelper } from "./db.helper";
import { CustomError } from "./error.helper";
import { Request } from "express";

/**
 * Role-based access (RBAC) Helper.
 */

type Resource = keyof typeof ResourceOwnerMap;

interface ResourceOwnerMeta {
  model: Model<any>;
  ownerFields: string[];
}

/**
 * Retrieves the fields defined on a resource's model. Used to check if
 * a user requesting access to a resource owns or co-owns the requested resource.
 * @param url Endpoint/URL that the client is hitting (i.e. `{{SERVER_HOST}}/api/v1/{{resource}}`)
 */
export const getResourceOwnerMaps = (url: string): ResourceOwnerMeta[] => {
  const resources = <Resource[]>Object
    .keys(ResourceOwnerMap)
    .filter(res => url.includes(res));

  const resourceOwnerMaps = resources
    .map(resource => ResourceOwnerMap[resource])
    .filter(({ ownerFields }) => ownerFields.length > 0);

  if (resourceOwnerMaps.length > 0) {
    return resourceOwnerMaps.map(ownerMap => ({ ...ownerMap, model: mongoose.model(ownerMap.model) }));
  }
};

export const checkResourceOwnership = async (req: Request) => {

  // retrieve the reource owner fields
  const resourceMaps = getResourceOwnerMaps(req.url);

  // check if user can access only own resource
  if (req.permissions.owner === ResourceOwners.Self && resourceMaps.length > 0) {
    // ? Owner query checks if the authenticated user owns the fetched resource (via `resourceQuery`)
    const rawOwnerFields = _.flatten(resourceMaps.map(v => v.ownerFields));
    // remove duplicates
    const ownerFields = Array.from(new Set(rawOwnerFields));
    const ownerQuery = ownerFields
      .reduce((q: { [key: string]: string; }[], f) => [
        ...q,
        pluralize.isPlural(f)
          // use $in operator if field is an array
          ? {
            $in: [new mongoose.Types.ObjectId(req.user._id), `$${f}`]
          }
          // use $eq operator if field is not an array
          : {
            $eq: [`$${f}`, new mongoose.Types.ObjectId(req.user._id)]
          }
      ], []);

    // ? Resource query fetches the specified resource(s)
    const pathParamKeys = Object.keys(req.params).filter(k => k.toLowerCase().includes('id'));
    // ? If path id is defined as `me`, the authenticated user should be used for the query
    const resourceQuery = pathParamKeys
      .map(k => {
        const id = req.params[k] === 'me' ? req.user._id : req.params[k];
        return ({ $eq: ['$_id', mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : id] })
      });

    const findQuery = pathParamKeys.length > 0 // ignore resource query if there's no path param
      ? { $and: [{ $or: resourceQuery }, { $or: ownerQuery }] }
      : { $or: ownerQuery };

    if (req.method === 'GET') { // owner checks on GET requests will done on the handler level
      return;
    }

    let docCounts = await Promise.all(resourceMaps.map(resourceMap => resourceMap.model.estimatedDocumentCount().exec()));
    docCounts = docCounts.filter(count => count > 0);

    if (docCounts.length > 0) { // only check owner if collection exists and is not empty
      const owners = await Promise.all(resourceMaps.map(resourceMap => DbHelper
        .aggregate(resourceMap.model, [{ $match: { $expr: findQuery } }])
      ));

      if (!owners.some(owner => Boolean(owner[0]))) { // user does not own resource
        throw new CustomError(responseCodes.ERROR_FORBIDDEN, responseMessages.ERROR_FORBIDDEN, 403);
      }
    }
  }
}
