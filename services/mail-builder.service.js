"use strict";
const axios = require('axios');
const logoTag = require('../assets/friendsLogo');
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const config = {
    BASE_WEBSITE_URL:"asd",
    MAILER_SERVICE_URL:"http://localhost:8000/api/sendmail",    
}

module.exports = {
	name: "mail-builder",

	/**
	 * Settings
	 */
	settings: {
        mailUserFrom: process.env.MAIL_USER || null,
	},

	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {

	},

	/**
	 * Events
	 */
	events: {
		async "mail.join" (payload) {
            const mailObject = {
                from: this.settings.mailUserFrom,
                to: ["selina.mayert92@ethereal.email"],
                title: "test",
                html: await this.joinHTML(payload)
            };

			const mailConfirmObject = {
                from: this.settings.mailUserFrom,
                to: ["selina.mayert92@ethereal.email"],
                title: "test",
                html: await this.joinConfirmHTML(payload)
            };

            const requestData = {...payload};
            // TODO: make sure to populate ids with ctx.call...kartofel...

            // send mail
            axios.post(config.MAILER_SERVICE_URL, mailObject).then(res=>{
                this.logger.info('Sent mail.');
            }).catch(err=>{
                this.logger.error('Failed sending mail',err.message);
            })

			axios.post(config.MAILER_SERVICE_URL, mailConfirmObject).then(res=>{
                this.logger.info('Sent mail.');
            }).catch(err=>{
                this.logger.error('Failed sending mail',err.message);
            })
		},

		async "mail.create" (payload) {
            const mailObject = {
                from: this.settings.mailUserFrom,
                to: ["selina.mayert92@ethereal.email"],
                title: "test",
				html: await this.createHTML(payload)
            };

			const mailConfirmObject = {
                from: this.settings.mailUserFrom,
                to: ["selina.mayert92@ethereal.email"],
                title: "test",
				html: await this.createConfirmHTML(payload)
            };

            const requestData = {...payload};
            // TODO: make sure to populate ids with ctx.call...kartofel...

            // send mail
            axios.post(config.MAILER_SERVICE_URL, mailObject).then(res=>{
                this.logger.info('Sent mail.');
            }).catch(err=>{
                this.logger.error('Failed sending mail',err.message);
            })

			axios.post(config.MAILER_SERVICE_URL, mailConfirmObject).then(res=>{
                this.logger.info('Sent mail.');
            }).catch(err=>{
                this.logger.error('Failed sending mail',err.message);
            })
		},
		
		async "mail.owner" (payload) {
            const mailObject = {
                from: this.settings.mailUserFrom,
                to: ["selina.mayert92@ethereal.email"],
                title: "test",
                html: await this.ManagementTransferHTML(payload)
            };

            const requestData = {...payload};
            // TODO: make sure to populate ids with ctx.call...kartofel...

            // send mail
            axios.post(config.MAILER_SERVICE_URL, mailObject).then(res=>{
                this.logger.info('Sent mail.');
            }).catch(err=>{
                this.logger.error('Failed sending mail',err.message);
            })

		},
	},

    // mailer support//
	/**
	 * Methods
	 */
	methods: {

        async joinHTML(requestData) {
            const creator = await this.broker.call("users.getByKartoffelId", {id: requestData.creator}) 
            this.logger.info(creator)
            return `<div style="justify-content:center; align-items:center; text-align: center; font-family: Arial, Helvetica, sans-serif; direction: rtl;">
            <span style="width:300px">${logoTag.logoTag}</span>
            <br />
            <h2>בקשתך הוגשה בהצלחה</h2>
            <p style="font-size: 18px; text-align: right;">שלום ${requestData.creator},</p>
            <p style="font-size: 18px; text-align: right;">בקשתך להצטרפות לקבוצה</p>
            <p style="font-size: 18px; text-align: right;">&nbsp;</p>
            <p style="font-size: 18px; text-align: right;"><strong>שם קבוצה: </strong>${requestData}</p>
            <p style="font-size: 18px; text-align: right;"><strong>סוג קבוצה: </strong>${requestData}</p>
            <p style="font-size: 18px; text-align: right;"><strong>מנהל: </strong>${requestData}</p>
            <br />
            <h2><strong><a href="${`${config.BASE_WEBSITE_URL}/profile/userID`}">לצפייה בפרטי הבקשה המלאים לחץ כאן</a></strong></h2>
            </div>`
        },
		async joinConfirmHTML(requestData) {
            return `<div style="justify-content:center; align-items:center; text-align: center; font-family: Arial, Helvetica, sans-serif; direction: rtl;">
            <span style="width:300px">${logoTag.logoTag}</span>
            <br />
            <h2>בקשה המחכה לאישורך</h2>
            <p style="font-size: 18px; text-align: right;">שלום ${requestData.creator},</p>
            <p style="font-size: 18px; text-align: right;">בקשת הצטרפות לקבוצה מחכה לאישורך</p>
            <p style="font-size: 18px; text-align: right;">&nbsp;</p>
            <p style="font-size: 18px; text-align: right;"><strong>שם קבוצה: </strong>${requestData}</p>
            <p style="font-size: 18px; text-align: right;"><strong>מבקש: </strong>${requestData}</p>
            <p style="font-size: 18px; text-align: right;"><strong>סיבה: </strong>${requestData}</p>
            <br />
            <h2><strong><a href="${`${config.BASE_WEBSITE_URL}/profile/userID`}">לאישור או דחיית הבקשה לחץ כאן</a></strong></h2>
            </div>`
        },
		async createHTML(requestData) {
            return `<div style="justify-content:center; align-items:center; text-align: center; font-family: Arial, Helvetica, sans-serif; direction: rtl;">
            <span style="width:300px">${logoTag.logoTag}</span>
            <br />
            <h2>בקשתך הוגשה בהצלחה</h2>
            <p style="font-size: 18px; text-align: right;">שלום ${requestData.creator},</p>
            <p style="font-size: 18px; text-align: right;">בקשתך ליצירת קבוצה הוגשה בהצלחה</p>
            <p style="font-size: 18px; text-align: right;">&nbsp;</p>
            <p style="font-size: 18px; text-align: right;"><strong>שם קבוצה: </strong>${requestData}</p>
			<p style="font-size: 18px; text-align: right;"><strong>מנהל: </strong>${requestData}</p>
            <p style="font-size: 18px; text-align: right;"><strong>סוג קבוצה: </strong>${requestData}</p>
            <p style="font-size: 18px; text-align: right;"><strong>מפקד מאשר: </strong>${requestData}</p>
            <br />
            <h2><strong><a href="${`${config.BASE_WEBSITE_URL}/profile/userID`}">לצפייה בפרטי הבקשה המלאים לחץ כאן</a></strong></h2>
            </div>`
        },
		async createConfirmHTML(requestData) {
            return `<div style="justify-content:center; align-items:center; text-align: center; font-family: Arial, Helvetica, sans-serif; direction: rtl;">
            <span style="width:300px">${logoTag.logoTag}</span>
            <br />
            <h2>בקשה המחכה לאישורך</h2>
            <p style="font-size: 18px; text-align: right;">שלום ${requestData.creator},</p>
            <p style="font-size: 18px; text-align: right;">בקשת יצירת קבוצה מחכה לאישורך</p>
            <p style="font-size: 18px; text-align: right;">&nbsp;</p>
            <p style="font-size: 18px; text-align: right;"><strong>שם קבוצה: </strong>${requestData}</p>
			<p style="font-size: 18px; text-align: right;"><strong>מנהל: </strong>${requestData.group}</p>
            <p style="font-size: 18px; text-align: right;"><strong>סוג קבוצה: </strong>${requestData}</p>
            <br />
            <h2><strong><a href="${`${config.BASE_WEBSITE_URL}/profile/userID`}">לאישור או דחיית הבקשה לחץ כאן</a></strong></h2>
            </div>`
        },
		async manageTransferHTML(requestData) {
            return `<div style="justify-content:center; align-items:center; text-align: center; font-family: Arial, Helvetica, sans-serif; direction: rtl;">
            <span style="width:300px">${logoTag.logoTag}</span>
            <br />
            <h2>בקשה המחכה לאישורך</h2>
            <p style="font-size: 18px; text-align: right;">שלום ${requestData.creator},</p>
            <p style="font-size: 18px; text-align: right;">בקשת העברת ניהול על קבוצה מחכה לאישורך</p>
            <p style="font-size: 18px; text-align: right;">&nbsp;</p>
            <p style="font-size: 18px; text-align: right;"><strong>שם קבוצה: </strong>${requestData}</p>
            <p style="font-size: 18px; text-align: right;"><strong>מנהל נוכחי: </strong>${requestData}</p>
            <p style="font-size: 18px; text-align: right;"><strong>כמות חברים: </strong>${requestData}</p>
            <p style="font-size: 18px; text-align: right;"><strong>סוג קבוצה: </strong>${requestData}</p>
            <br />
            <h2><strong><a href="${`${config.BASE_WEBSITE_URL}/profile/userID`}">לאישור או דחיית הבקשה לחץ כאן</a></strong></h2>
            </div>`
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

	},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {

	}
};
