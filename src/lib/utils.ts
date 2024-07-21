import { Request } from "express";
import _ from "lodash";

export const generateRandomID = (length: number = 6, numeric = false) => {
  const xters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const top = Number([1, ...Array(length - 1).fill(0)].join(''));
  const bottom = Number(Array(length).fill(9).join(''));
  return numeric ?
    Math.ceil(Math.random() * (top - bottom) + bottom) :
    [...Array(length).keys()].map(() => xters.charAt(Math.floor(Math.random() * xters.length))).join('');
};

export const getEnumFromObject = <T extends {}>(obj: T, opts?: { preserveCase?: boolean; useValues?: boolean; }): Array<keyof T> => {
  return Object[opts?.useValues ? 'values' : 'keys'](obj).map(k => (opts?.preserveCase || opts?.useValues) ? k : _.kebabCase(k)) as any;
};

export const shouldParseBody = (req: Request) => {
  // skip body parsing for stripe webhooks
  if (req.headers['stripe-signature']) {
    return false;
  }
  return true;
};
