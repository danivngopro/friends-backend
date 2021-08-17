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
                    schemas.partialName.validate(ctx.params);
                    const res = await axios.get(`${ad.AD_SERVICE_URL}/User/${ctx.params.partialName}`);

                    if (!res.data) throw Error(`Couldn't find any user with the name: ${ctx.params.partialName}`);

                    return res.data;
                } catch(err) {
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
            params: {
                groupId: "string"                
            },
            async handler(ctx) {
                try {
                    schemas.groupId.validate(ctx.params);
                    const res = await axios.get(`${ad.AD_SERVICE_URL}/Group/${ctx.params.groupId}`);

                    if (!res.data) throw Error(`Couldn't find group with the groupId: ${ctx.params.groupId}`);
                    
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
                    schemas.partialName.validate(ctx.params);

                    const res = await axios.get(`${ad.AD_SERVICE_URL}/Group/Distribution/${ctx.params.partialName}`);

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
                    schemas.partialName.validate(ctx.params);
                    const res = await axios.get(`${ad.AD_SERVICE_URL}/Group/Security/${ctx.params.partialName}`);

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
                        id: generateGUID(),
                        type: ad.type,
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
            rest: {
                method: "POST",
                path: "/group",
            },
            body: GroupMetadata,
            async handler(ctx) {
                try {
                    await schemas.createGroup.validateAsync(ctx.params);
                    await checkIfApproved(this.broker, ctx.params.members.length);

                    const { groupName, hierarchy, classification, owner, members, type } = ctx.params;

                    let body = {
                        id: await generateGUID(this.broker, type),
                        type: ad.type,
                        data: {
                            groupName, 
                            hierarchy,
                            classification,
                            owner, 
                            members
                        }
                    };

                    // TODO: Check first that there isn't any group with the groupName

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
                path: "/groups/user/:userId"
            },
            params: {
                userId: "string"
            },
            async handler(ctx) {
				try {
                    const res = await axios.get(`${ad.AD_SERVICE_URL}/User/${ctx.params.userId}/groups`);
                    return res.data;
                } catch (err) {
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
            params: {
                groupId: "string"
            },

            async handler(ctx) {
                try {
                    const res = await axios.delete(`${ad.AD_SERVICE_URL}/Group`, { data: { data: { groupId: ctx.params.groupId }, id: generateGUID(), type: ad.type } });

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
                        id: generateGUID(),
                        type: ad.type,
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
        getGroup: {
            rest: {
                method: "GET",
                path: "/group/:groupId"
            },
            params: {
                groupId: "string",
            },
            async handler(ctx) {
				try {
                    const res = await axios.get(`${ad.AD_SERVICE_URL}/Group/${ctx.params.groupId}`);

                    if (!res.data) throw Error(`Couldn't find any group with the groupId: ${ctx.params.groupId}`);
                    
                    return res.data;
                } catch(err) {
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
                owner: "string",
                name: "string"
            },
            async handler(ctx) {
                try {
                    await schemas.groupId.validateAsync(ctx.params);
                    
                    const promises = [];
                    for (const [field, value] of Object.entries(ctx.params)) {
                        if (field !== 'groupId') {
                            promises.push(axios.put(`${ad.AD_SERVICE_URL}/Group/${field}`, {
                                id: generateGUID(),
                                type: ad.type,
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
