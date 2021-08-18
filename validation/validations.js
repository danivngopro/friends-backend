const { MoleculerClientError } = require("moleculer").Errors;


const isRequesterAndCreatorTheSame = (requester, creator) => {
    if (!requester || requester !== creator) {
        throw new MoleculerClientError(`Creator ${creator} and the requester ${requester} must be same person`, 400, "BAD_REQUEST");
    }
}

module.exports = { isRequesterAndCreatorTheSame };