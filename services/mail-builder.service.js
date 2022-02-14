"use strict";
require('dotenv').config();
const { default: axios } = require('axios');
const logoTag = require('../assets/friendsLogo');

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const config = {
    BASE_WEBSITE_URL: process.env.BASE_WEBSITE_URL || "asd",
    MAILER_SERVICE_URL: process.env.MAILER_SERVICE_URL || "http://localhost:8000/api/sendmail",
}

module.exports = {
    name: "mail-builder",

    /**
     * Settings
     */
    settings: {
        mailUserFrom: process.env.MAIL_USER || "Friends@services.idf",
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
        async "mail.join"(payload) {
            const [creatorUser, group] = await Promise.all([
                this.broker.call('users.getByKartoffelId', { id: payload.creator }),
                this.broker.call('ad.groupById', { groupId: payload.groupId }),
            ]);
            let approverUser;
            if(payload.approver.sAMAccountName){
                approverUser = await this.broker.call(
                    'users.getPersonByDomainUser',
                    { domainuser: payload.approver.sAMAccountName }
                );
            }
            else{
                approverUser = await this.broker.call('users.getByKartoffelId', { id: payload.approver });
            }
            this.logger.info(approverUser);

            const mailObject = {
                from: this.settings.mailUserFrom,
                to: [creatorUser.mail],
                title: "test",
                html: this.joinHTML(creatorUser, group),
            };

            const mailConfirmObject = {
                from: this.settings.mailUserFrom,
                to: [approverUser.mail],
                title: "test",
                html: this.joinConfirmHTML(creatorUser, approverUser, group, payload.joinReason),
            };

            // send mail
            axios.post(config.MAILER_SERVICE_URL, mailObject).then(res => {
                this.logger.info('mail.join: Sent mail 1.');
                console.log(1);
            }).catch(err => {
                this.logger.error('Failed sending mail', err.message);
            })

            axios.post(config.MAILER_SERVICE_URL, mailConfirmObject).then(res => {
                this.logger.info('mail.join: Sent mail 2.');
                console.log(2);
            }).catch(err => {
                this.logger.error('Failed sending mail', err.message);
            })
        },

        async "mail.create"(payload) {
            const group = payload.group;
            this.logger.info(JSON.stringify(payload));
            const creatorUser = await this.broker.call('users.getByKartoffelId', { id: payload.creator });
            let approverUser;

            if(payload.approver.sAMAccountName){
                approverUser = await this.broker.call(
                    'users.getPersonByDomainUser',
                    { domainuser: payload.approver.sAMAccountName }
                );
            }
            else{
                approverUser = await this.broker.call('users.getByKartoffelId', { id: payload.approver });
            }
            this.logger.info(approverUser);
        
            const mailObject = {
                from: this.settings.mailUserFrom,
                to: [creatorUser.mail],
                title: "test",
                html: this.createHTML(creatorUser, approverUser, group),
            };

            const mailConfirmObject = {
                from: this.settings.mailUserFrom,
                to: [approverUser.mail],
                title: "test",
                html: this.createConfirmHTML(approverUser, group)
            };

            // send mail
            axios.post(config.MAILER_SERVICE_URL, mailObject).then(res => {
                this.logger.info('mail.create: Sent mail 1.');
                console.log(3);
            }).catch(err => {
                this.logger.error('Failed sending mail', err.message);
            })

            axios.post(config.MAILER_SERVICE_URL, mailConfirmObject).then(res => {
                this.logger.info('mail.create: Sent mail 2.');
                console.log(4);
            }).catch(err => {
                this.logger.error('Failed sending mail', err.message);
            })
        },

        async "mail.createSuccess"(payload) {
            const group = payload;
            const creatorUser = await this.broker.call('users.getPersonByDomainUser', { domainuser: payload.owner });
            this.logger.info('owner' + JSON.stringify(creatorUser));
        
            const mailObject = {
                from: this.settings.mailUserFrom,
                to: [creatorUser.mail],
                title: "test",
                html: this.createSuccessHTML(creatorUser, group),
            };

            // send mail
            axios.post(config.MAILER_SERVICE_URL, mailObject).then(res => {
                this.logger.info('mail.createSuccess: Sent mail 1.');
                console.log(5);
            }).catch(err => {
                this.logger.error('Failed sending mail', err.message);
            })

            axios.post(config.MAILER_SERVICE_URL, mailConfirmObject).then(res => {
                this.logger.info('mail.createSuccess: Sent mail 2.');
                console.log(6);
            }).catch(err => {
                this.logger.error('Failed sending mail', err.message);
            })
        },

        async "mail.owner"(payload) {
            const group = await this.broker.call('ad.groupById', { groupId: payload.groupId });
            let approverUser;
            if(payload.approver.sAMAccountName){
                approverUser = await this.broker.call(
                    'users.getPersonByDomainUser',
                    { domainuser: payload.approver.sAMAccountName }
                );
            }
            else{
                approverUser = await this.broker.call('users.getByKartoffelId', { id: payload.approver });
            }
            this.logger.info(approverUser);

            const mailObject = {
                from: this.settings.mailUserFrom,
                to: [approverUser.mail],
                title: "test",
                html: this.managementTransferHTML(approverUser, group)
            };

            // send mail
            axios.post(config.MAILER_SERVICE_URL, mailObject).then(res => {
                this.logger.info('mail.owner: Sent mail.');
                console.log(7);
            }).catch(err => {
                this.logger.error('Failed sending mail', err.message);
            })

        },
    },

    // mailer support//
    /**
     * Methods
     */
    methods: {

        joinHTML(creatorUser, group) {
            return `<div style="justify-content:center; align-items:center; text-align: center; font-family: Arial, Helvetica, sans-serif; direction: rtl;">
            <span style="width:300px">${logoTag.logoTag}</span>
            <br />
            <h2>בקשתך הוגשה בהצלחה</h2>
            <p style="font-size: 18px; text-align: right;">שלום ${creatorUser.fullName},</p>
            <p style="font-size: 18px; text-align: right;">בקשתך להצטרפות לקבוצה</p>
            <p style="font-size: 18px; text-align: right;">&nbsp;</p>
            <p style="font-size: 18px; text-align: right;"><strong>שם קבוצה: </strong>${group.name ? group.name : group.displayName}</p>
            <p style="font-size: 18px; text-align: right;"><strong>סוג קבוצה: </strong>${group.type === 'distribution' ? 'תפוצת מייל' : 'קבוצת אבטחה'}</p>
            <p style="font-size: 18px; text-align: right;"><strong>מנהל: </strong>${group.owner.displayName}</p>
            <br />
            <h2><strong><a href="${`${config.BASE_WEBSITE_URL}/profile`}">לצפייה בפרטי הבקשה המלאים לחץ כאן</a></strong></h2>
            </div>`
        },
        joinConfirmHTML(creatorUser, approverUser, group, joinReason) {
            return `<div style="justify-content:center; align-items:center; text-align: center; font-family: Arial, Helvetica, sans-serif; direction: rtl;">
            <span style="width:300px">${logoTag.logoTag}</span>
            <br />
            <h2>בקשה המחכה לאישורך</h2>
            <p style="font-size: 18px; text-align: right;">שלום ${creatorUser.fullName},</p>
            <p style="font-size: 18px; text-align: right;">בקשת הצטרפות לקבוצה מחכה לאישורך</p>
            <p style="font-size: 18px; text-align: right;">&nbsp;</p>
            <p style="font-size: 18px; text-align: right;"><strong>שם קבוצה: </strong>${group.name ? group.name : group.displayName}</p>
            <p style="font-size: 18px; text-align: right;"><strong>מבקש: </strong>${approverUser.fullName}</p>
            <p style="font-size: 18px; text-align: right;"><strong>סיבה: </strong>${joinReason}</p>
            <br />
            <h2><strong><a href="${`${config.BASE_WEBSITE_URL}/requests`}">לאישור או דחיית הבקשה לחץ כאן</a></strong></h2>
            </div>`
        },
        createHTML(creatorUser, approverUser, group) {
            return `<div style="justify-content:center; align-items:center; text-align: center; font-family: Arial, Helvetica, sans-serif; direction: rtl;">
            <span style="width:300px">${logoTag.logoTag}</span>
            <br />
            <h2>בקשתך הוגשה בהצלחה</h2>
            <p style="font-size: 18px; text-align: right;">שלום ${creatorUser.fullName},</p>
            <p style="font-size: 18px; text-align: right;">בקשתך ליצירת קבוצה הוגשה בהצלחה</p>
            <p style="font-size: 18px; text-align: right;">&nbsp;</p>
            <p style="font-size: 18px; text-align: right;"><strong>שם קבוצה: </strong>${group.groupName ? group.groupName : group.displayName}</p>
			<p style="font-size: 18px; text-align: right;"><strong>מנהל: </strong>${group.owner}</p>
            <p style="font-size: 18px; text-align: right;"><strong>סוג קבוצה: </strong>${group.type === 'distribution' ? 'תפוצת מייל' : 'קבוצת אבטחה'}</p>
            <p style="font-size: 18px; text-align: right;"><strong>מפקד מאשר: </strong>${approverUser.fullName}</p>
            <br />
            <h2><strong><a href="${`${config.BASE_WEBSITE_URL}/profile`}">לצפייה בפרטי הבקשה המלאים לחץ כאן</a></strong></h2>
            </div>`
        },
        createSuccessHTML(owner, group){
            return `<div style="justify-content:center; align-items:center; text-align: center; font-family: Arial, Helvetica, sans-serif; direction: rtl;">
            <span style="width:300px">${logoTag.logoTag}</span>
            <br />
            <h2>בקשתך הוגשה בהצלחה</h2>
            <p style="font-size: 18px; text-align: right;">שלום ${owner.fullName},</p>
            <p style="font-size: 18px; text-align: right;">קבוצתך נוצרה בהצלחה</p>
            <p style="font-size: 18px; text-align: right;">&nbsp;</p>
            <p style="font-size: 18px; text-align: right;"><strong>שם קבוצה: </strong>${group.groupName ? group.groupName : group.displayName}</p>
			<p style="font-size: 18px; text-align: right;"><strong>מנהל: </strong>${group.owner}</p>
            <p style="font-size: 18px; text-align: right;"><strong>סוג קבוצה: </strong>${group.type === 'distribution' ? 'תפוצת מייל' : 'קבוצת אבטחה'}</p>
            <br />
            <h2><strong><a href="${`${config.BASE_WEBSITE_URL}/profile`}">לצפייה בפרטי הבקשה המלאים לחץ כאן</a></strong></h2>
            </div>`
        },
        createConfirmHTML(approverUser, group) {
            return `<div style="justify-content:center; align-items:center; text-align: center; font-family: Arial, Helvetica, sans-serif; direction: rtl;">
            <span style="width:300px">${logoTag.logoTag}</span>
            <br />
            <h2>בקשה המחכה לאישורך</h2>
            <p style="font-size: 18px; text-align: right;">שלום ${approverUser.fullName},</p>
            <p style="font-size: 18px; text-align: right;">בקשת יצירת קבוצה מחכה לאישורך</p>
            <p style="font-size: 18px; text-align: right;">&nbsp;</p>
            <p style="font-size: 18px; text-align: right;"><strong>שם קבוצה: </strong>${group.groupName ? group.groupName : group.displayName}</p>
			<p style="font-size: 18px; text-align: right;"><strong>מנהל: </strong>${group.owner}</p>
            <p style="font-size: 18px; text-align: right;"><strong>סוג קבוצה: </strong>${group.type === 'distribution' ? 'תפוצת מייל' : 'קבוצת אבטחה'}</p>
            <br />
            <h2><strong><a href="${`${config.BASE_WEBSITE_URL}/requests`}">לאישור או דחיית הבקשה לחץ כאן</a></strong></h2>
            </div>`
        },
        managementTransferHTML(approverUser, group) {
            return `<div style="justify-content:center; align-items:center; text-align: center; font-family: Arial, Helvetica, sans-serif; direction: rtl;">
            <span style="width:300px">${logoTag.logoTag}</span>
            <br />
            <h2>בקשה המחכה לאישורך</h2>
            <p style="font-size: 18px; text-align: right;">שלום ${approverUser.fullName},</p>
            <p style="font-size: 18px; text-align: right;">בקשת העברת ניהול על קבוצה מחכה לאישורך</p>
            <p style="font-size: 18px; text-align: right;">&nbsp;</p>
            <p style="font-size: 18px; text-align: right;"><strong>שם קבוצה: </strong>${group.groupName ? group.groupName : group.displayName}</p>
            <p style="font-size: 18px; text-align: right;"><strong>מנהל נוכחי: </strong>${group.owner.displayName}</p>
            <p style="font-size: 18px; text-align: right;"><strong>כמות חברים: </strong>${group.members.length}</p>
            <p style="font-size: 18px; text-align: right;"><strong>סוג קבוצה: </strong>${group.type === 'distribution' ? 'תפוצת מייל' : 'קבוצת אבטחה'}</p>
            <br />
            <h2><strong><a href="${`${config.BASE_WEBSITE_URL}/requests`}">לאישור או דחיית הבקשה לחץ כאן</a></strong></h2>
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
