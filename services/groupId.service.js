'use strict';

const DbMixin = require('../mixins/db.mixin');
const GetRequest = require('../models/groupId/GetRequest');
const { validations } = require('../validation');
const { groupId } = require('../config');
/**
 * join service
 */
module.exports = {
  name: 'groupId',

  /**
   * Service settings
   */
  settings: {},

  /**
   * Mixins
   */
  mixins: [DbMixin('groupIds')],

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
    getGroupId: {
      rest: {
        method: 'GET',
        path: '/request/:type',
      },
      params: GetRequest,
      async handler(ctx) {
        try {
            if (!ctx.params.type) throw Error("Type cannot be null");

            const currentNum = await this.adapter.updateMany({ type: ctx.params.type }, {
                $inc: { current: 1 }
            });

            const prefix = groupId.prefixIds[ctx.params.type];
            return `${prefix}${String(currentNum).padStart(groupId.idLength, '0')}`
        } catch (err) {
          console.error(err);
          throw new Error('Failed to get the groupId');
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
    const { types } = groupId;
    types.forEach(async (type) => {
        if (await this.adapter.find({ type })) {
            await this.adapter.insert({ type, current: 0 });
        }
    })

    if (!!this.adapter.collection) {
      await this.adapter.collection.createIndex(
        { type: 1 },
        { unique: true }
      );
      await this.adapter.collection.createIndex(
        { current: 1 }
      );
    }
  },
};
