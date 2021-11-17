'use strict';

const DbMixin = require('../mixins/db.mixin');
const GetRequest = require('../models/groupId/GetRequest');
const { groupId } = require('../config');
const { schemas } = require('../validation');

/**
 * groupId service
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
      params: GetRequest,
      async handler(ctx) {
        try {
          schemas.type.validate(ctx.params);
          console.log('get group called');
          if (!ctx.params.type) throw Error('Type cannot be null');

          const { _id } = await this.adapter.findOne({
            query: { type: ctx.params.type },
          });
          const { current } = await this.adapter.updateById(_id, {
            $inc: { current: 1 },
          });

          const prefix = groupId.prefixIds[ctx.params.type];
          return `${prefix}${String(current).padStart(groupId.idLength, '0')}`;
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
    const { types } = groupId;
    types.forEach(async (type) => {
      if (!(await this.adapter.find({ query: { type } }))) {
        await this.adapter.insert({ type, current: 0 });
      }
    });

    if (!!this.adapter.collection) {
      await this.adapter.collection.createIndex({ type: 1 });
      await this.adapter.collection.createIndex({ current: 1 });
    }
  },
};
