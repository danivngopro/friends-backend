'use strict';

const DbMixin = require('../mixins/db.mixin');
const CreateRequest = require('../models/create/CreateRequest');
const { validations, schemas } = require('../validation');
const { Transaction } = require('pipe-transaction');
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
        request.status = 'Pending';
        try {
          await schemas.createGroup.validateAsync(ctx.body.group);

          if (!ctx.body.group.members.includes(ctx.meta.user.id)) {
            ctx.body.group.members.push(ctx.meta.user.id);
          }
          ctx.body.group.owner = ctx.meta.user.email.split('@')[0];

          const res = await this.adapter.insert(ctx.body);
          ctx.emit('mail.create', request);
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
        const transaction = new Transaction({});
        transaction.appendArray([
          {
            id: "setApproved",
            action: () =>  {return this.adapter.updateById(ctx.params.id, {
                $set: {
                  status: 'Approved',
                },
              })},
            undo: (error) => {
              console.log("undo");
               this.adapter.updateById(ctx.params.id, {
                $set: {
                  status: 'Pending',
                },
              });
              throw new Error(`Failed to approve a request: ${error}`); }
          },
          {
            id: "groupsCreate",
            action: (transactionsInfo) => 
            {
              const newGroup = transactionsInfo.previousResponses["setApproved"];
              return this.broker.call('ad.groupsCreate', newGroup);
            }

          },
        ]);

        const transactionsResult= Promise.resolve(transaction.exec()).catch((err) => {
          throw new Error(`Error: Transaction failed, Probably one of the undo functions failed: ${err}`);
        });

        const { isSuccess, actionsInfo } = await transactionsResult
        ;
    
        if (isSuccess) {
          console.log(actionsInfo)
          return actionsInfo.responses.groupsCreate;
        }
    
        throw new Error(actionsInfo?.errorInfo)


    
        try {
          const newGroup = await this.adapter.updateById(ctx.params.id, {
            $set: {
              status: 'Approved',
            },
          });
          console.log(newGroup);
          const {createdAt, ...newGroupWithOutCreatedAt} = newGroup;
          const groupsCreate = await this.broker.call('ad.groupsCreate', newGroupWithOutCreatedAt);
          console.log(groupsCreate);
          return groupsCreate;

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
