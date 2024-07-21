import { Request } from "express";
import { PaginateQuery } from "../helpers/pagination.helper";

export enum ResourceOwners {
  Self,
  Everyone
}

export interface ResourcePermission {
  role: ResourceRoles;
  owner?: ResourceOwners;
}

export interface UserPayload {
  _id: string;
  role: UserRoles;
}

export enum UserRoles {
  Admin = 'Admin',
  Member = 'Member',
}

/**
 * Specifies the available access roles for a resource
 */
export enum ResourceRoles {
  Admin = 'Admin',
  Guest = 'Guest',
  All = 'Admin Member'
}
