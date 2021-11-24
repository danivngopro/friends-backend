"use strict";
const { Transaction } = require("pipe-transaction");

const DbMixin = require("../mixins/db.mixin");
const JoinRequest = require("../models/join/JoinRequest");
const { validations } = require("../validation");

/**
 * join service
 */
module.exports = {
  name: "join",

  /**
   * Service settings
   */
  settings: {},

  /**
   * Mixins
   */
  mixins: [DbMixin("joinRequests")],

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
     * Join request action.
     *
     * @returns
     */
    request: {
      rest: {
        method: "POST",
        path: "/request",
      },
      //TODO: transactions
      body: JoinRequest,
      async handler(ctx) {
        ctx.body ?? (ctx.body = ctx.params);
        // validations.isRequesterAndCreatorTheSame(
        //   ctx.meta.user.id,
        //   ctx.body.creator
        // );

        const request = ctx.body;

        const transaction = new Transaction({});

        transaction.appendArray([
          {
            id: "insert",
            action: async () => {
              const newGroup = await this.adapter.insert(request);
              if(!newGroup){throw new Error(`Can not create the group: ${request}`)}
              return newGroup;
            },

            undo: async (_error, transactionsInfo) => {
              const { _id } = transactionsInfo.previousResponses["insert"];
              return this.adapter.removeById(_id);
            },
          },
          {
            id: "mailJoin",
            action: async () => {
              request.createdAt = new Date();
              request.status = "Pending";
              const mailJoin = await ctx.emit("mail.join", request);
              if (!mailJoin.success) {
                throw new Error(`Failed to join a group: ${mailJoin.message}`);
              }
              return mailJoin;
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
          return actionsInfo.responses.insert;
        }

        throw new Error(actionsInfo.errorInfo.error.message);
        // ctx.body ?? (ctx.body = ctx.params);
        // validations.isRequesterAndCreatorTheSame(
        //   ctx.meta.user.id,
        //   ctx.body.creator
        // );

        // const request = ctx.body;
        // request.createdAt = new Date();
        // request.status = "Pending";
        // try {
        //   const res = await this.adapter.insert(ctx.body);
        //   ctx.emit("mail.join", request);
        //   return res;
        // } catch (err) {
        //   console.error(err);
        //   throw new Error("Failed to join a request");
        // }
      },
    },

    /**
     * Approve request action.
     *
     * @returns
     */
    approve: {
      rest: {
        method: "PUT",
        path: "/request/approve/:id",
      },
      params: { id: { type: "string" } },
      async handler(ctx) {
        //TODO: transactions
        const transaction = new Transaction({});
        transaction.appendArray([
          {
            id: "setApproved",
            action: async () => {
              const newGroup = await this.adapter.updateById(ctx.params.id, {
                $set: {
                  status: "Approved",
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
                  status: "Pending",
                },
              });
            },
          },
          {
            id: "groupsAdd",
            action: async () => {
              const groupsAdd = await this.broker.call("ad.groupsAdd", {
                groupId: request?.groupId,
                users: [request?.creator],
              });
              if (!groupsAdd.success) {
                throw new Error(
                  `Failed to create a group: ${groupsCreate.message}`
                );
              }
              return groupsAdd;
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
          return actionsInfo.responses.groupsAdd;
        }

        throw new Error(actionsInfo.errorInfo.error.message);

        try {
          const request = await this.adapter.updateById(ctx.params.id, {
            $set: {
              status: "Approved",
            },
          });

          return await this.broker.call("ad.groupsAdd", {
            groupId: request?.groupId,
            users: [request?.creator],
          });
        } catch (err) {
          console.error(err);
          throw new Error("Failed to approve a request");
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
        method: "PUT",
        path: "/request/deny/:id",
      },
      params: { id: { type: "string" } },
      async handler(ctx) {
        try {
          return await this.adapter.updateById(ctx.params.id, {
            $set: {
              status: "Denied",
            },
          });
        } catch (err) {
          console.error(err);
          throw new Error("Failed to deny a request");
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
        method: "GET",
        path: "/requests/creator",
      },
      async handler(ctx) {
        console.log(ctx.meta.user.id, "userID");
        console.log(ctx.meta.user, "user");
        console.log(ctx.meta, "meta");
        try {
          console.log(ctx.meta.user.id, "userID");
          const res = await this.adapter.find({
            query: { creator: ctx.meta.user.id, status: "Pending" },
          });
          console.log(res, "response");
          return { requests: res };
        } catch (err) {
          console.error(err, "error");
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
        method: "GET",
        path: "/requests/approver",
      },
      async handler(ctx) {
        try {
          const res = await this.adapter.find({
            query: { approver: ctx.meta.user.id, status: "Pending" },
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
      await this.adapter.collection.createIndex({
        creator: 1,
        approver: 1,
        groupId: 1,
      });
    }
  },
};
