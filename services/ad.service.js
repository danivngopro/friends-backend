"use strict";
const { ad } = require('../config');
const { default: axios } = require('axios');
const { generateGUID, checkIfApproved } = require('../utils');
const { schemas } = require('../validation');
const GroupMetadata = require('../models/create/GroupMetadata');

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
module.exports = {
	name: "ad",

	/**
	 * Settings
	 */
	settings: {

	},

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
                partialName: "string"
            },
			async handler(ctx) {
                try {
                    this.logger.info(`[ad.service] users.handler: ${ctx.params.partialName}`);
                    schemas.partialName.validate(ctx.params);
                    const res = await axios.get(`${ad.AD_SERVICE_URL}/User`, {
                        params: {
                            user: ctx.params.partialName,
                        },
                    });

                    if (!res.data) throw Error(`Couldn't find any user with the name: ${ctx.params.partialName}`);

                    return res.data;
                } catch(err) {
                    ctx.meta.$statusCode = err.name === 'ValidationError' ? 400 : err.status || 500;
                    return { name: err.name, message: err?.response?.message || err.message, success: false };
                }
			}
		},
        groupsSearchDistribution: {
            rest: {
                method: "GET",
                path: "/groups/distribution",
            },
            params: {
                partialName: "string"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`[ad.service] groupsSearchDistribution.handler: ${ctx.params.partialName}`);
                    schemas.partialName.validate(ctx.params);

                    const res = await axios.get(`${ad.AD_SERVICE_URL}/Group/Distribution`, {
                        params: {
                            group: ctx.params.partialName,
                        },
                    });

                    if (!res.data) throw Error(`Couldn't find any distribution group with the name: ${ctx.params.partialName}`);
                    
                    return res.data;
                } catch(err) {
                    ctx.meta.$statusCode = err.name === 'ValidationError' ? 400 : err.status || 500;
                    return { name: err.name, message: err?.response?.message || err.message, success: false };
                }
			}
        },

        groupsSearchSecure: {
            rest: {
                method: "GET",
                path: "/groups/security",
            },
            params: {
                partialName: "string"                
            },
            async handler(ctx) {
                try {
                    this.logger.info(`[ad.service] groupsSearchSecure.handler: ${ctx.params.partialName}`);
                    schemas.partialName.validate(ctx.params);
                    const res = await axios.get(`${ad.AD_SERVICE_URL}/Group/Security`, {
                        params: {
                            group: ctx.params.partialName,
                        },
                    });

                    if (!res.data) throw Error(`Couldn't find any secured group with the name: ${ctx.params.partialName}`);
                    
                    return res.data;
                } catch(err) {
                    ctx.meta.$statusCode = err.name === 'ValidationError' ? 400 : err.status || 500;
                    return { name: err.name, message: err?.response?.message || err.message, success: false };
                }
			}
        },
        groupsAdd: {
            body: {
                groupId: "string",
                users: ["string"]
            },

            async handler(ctx) {
                try {
                    await schemas.usersActionOnGroup.validateAsync(ctx.params);
                    await checkIfApproved(this.broker, ctx.params.users.length, ctx.params.groupId, 'UPDATE');

                    let url;
                    let body = {
                        id: ctx.params.groupId,
                        type: ad.types.add,
                        data: {
                            groupId: ctx.params.groupId,
                            userId: undefined
                        }
                    };

                    if (ctx.params.users.length > 1) {
                        url = '/Group/users';
                        body.data['userId'] = ctx.params.users.join(';');
                    } else if (ctx.params.users.length === 0) {
                        url = '/Group/user';
                        body.data['userId'] = ctx.params.users[0];
                    }

                    const res = await axios.put(`${ad.AD_SERVICE_URL}/${url}`, body);

                    if (res.status !== 200) throw Error(`Couldn't add users: ${ctx.params.users}`);
                    return { success: true, users: ctx.params.users };
                } catch (err) {
                    ctx.meta.$statusCode = err.name === 'ValidationError' ? 400 : err.status || 500;
                    return { name: err.name, message: err?.response?.message || err.message, success: false };
                }
			}
        },
        groupsCreate: {
            body: GroupMetadata,
            async handler(ctx) {
                try {
                    await schemas.createGroup.validateAsync(ctx.params);
                    await checkIfApproved(this.broker, ctx.params.members.length);

                    const { groupName, hierarchy, classification, owner, members, type } = ctx.params;
                    let groupId;

                    if (ad.validatedGroupTypes.includes(type)) {
                        const doesGroupExists = (await this.broker.call('ad.groupById', { groupId: groupName })).success;
                        if(doesGroupExists) {
                            ctx.meta.$statusCode = 400;
                            return { name: 'GroupNameExists', message: `The group name ${groupName} already exists`, success: false };
                        }
                        else{
                            groupId = groupName;
                        }
                    } else {
                        groupId = await generateGUID(this.broker, type);
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
                        }
                    };

                    const res = await axios.post(`${ad.AD_SERVICE_URL}/Group`, body);
                    return res.data;
                } catch (err) {
                    ctx.meta.$statusCode = err.name === 'ValidationError' ? 400 : err.status || 500;
                    return { name: err.name, message: err?.response?.message || err.message, success: false };
                }
			}
        },
        userGroups: {
            rest: {
                method: "GET",
                path: "/groups/user"
            },
            async handler(ctx) {
                console.log(ad.AD_SERVICE_URL, 'AD_SERVICE_URL');
                console.log(ctx.meta.user.mail, 'AD MAIL');
                try {
                    const res = await axios.get(`${ad.AD_SERVICE_URL}/User/${ctx.meta.user.mail.split('@')[0]}/groups`);
                    return res.data;
                } catch (err) {
                    console.log(err, 'ERROR');
                    ctx.meta.$statusCode = err.name === 'ValidationError' ? 400 : err.status || 500;
                    return { name: err.name, message: err?.response?.message || err.message, success: false };
                }
			}
        },
        groupDelete: {
            rest: {
                method: "DELETE",
                path: "/group/:groupId"
            },
            async handler(ctx) {
                try {
                    const res = await axios.delete(`${ad.AD_SERVICE_URL}/Group`, {
                        data: {
                            data: {
                                groupId: ctx.params.groupId
                            },
                            id: ctx.params.groupId,
                            type: ad.types.delete,
                        }
                    });

                    if (res.status !== 200) throw Error(`Couldn't delete the group: ${ctx.params.groupId}`);

                    return { success: true };
                } catch (err) {
                    ctx.meta.$statusCode = err.name === 'ValidationError' ? 400 : err.status || 500;
                    return { name: err.name, message: err?.response?.message || err.message, success: false }; 
                }
			}
        },
        userDelete: {
            rest: {
                method: "DELETE",
                path: "/group/users"
            },
            body: {
                groupId: "string",
                users: ["string"],
            },
            async handler(ctx) {
                try {
                    await schemas.usersActionOnGroup.validateAsync(ctx.params);

                    let url;
                    let body = {
                        id: ctx.params.groupId,
                        type: ad.types.remove,
                        data: {
                            groupId: ctx.params.groupId,
                            userId: undefined
                        }
                    };

                    if (ctx.params.users.length > 1) {
                        url = '/Group/users';
                        body.data['userId'] = ctx.params.users.join(';');
                    } else if (ctx.params.users.length === 0) {
                        url = '/Group/user';
                        body.data['userId'] = ctx.params.users[0];
                    }

                    const res = await axios.delete(`${ad.AD_SERVICE_URL}/${url}`, { data: body });

                    if (!res.data) throw Error(`Couldn't find user with the name: ${ctx.params.partialName}`);
                    return res.data;
                } catch (err) {
                    ctx.meta.$statusCode = err.name === 'ValidationError' ? 400 : err.status || 500;
                    return { name: err.name, message: err?.response?.message || err.message, success: false };
                }
			}
        },
        groupById: {
            rest: {
                method: "GET",
                path: "/groups/:groupId",
            },
            async handler(ctx) {
                try {
                    this.logger.info(`[ad.service] groupById.handler: ${ctx.params.groupId}`);
                    schemas.groupId.validate(ctx.params);
                    const res = await axios.get(`${ad.AD_SERVICE_URL}/Group/${ctx.params.groupId}`);

                    if (!res.data) throw Error(`Couldn't find group with the groupId: ${ctx.params.groupId}`);
                    
                    this.logger.info('returning group:', ctx.params.groupId);
                    return res.data;
                } catch(err) {
                    this.logger.error('error occured in finding group by id:', ctx.params.groupId);

                    ctx.meta.$statusCode = err.name === 'ValidationError' ? 400 : err.status || 500;
                    return { name: err.name, message: err?.response?.message || err.message, success: false };
                }
			}
        },
        updateGroupOwner: {
            body: {
                groupId: "string",
                owner: "string",
            },
            async handler(ctx) {
                try {
                    await schemas.updateOwner.validateAsync(ctx.params);

                    return await axios.put(`${ad.AD_SERVICE_URL}/Group/owner`, {
                        id: ctx.params.groupId,
                        type: ad.types['owner'],
                        data: {
                            groupId: ctx.params.groupId,
                            value: ctx.params.owner,
                        }
                    });
                } catch (err) {
                    console.error(`Error in update group owner`, err);

                    ctx.meta.$statusCode = err.name === 'ValidationError' ? 400 : err.status || 500;
                    return { name: err.name, message: err?.response?.message || err.message, success: false };
                }
            }
        },
        updateGroup: {
            rest: {
                method: "PUT",
                path: "/group"
            },
            body: {
                groupId: "string",
                displayName: "string",
                name: "string"
            },
            async handler(ctx) {
                try {
                    await schemas.groupId.validateAsync(ctx.params);
                    
                    const promises = [];
                    for (const [field, value] of Object.entries(ctx.params)) {
                        if (field !== 'groupId') {
                            promises.push(axios.put(`${ad.AD_SERVICE_URL}/Group/${field}`, {
                                id: ctx.params.groupId,
                                type: ad.types[field],
                                data: {
                                    groupId: ctx.params.groupId,
                                    value,
                                }
                            }));
                        }
                    }

                    await Promise.all(promises);
                    return { message: 'successfully updated all parameters' , success: true };
                } catch (err) {
                    console.error(`Error in updateGroup`, err);

                    ctx.meta.$statusCode = err.name === 'ValidationError' ? 400 : err.status || 500;
                    return { name: err.name, message: err?.response?.message || err.message, success: false };
                }
			}
        }
	},

	/**
	 * Events
	 */
	events: {

	},

	/**
	 * Methods
	 */
	methods: {

	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {

	},

	/**
	 * Service started lifecycle event handler
	 */
	async started() {

	},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {

	}
};
