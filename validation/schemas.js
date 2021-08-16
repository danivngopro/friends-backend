const Joi = require('joi');

const schemas = {
    partialName: Joi.object({
        partialName: Joi.string().required()
    }),
    usersActionOnGroup: Joi.object({
        groupId: Joi.string().required(),
        users: Joi.array().items(Joi.string()).min(1).required()
    }).options({ abortEarly: false }),
    groupId: Joi.object({
        groupId: Joi.string().required()
    }).unknown(),
    userId: Joi.object({
        userId: Joi.string().required()
    }),
}

module.exports = {
    schemas
 }