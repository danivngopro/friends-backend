'use strict';

const DbMixin = require('../mixins/db.mixin');
const CreateRequest = require('../models/create/CreateRequest');

/**
 * create service
 */
module.exports = {
  name: 'create',

  /**
   * Service settings
   */
  settings: {},

  /**
   * Mixins
   */
  mixins: [DbMixin('requests')],

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
     * Create request action.
     *
     * @returns
     */
    request: {
      rest: {
        method: 'POST',
        path: '/request',
      },
      params: CreateRequest,
      async handler(ctx) {
        const request = ctx.params;
        request.createdAt = new Date();
        try {
          return await this.adapter.insert(ctx.params);
        } catch (err) {
          console.error(err);
          throw new Error('Failed to create a request');
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
        try {
          const res = await this.adapter.find({
            creator: ctx.params.id,
          });

          return { requests: res.value };
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

          return { requests: res.value };
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
    await this.adapter.collection.createIndex({ creator: 1 }, { unique: true });
  },
};
