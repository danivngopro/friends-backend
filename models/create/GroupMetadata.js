module.exports = {
  type: 'object',
  props: {
    groupName: { type: 'string' },
    hierarchy: { type: 'string' },
    displayName: { type: 'string' },
    classification: { type: 'string' },
    owner: { type: 'string' },
    members: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['sAMAccountName'],
      },
    },
    type: { type: 'string' },
  },
};
