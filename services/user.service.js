"use strict";

const { default: axios } = require('axios');

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
			proxyUrl: "http://localhost:8009/kartoffel", // TODO: load the spike-proxy route from env
			searchBase: "/api/persons/search?domainusers.datasource=nonExternals",
			domainUserBase: "/api/persons/domainuser",
			personBase: "/api/persons/",
		},
		approvedRanks: [],
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
				path: "/users",
			},
			async handler(ctx) {
				return {};
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
				console.log(url);
				const res = await this.kartoffelSearchHandler(url, {});
				return res?.data | [];
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
			this.settings.approvedRanks = [
				"mega",
				"rookie"
			];
		},

		// NOTICE: Currently only for get requests
		async kartoffelSearchHandler(url, config) {
			try {
				const res = await axios.get(url, config);
				return res.data;
			} catch (err) {
				console.log(err);
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
