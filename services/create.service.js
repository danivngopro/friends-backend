'use strict';

const { Transaction } = require('pipe-transaction');

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
      //TODO: transactions
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

          if (
            !Object.keys(this.settings.autoApproveRanks).includes(
              ctx.meta.user.rank.replace('"', '')
            )
          ) {
            request.status = 'Pending';
            const res = await this.adapter.insert(ctx.body);
            this.logger.info(res);

            ctx.emit('mail.create', request);
            return res;
          }
          const transaction = new Transaction({});
          transaction.appendArray([
            {
              id: 'insert',
              action: async () => {
                request.status = 'Approved';
                const newGroup = await this.adapter.insert(request);
                if (!newGroup) {
                  throw new Error(
                    `Failed to create the group ${JSON.stringify(ctx.body)}`
                  );
                }
                this.logger.info(newGroup);
                ctx.emit('mail.create', request);
                return newGroup;
              },

              undo: () => this.adapter.removeById(ctx.params.id),
            },
            {
              id: 'groupsCreate',
              action: async () => {
                const groupsCreate = await this.broker.call(
                  'ad.groupsCreate',
                  ctx.body.group
                );
                if (!groupsCreate.success) {
                  throw new Error(
                    `Failed to create a group: ${groupsCreate.message}`
                  );
                }
                return groupsCreate;
              },
            },
          ]);

          const transactionsResult = Promise.resolve(transaction.exec()).catch(
            (err) => {
              throw new Error(
                `Error: Transaction failed, one or more of the undo functions failed: ${JSON.stringify(
                  err.undoInfo.errorInfo.map((error) => error.id)
                )}`
              );
            }
          );

          const { isSuccess, actionsInfo } = await transactionsResult;

          if (isSuccess) {
            return actionsInfo.responses.groupsCreate;
          }

          throw new Error(actionsInfo.errorInfo.error.message);
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
        const transaction = new Transaction({});
        transaction.appendArray([
          {
            id: 'setApproved',
            action: async () => {
              const newGroup = await this.adapter.updateById(ctx.params.id, {
                $set: {
                  status: 'Approved',
                },
              });
              if (!newGroup) {
                throw new Error(
                  `Failed to update a group. Probably the id: '${ctx.params.id}' is wrong`
                );
              }
              return newGroup;
            },

            undo: () => {
              this.adapter.updateById(ctx.params.id, {
                $set: {
                  status: 'Pending',
                },
              });
            },
          },
          {
            id: 'groupsCreate',
            action: async (transactionsInfo) => {
              const newGroup =
                transactionsInfo.previousResponses['setApproved'];
              const { createdAt, ...newGroupWithOutCreatedAt } = newGroup;
              const groupsCreate = await this.broker.call(
                'ad.groupsCreate',
                newGroupWithOutCreatedAt.group
              );
              if (!groupsCreate.success) {
                throw new Error(
                  `Failed to create a group: ${groupsCreate.message}`
                );
              }
              return groupsCreate;
            },
          },
        ]);

        const transactionsResult = Promise.resolve(transaction.exec()).catch(
          (err) => {
            throw new Error(
              `Error: Transaction failed, one or more of the undo functions failed: ${JSON.stringify(
                err.undoInfo.errorInfo.map((error) => error.id)
              )}`
            );
          }
        );

        const { isSuccess, actionsInfo } = await transactionsResult;

        if (isSuccess) {
          return actionsInfo.responses.groupsCreate;
        }

        throw new Error(actionsInfo.errorInfo.error.message);
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
