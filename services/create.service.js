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
  settings: {
    autoApproveRanks: {
			"ראל": 1,
			"אלף": 2,
			"תאל": 3,
			"אלם": 4,
			"סאל": 5,
			"רסן": 6,
		},
  },

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
      body: CreateRequest,
      async handler(ctx) {
        ctx.body ?? (ctx.body = ctx.params);
        validations.isRequesterAndCreatorTheSame(
          ctx.meta.user.id,
          ctx.body.creator
        );
        ctx.body.creator = ctx.meta.user.id;

        const request = ctx.body;
        request.createdAt = new Date();
        try {
          await schemas.createGroup.validateAsync(ctx.body.group);

          if (!ctx.body.group.members.includes(ctx.meta.user.id)) {
            ctx.body.group.members.push(ctx.meta.user.id);
          }
          ctx.body.group.owner = ctx.meta.user.email.split('@')[0];

          if (Object.keys(this.settings.autoApproveRanks).includes(ctx.meta.user.rank.replace('"', ''))) {
            request.status = 'Approved';
            const res = await this.adapter.insert(ctx.body);
            this.logger.info(res);
            ctx.emit("mail.create", request);
            return await this.broker.call('ad.groupsCreate', ctx.body.group);
          }
          request.status = 'Pending';
          const res = await this.adapter.insert(ctx.body);
          this.logger.info(res);
          
          ctx.emit("mail.create", request);
          return res;
        } catch (err) {
          ctx.meta.$statusCode =
            err.name === 'ValidationError' ? 400 : err.status || 500;
          return {
            name: err.name,
            message: err?.response?.message || err.message,
            success: false,
          };
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
      async handler(ctx) {
        try {
          const newGroup = await this.adapter.findById(ctx.params.id);
          this.logger.info('newGroup: ');
          this.logger.info(newGroup);

          await this.adapter.updateById(ctx.params.id, {
            $set: {
              status: 'Approved',
            },
          });
          const {createdAt, status, ...groupWithValidFields} = newGroup
          return await this.broker.call('ad.groupsCreate', groupWithValidFields.group);
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
        path: '/requests/creator',
      },
      async handler(ctx) {
        try {
          const res = await this.adapter.find({
            query: { creator: ctx.meta.user.id },
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
        path: '/requests/approver',
      },
      async handler(ctx) {
        try {
          const res = await this.adapter.find({
            query: { approver: ctx.meta.user.id, status: 'Pending' },
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
  events: {},

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
      await this.adapter.collection.createIndex({ creator: 1, approver: 1 });
    }
  },
};
