const GroupMetadata = require('./GroupMetadata');

module.exports = {
  creator: { type: 'string' },
  approver: { type: 'string' },
  status: { type: 'string', enum: ['Approved', 'Denied', 'Pending'] },
  group: GroupMetadata,
};
