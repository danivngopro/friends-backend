"use strict";

const { default: axios } = require('axios');
const NodeCache = require('node-cache');
require('dotenv').config();

const kartoffelCaching = new NodeCache();

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: "users",

	/**
	 * Settings
	 */
	settings: {
		kartoffel: {
			proxyUrl: process.env.OUTGOING_PROXY_URL || "http://outgoing-proxy-service:8010/kartoffel",
			searchBase: "/api/persons/search?domainusers.datasource=nonExternals",

			domainUserBase: "/api/persons/domainuser",
			personBase: "/api/persons/",
			cacheTTL: process.env.CACHE_TTL || 7200000,
		},
		approvedRanks: [],
		defaultApproverIds: [],
		sortingRanks: {
			"ראל": 1,
			"אלף": 2,
			"תאל": 3,
			"אלם": 4,
			"סאל": 5,
			"רסן": 6,
			"rookie": 7,
		}
	},

	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {

		/**
		 * Requests the AD service to search a user
		 * @param {String} partialName - partial name of the user
		 */
		searchUsers: {
            rest: {
				method: "GET",
				path: "/",
			},
			params: {
				partialName: "string"
			},
			async handler(ctx) {
				return await this.broker.call('ad.users', { partialName: ctx.params.partialName });
			},
        },

		/**
		 * Requests the Kartoffel to get person by his id
		 * @param {String} kartoffelId
		 */
		getByKartoffelId: {
			rest: {
				method: "GET",
				path: "/kartoffel/:id",
			},
		   async handler(ctx) {
			const res = await axios.get(
				`${this.settings.kartoffel.proxyUrl}${this.settings.kartoffel.personBase}/${ctx.params.id}`);
			return res.data;
		   },
        },

		/**
		 * Requests the Kartoffel to get person by his domain user id
		 * @param {String} domainuser - a unique domain user id
		 */
		getPersonByDomainUser: {
			rest: {
				method: "GET",
				path: "/domainuser/:domainuser",
			},
			async handler(ctx) {
				const res = await axios.get(
					`${this.settings.kartoffel.proxyUrl}${this.settings.kartoffel.domainUserBase}/${ctx.params.domainuser}`);
				return res.data;
			},
        },

		isSuper: {
			rest: {
				method: "GET",
				path: "/super",
			},
			async handler(ctx) {
				return this.settings.defaultApproverIds.includes(ctx.meta.user.id);
			}
		},

		/**
		 * Requests the Kartoffel to search a user
		 * @param {String} partialName - partial name of the approver
		 */
        searchApprover: {
			rest: {
				method: "GET",
				path: "/approvers",
			},
			params: {
				partialName: "string",
			},
			async handler(ctx) {
				try {
					const { params, meta } = ctx;
					console.time("searchApprover");
					const hierarchyFilter = meta.user.hierarchy.length > 1 ? meta.user.hierarchy[meta.user.hierarchy.length - 2] : meta.user.hierarchy[meta.user.hierarchy.length - 1];
					const users = await this.kartoffelSearchHandler(params.partialName, hierarchyFilter);
					this.logger.info(users);
					console.timeEnd("searchApprover");
					return users || [];
				} catch (err) {
					ctx.meta.$statusCode = err.name === 'ValidationError' ? 400 : err.status || 500;
                    return { name: err.name, message: err?.response?.message || err.message, success: false };
				}
			},
        },

		/**
		 * @params user - the authenticated user
		 * @returns whether the user is an approver
		 */
        isApprover: {
			rest: {
				method: "GET",
				path: "/approver",
			},
			async handler(ctx) {
				const user = ctx.meta.user;
				if (user?.rank) {
					return this.settings.approvedRanks.includes(user.rank);
				}
				return false;
			},
        },
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
		buildSearchApproverUrl(partialName) {
			let url = `${this.settings.kartoffel.proxyUrl}${this.settings.kartoffel.searchBase}`
			for (let rank of this.settings.approvedRanks) {
				url += `&rank=${rank}`;
			}
			return url;
		},

		loadApprovedRanks() {
			// TODO: Enter all approved ranks (maybe do that from local file configured in env)
			if (!process.env.PRODUCTION) {
				this.settings.approvedRanks = [
					"mega",
					"rookie"
				];
			}
			const approvedRanks = [ "ראל", "רסן", "סאל", "אלם", "תאל", "אלף" ];
			this.settings.approvedRanks = this.settings.approvedRanks.concat(approvedRanks);
		},

		async cacheApprovers() {
			await this.loadDefaultApprovers();
			setInterval(async () => {
				await this.loadDefaultApprovers();
			}, this.settings.kartoffel.cacheTTL);
		},

		async loadDefaultApprovers() {
			const responses = await Promise.allSettled(this.settings.defaultApproverIds.map(async (kartoffelId) => {
				return (await axios.get(`${this.settings.kartoffel.proxyUrl}${this.settings.kartoffel.searchBase}${kartoffelId}`))?.data
			}));
			let foundedUsers = [];

			responses.map((currentResponse) => {
				if (currentResponse.status === 'fulfilled') {
					foundedUsers.push(currentResponse.value);
				}
			});

			kartoffelCaching.set("defaultApprovers", foundedUsers);
		},

		// NOTICE: Currently only for get requests
		async kartoffelSearchHandler(partialName, hierarchyValue) {
			try {
				console.log("kartoffelSearchHandler");

				const responses = await Promise.allSettled(
					this.settings.approvedRanks.map(async(rank) => {
						return (await axios.get(`${this.settings.kartoffel.proxyUrl}${this.settings.kartoffel.searchBase}`, { params: {
							fullName: partialName,
							rank,
							status: "active"
						}}))?.data;
					})
				);

				let foundedUsers = []
				
				responses.map((currentResponse) => {
					if (currentResponse.status === 'fulfilled') {
						for (const currUser of currentResponse.value) {
							if (currUser.hierarchy.includes(hierarchyValue)) {
								foundedUsers.push(currentResponse.value);
							}
						}
					}
				});

				console.log(foundedUsers);
				foundedUsers = foundedUsers.sort((firstValue, secondValue) => this.settings.sortingRanks[firstValue.rank] >= this.settings.sortingRanks[secondValue.rank]);

				const defaultUsers = kartoffelCaching.get("defaultApprovers") || [];

				return [...defaultUsers, ...foundedUsers];
			} catch (err) {
				this.logger.info(err);
				if (err.response && err.response.status) {
				  const statusCode = err.response.status;
				  if (statusCode === 404) {
					return null;
				  }
				}
				throw err;
			}
		},
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
		this.loadApprovedRanks();
		this.cacheApprovers();
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {

	}
};
