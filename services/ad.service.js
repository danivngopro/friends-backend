'use strict';
const { ad } = require('../config');
const { default: axios } = require('axios');
const { checkIfApproved } = require('../utils');
const { schemas } = require('../validation');
const GroupMetadata = require('../models/create/GroupMetadata');

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
module.exports = {
  name: 'ad',

  /**
   * Settings
   */
  settings: {},

  /**
   * Dependencies
   */
  dependencies: [],

  /**
   * Actions
   */
  actions: {
    users: {
      params: {
        partialName: 'string',
      },
      async handler(ctx) {
        try {
          this.logger.info(
            `[ad.service] users.handler: ${ctx.params.partialName}`
          );
          schemas.partialName.validate(ctx.params);
          const res = await axios.get(`${ad.AD_SERVICE_URL}/User`, {
            params: {
              user: ctx.params.partialName,
            },
          });

          if (!res.data)
            throw Error(
              `Couldn't find any user with the name: ${ctx.params.partialName}`
            );

          return res.data;
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
    groupsSearchDistribution: {
      rest: {
        method: 'GET',
        path: '/groups/distribution',
      },
      params: {
        partialName: 'string',
      },
      async handler(ctx) {
        try {
          this.logger.info(
            `[ad.service] groupsSearchDistribution.handler: ${ctx.params.partialName}`
          );
          schemas.partialName.validate(ctx.params);

          const res = await axios.get(
            `${ad.AD_SERVICE_URL}/Group/Distribution`,
            {
              params: {
                group: ctx.params.partialName,
              },
            }
          );

          if (!res.data)
            throw Error(
              `Couldn't find any distribution group with the name: ${ctx.params.partialName}`
            );

          return res.data;
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

    groupsSearchSecure: {
      rest: {
        method: 'GET',
        path: '/groups/security',
      },
      params: {
        partialName: 'string',
      },
      async handler(ctx) {
        try {
          this.logger.info(
            `[ad.service] groupsSearchSecure.handler: ${ctx.params.partialName}`
          );
          schemas.partialName.validate(ctx.params);
          const res = await axios.get(`${ad.AD_SERVICE_URL}/Group/Security`, {
            params: {
              group: ctx.params.partialName,
            },
          });

          if (!res.data)
            throw Error(
              `Couldn't find any secured group with the name: ${ctx.params.partialName}`
            );

          return res.data;
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
    groupsAdd: {
      body: {
        groupId: 'string',
        users: ['string'],
      },

      async handler(ctx) {
        try {
          ctx.body ?? (ctx.body = ctx.params);
          await schemas.usersActionOnGroup.validateAsync(ctx.body);
          await checkIfApproved(
            this.broker,
            ctx.body.users.length,
            ctx.body.groupId,
            'UPDATE'
          );

          let url;
          let body = {
            id: ctx.body.groupId,
            type: ad.types.add,
            data: {
              groupId: ctx.params.groupId,
              userId: undefined,
            },
          };

          if (ctx.body.users.length > 1) {
            url = '/Group/users';
            body.data['userId'] = ctx.body.users.join(';');
          } else {
            url = '/Group/user';
            body.data['userId'] = ctx.body.users[0];
          }

          const res = await axios.put(`${ad.AD_SERVICE_URL}${url}`, body);

          if (res.status !== 200)
            throw Error(`Couldn't add users: ${ctx.body.users}`);
          return { success: true, users: ctx.body.users };
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
    groupsCreate: {
      body: GroupMetadata,
      async handler(ctx) {
        try {
          this.logger.info(`Creating group: `);
          this.logger.info(ctx.params);
          await schemas.createGroup.validateAsync(ctx.params);
          await checkIfApproved(this.broker, ctx.params.members.length);

          const { groupName, hierarchy, classification, owner, members, type } =
            ctx.params;
          let groupId;

          if (ad.validatedGroupTypes.includes(type)) {
            const doesGroupExists = (
              await this.broker.call('ad.groupById', { groupId: groupName })
            ).success;
            if (doesGroupExists) {
              ctx.meta.$statusCode = 400;
              return {
                name: 'GroupNameExists',
                message: `The group name ${groupName} already exists`,
                success: false,
              };
            } else {
              groupId = groupName;
            }
          } else {
            this.logger.info(type);
            groupId = await this.broker.call('groupId.getGroupId', { type });
            this.logger.info(groupId);
          }

          let body = {
            id: groupId,
            type: ad.types.create[type],
            data: {
              groupName: groupId,
              hierarchy,
              classification,
              owner,
              members: members.join(';'),
            },
          };

          this.logger.info(body);
          this.logger.info(`${ad.AD_SERVICE_URL}/Group`);
          const res = await axios.post(`${ad.AD_SERVICE_URL}/Group`, body);
          this.logger.info(`ad service res ${res}`);

          ctx.emit('mail.createSuccess', body.data);
          return res.data;
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
    userGroups: {
      rest: {
        method: 'GET',
        path: '/groups/user',
      },
      async handler(ctx) {
        try {
          this.logger.info('AD_SERVICE_URL', ad.AD_SERVICE_URL);
          this.logger.info('AD MAIL', ctx.meta.user.email);
          ctx.body ?? (ctx.body = ctx.params);
          const res = await axios.get(
            `${ad.AD_SERVICE_URL}/User/${
              ctx.meta.user.email.split('@')[0]
            }/groups`
          );
          return res.data;
        } catch (err) {
          console.log(err, 'ERROR');
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
    groupDelete: {
      rest: {
        method: 'DELETE',
        path: '/group/:groupId',
      },
      async handler(ctx) {
        try {
          ctx.body ?? (ctx.body = ctx.params);
          const res = await axios.delete(`${ad.AD_SERVICE_URL}/Group`, {
            data: {
              data: {
                groupId: ctx.body.groupId,
              },
              id: ctx.body.groupId,
              type: ad.types.delete,
            },
          });

          if (res.status !== 200)
            throw new Error(`Couldn't delete the group: ${ctx.body.groupId}`);

          return { success: true };
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
    userDelete: {
      rest: {
        method: 'DELETE',
        path: '/group/users',
      },
      body: {
        groupId: 'string',
        users: ['string'],
      },
      async handler(ctx) {
        try {
          ctx.body ?? (ctx.body = ctx.params);
          await schemas.usersActionOnGroup.validateAsync(ctx.body);

          let url;
          let body = {
            id: ctx.body.groupId,
            type: ad.types.remove,
            data: {
              groupId: ctx.body.groupId,
              userId: undefined,
            },
          };

          if (ctx.body.users.length > 1) {
            url = '/Group/users';
            body.data['userId'] = ctx.body.users.join(';');
          } else {
            url = '/Group/user';
            body.data['userId'] = ctx.body.users[0];
          }

          const res = await axios.delete(`${ad.AD_SERVICE_URL}${url}`, {
            data: body,
          });

          if (!res.data)
            throw Error(
              `Couldn't find user with the name: ${ctx.body.partialName}`
            );
          return res.data;
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
    groupById: {
      rest: {
        method: 'GET',
        path: '/groups/:groupId',
      },
      async handler(ctx) {
        try {
          ctx.body ?? (ctx.body = ctx.params);
          this.logger.info(
            `[ad.service] groupById.handler: ${ctx.body.groupId}`
          );
          schemas.groupId.validate(ctx.body);
          const res = await axios.get(
            `${ad.AD_SERVICE_URL}/Group/${ctx.body.groupId}`
          );

          if (!res.data)
            throw Error(
              `Couldn't find group with the groupId: ${ctx.body.groupId}`
            );

          this.logger.info('returning group:', ctx.body.groupId);
          return res.data;
        } catch (err) {
          this.logger.error(
            'error occured in finding group by id:',
            ctx.body.groupId
          );

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
    updateGroupOwner: {
      body: {
        groupId: 'string',
        owner: 'string',
      },
      async handler(ctx) {
        try {
          ctx.body ?? (ctx.body = ctx.params);
          await schemas.updateOwner.validateAsync(ctx.body);

          return axios.put(`${ad.AD_SERVICE_URL}/Group/owner`, {
            id: ctx.body.groupId,
            type: ad.types['owner'],
            data: {
              groupId: ctx.body.groupId,
              value: ctx.body.owner,
            },
          });
        } catch (err) {
          console.error(`Error in update group owner`, err);

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
    updateGroup: {
      rest: {
        method: 'PUT',
        path: '/group',
      },
      body: {
        groupId: 'string',
        displayName: 'string',
        name: 'string',
      },
      async handler(ctx) {
        try {
          ctx.body ?? (ctx.body = ctx.params);
          await schemas.groupId.validateAsync(ctx.body);

          const promises = [];
          for (const [field, value] of Object.entries(ctx.body)) {
            if (field !== 'groupId') {
              promises.push(
                axios.put(`${ad.AD_SERVICE_URL}/Group/${field}`, {
                  id: ctx.body.groupId,
                  type: ad.types[field],
                  data: {
                    groupId: ctx.body.groupId,
                    value,
                  },
                })
              );
            }
          }

          await Promise.all(promises);
          return {
            message: 'successfully updated all parameters',
            success: true,
          };
        } catch (err) {
          console.error(`Error in updateGroup`, err);

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
};
