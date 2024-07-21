import { UserPayload, ResourcePermission } from ".";
import { PaginateQuery } from "../helpers/pagination.helper";

export type Maybe<T> = T | undefined | null;

declare module 'express' {
  interface Request {
    user?: UserPayload;
    permissions: ResourcePermission;
    page: PaginateQuery;

    file: Maybe<Express.Multer.File>;
    files: Maybe<Express.Multer.File[]>;
  }
}
