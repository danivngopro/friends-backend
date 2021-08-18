"use strict";

const { default: axios } = require('axios');
require('dotenv').config();

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
			proxyUrl: process.env.PROXY_URL || "http://localhost:8010/kartoffel", // TODO: load the spike-proxy route from env
			searchBase: process.env.SEARCH_BASE || "/api/persons/search?domainusers.datasource=nonExternals",
			domainUserBase: process.env.DOMAINUSER_BASE || "/api/persons/domainuser",
			personBase: process.env.PERSON_BASE || "/api/persons/",
		},
		approvedRanks: process.env.APPROVED_RANKS || [],
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
            params: {
				id: "string",
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
			 params: {
				 domainuser: "string",
			 },
			async handler(ctx) {
				const res = await axios.get(
					`${this.settings.kartoffel.proxyUrl}${this.settings.kartoffel.domainUserBase}/${ctx.params.domainuser}`);
				return res.data;
			},
        },

		/**
		 * Requests the Kartoffel to search a user
		 * @param {String} partialname - partial name of the approver
		 */
        searchApprover: {
			async handler(ctx) {
				const url = this.buildSearchApproverUrl(ctx.params.partialname);
				this.logger.info(url);
				const users = await this.kartoffelSearchHandler(url, {params: {fullName: ctx.params.partialname}});
				this.logger.info(users);
				return users || [];
			},
        },

		/**
		 * @params user - the authenticated user
		 * @returns whether the user is an approver
		 */
        isApprover: {
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

		// NOTICE: Currently only for get requests
		async kartoffelSearchHandler(url, config) {
			try {
				const res = await axios.get(url, config);
				return res.data;
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
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {

	}
};
