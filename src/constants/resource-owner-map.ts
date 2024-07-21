/**
 * Resource owner map. This is a map of a resource's endpoint identifier `{{SERVER_HOST}}/api/v1/{{resource}}`
 * and the model-ownerField of the related association.
 *
 * @example
 * ```ts
 * ...
 * '<resource>': {
 *   model: '<model>',
 *   ownerFields: ['<field1>', '<field2>', ...]
 * }
 * ```
 */
export const ResourceOwnerMap = {
  users: {
    model: 'User',
    ownerFields: ['_id']
  },
};
