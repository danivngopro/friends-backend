"use strict";
const { ad } = require('../config');
const { default: axios } = require('axios');
const { generateGUID } = require('../utils');

const Joi = require('joi');

const schema = Joi.object({
    partialName: Joi.string().required()
});

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
            // /User/:partialName
			rest: {
				method: "GET",
				path: "/users"
			},
            params: {
                partialName: "string"
            },
			async handler(ctx) {
                try {
                    schema.validate(ctx.params);
                    const res = await axios.get(`${ad.AD_SERVICE_URL}/User/${ctx.params.partialName}`);

                    if (!res.data) throw Error(`Couldn't find any user with the name: ${ctx.params.partialName}`);

                    return res.data;
                } catch(err) {
                    ctx.meta.$statusCode = err.status || 500;
                    return { message: (err.response && err.response.message) || err.message, success: false };
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
                    const res = await axios.get(`${ad.AD_SERVICE_URL}/Group/${ctx.params.groupId}`);

                    if (!res.data) throw Error(`Couldn't find group with the groupId: ${ctx.params.groupId}`);
                    
                    return res.data;
                } catch(err) {
                    ctx.meta.$statusCode = err.status || 500;
                    return { message: (err.response && err.response.message) || err.message, success: false };
                }
			}
        },
        // /Group/Distribution/:partialName
        groupsSearchDistribution: {
            rest: {
                method: "GET",
                path: "/groups",
            },
            params: {
                partialName: "string"                
            },
            async handler(ctx) {
                try {
                    const res = await axios.get(`${ad.AD_SERVICE_URL}/Group/Distribution/${ctx.params.partialName}`);

                    if (!res.data) throw Error(`Couldn't find any distribution group with the name: ${ctx.params.partialName}`);
                    
                    return res.data;
                } catch(err) {
                    ctx.meta.$statusCode = err.status || 500;
                    return { message: (err.response && err.response.message) || err.message, success: false };
                }
			}
        },

        // /Group/Security/:partialName
        groupsSearchSecure: {
            rest: {
                method: "GET",
                path: "/groups",
            },
            params: {
                partialName: "string"                
            },
            async handler(ctx) {
                try {
                    const res = await axios.get(`${ad.AD_SERVICE_URL}/Group/Security/${ctx.params.partialName}`);

                    if (!res.data) throw Error(`Couldn't find any secured group with the name: ${ctx.params.partialName}`);
                    
                    return res.data;
                } catch(err) {
                    ctx.meta.$statusCode = err.status || 500;
                    return { message: (err.response && err.response.message) || err.message, success: false };
                }
			}
        },
        // /groups/user + body
        groupsAdd: {
            rest: {
                method: "PUT",
                path: "/groups/users"
            },
            body: {
                groupId: "string",
                users: ["string"]
            },
            // create long string with ; between every user, if only one user, then don't add ;
            // For users: the route is:
            // For user, the route is:
            // Generate ID for document
            // Type is empty string for now
            async handler(ctx) {
                try {
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
                    ctx.meta.$statusCode = err.status || 500;
                    return { message: (err.response && err.response.message) || err.message, success: false };
                }
			}
        },
        groupsCreate: {
            rest: {
                method: "POST",
                path: "/group"
            },
            body: {
                groupName: "string",
                // TODO: implement,
            },
            async handler(ctx) {
                console.log(ctx.params);
                try {
                    let body = {
                        id: generateGUID(),
                        type: ad.type,
                        data: {
                            groupId: ctx.params.groupName,
                            userId: undefined
                        }
                    };

                    return { success: true };
                } catch (err) {
                    ctx.meta.$statusCode = err.status || 500;
                    return { message: (err.response && err.response.message) || err.message, success: false };
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
                    ctx.meta.$statusCode = err.status || 500;
                    return { message: (err.response && err.response.message) || err.message, success: false };
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
            // send groupId in body, + generated id + data: { groupId }
            async handler(ctx) {
                try {
                    const res = await axios.delete(`${ad.AD_SERVICE_URL}/Group`, { data: { data: { groupId: ctx.params.groupId }, id: generateGUID(), type: ad.type } });

                    if (res.status !== 200) throw Error(`Couldn't delete the group: ${ctx.params.groupId}`);

                    return { success: true };
                } catch (err) {
                    ctx.meta.$statusCode = err.status || 500;
                    return { message: (err.response && err.response.message) || err.message, success: false }; 
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
                users: ["string"] // same logic as group add
            },
            async handler(ctx) {
                try {
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
                    ctx.meta.$statusCode = err.status || 500;
                    return { message: (err.response && err.response.message) || err.message, success: false };
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
                    ctx.meta.$statusCode = err.status || 500;
                    return { message: (err.response && err.response.message) || err.message, success: false };
                }
			}
        },
        updateGroup: {
            rest: {
                method: "PUT",
                path: "/group/:groupId"
            },
            params: {
                groupId: "string",
            },
            body: {
                displayName: "string",
                owner: "string",
                name: "string"
            },
            async handler(ctx) {
                try {
                    let promises;
                    for (let [field, value] of ctx.params.entries()) {
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

                    ctx.meta.$statusCode = err.status || 500;
                    return { message: (err.response && err.response.message) || err.message, success: false };
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
