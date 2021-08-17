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
    createGroup: Joi.object({
        groupName: Joi.string().required(), 
        hierarchy: Joi.string().required(), 
        classification: Joi.string().valid('blue','limitedPurple','administrative').required(), 
        owner: Joi.string().required(), 
        members: Joi.array().items(Joi.string()).required(),
        type: Joi.string().required(), 
    }),
}

module.exports = schemas;