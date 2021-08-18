'use strict';

const DbMixin = require('../mixins/db.mixin');
const CreateRequest = require('../models/create/CreateRequest');
const { validations, schemas } = require('../validation');

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
  mixins: [DbMixin('createRequests')],

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
        validations.isRequesterAndCreatorTheSame(ctx.meta.user, ctx.params.creator);

        const request = ctx.params;
        request.createdAt = new Date();
        request.status = 'Pending';
        try {
          await schemas.createGroup.validateAsync(ctx.params.group);
          return await this.adapter.insert(ctx.params);
        } catch (err) {
          ctx.meta.$statusCode = err.name === 'ValidationError' ? 400 : err.status || 500;
          return { name: err.name, message: err?.response?.message || err.message, success: false };
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
          const newGroup = await this.adapter.updateById(ctx.params.id, {
            $set: {
              status: 'Approved',
            },
          });
          
          return this.broker.call('ad.groupsCreate', newGroup?.group);
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
        { creator: 1, approver: 1 },
        { unique: true }
      );
    }
  },
};
