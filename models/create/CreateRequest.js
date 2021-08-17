const GroupMetadata = require('./GroupMetadata');

module.exports = {
  creator: { type: 'string' },
  approver: { type: 'string' },
  group: GroupMetadata,
};
