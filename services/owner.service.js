'use strict';

const DbMixin = require('../mixins/db.mixin');
const OwnerRequest = require('../models/owner/OwnerRequest');
const { validations } = require('../validation');

/**
 * owner service
 */
module.exports = {
  name: 'owner',

  /**
   * Service settings
   */
  settings: {},

  /**
   * Mixins
   */
  mixins: [DbMixin('ownerRequests')],

  /**
   * Service metadata
   */
  metadata: {},

  /**
   * Service dependencies
   */
  dependencies: [],

  /**
   * Actions
   */
  actions: {
    /**
     * Owner request action.
     *
     * @returns
     */
    request: {
      rest: {
        method: 'POST',
        path: '/request',
      },
      params: OwnerRequest,
      async handler(ctx) {
        validations.isRequesterAndCreatorTheSame(ctx.meta.user, ctx.params.id);

        const request = ctx.params;
        request.createdAt = new Date();
        request.status = 'Pending';
        try {
          return await this.adapter.insert(ctx.params);
        } catch (err) {
          console.error(err);
          throw new Error('Failed to owner a request');
        }
      },
    },

    /**
     * Approve request action.
     *
     * @returns
     */
    approve: {
      rest: {
        method: 'PUT',
        path: '/request/approve/:id',
      },
      params: { id: { type: 'string' } },
      async handler(ctx) {
        try {
          return await this.adapter.updateById(ctx.params.id, {
            $set: {
              status: 'Approved',
            },
          });
        } catch (err) {
          console.error(err);
          throw new Error('Failed to approve a request');
        }
      },
    },

    /**
     * Deny request action.
     *
     * @returns
     */
    deny: {
      rest: {
        method: 'PUT',
        path: '/request/deny/:id',
      },
      params: { id: { type: 'string' } },
      async handler(ctx) {
        try {
          return await this.adapter.updateById(ctx.params.id, {
            $set: {
              status: 'Denied',
            },
          });
        } catch (err) {
          console.error(err);
          throw new Error('Failed to deny a request');
        }
      },
    },

    /**
     * Get requests by creator action.
     *
     * @returns
     */
    requestsByCreator: {
      rest: {
        method: 'GET',
        path: '/requests/creator/:id',
      },
      params: { id: { type: 'string' } },
      async handler(ctx) {
        validations.isRequesterAndCreatorTheSame(ctx.meta.user, ctx.params.id);

        try {
          const res = await this.adapter.find({
            creator: ctx.params.id,
          });

          return { requests: res };
        } catch (err) {
          console.error(err);
          throw new Error("Failed to get creator's requests");
        }
      },
    },

    /**
     * Get requests by approver action.
     *
     * @returns
     */
    requestsByApprover: {
      rest: {
        method: 'GET',
        path: '/requests/approver/:id',
      },
      params: { id: { type: 'string' } },
      async handler(ctx) {
        try {
          const res = await this.adapter.find({
            approver: ctx.params.id,
          });

          return { requests: res };
        } catch (err) {
          console.error(err);
          throw new Error("Failed to get approver's requests");
        }
      },
    },
  },

  /**
   * Events
   */
  events: {
    async 'some.thing'(ctx) {
      this.logger.info('Something happened', ctx.params);
    },
  },

  /**
   * Methods
   */
  methods: {},

  /**
   * Service created lifecycle event handler
   */
  created() {},

  /**
   * Service started lifecycle event handler
   */
  async started() {},

  /**
   * Service stopped lifecycle event handler
   */
  async stopped() {},

  /**
   * Fired after database connection establishing.
   */
  async afterConnected() {
    if (!!this.adapter.collection) {
      await this.adapter.collection.createIndex(
        { creator: 1, approver: 1, groupId: 1 },
        { unique: true }
      );
    }
  },
};
