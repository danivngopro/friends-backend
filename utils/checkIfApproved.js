const { approve } = require("../config");
const { MoleculerClientError } = require("moleculer").Errors;

/**
 * for the event 'CREATE', we know that our current members count is 0, 
 * if the event is update, we should check first what is the current members count in the existed group
 * @param {*} broker 
 * @param {*} addedMembersCount 
 * @param {*} groupId => only neccesarry for UPDATE event 
 * @param {*} event 
 */
const checkIfApproved = async (broker, addedMembersCount, groupId, event = 'CREATE') => {
    let groupCount = addedMembersCount;

    if (event === 'UPDATE') {
        const currentGroup = await axios.get(`${ad.AD_SERVICE_URL}/Group/${groupId}`);
        groupCount += currentGroup.members.length;
    }

    // TODO: how to know if a user is superuser?
    const isApprover = await broker.call('users.isApprover');

    if (!isApprover && groupCount > approve.NOT_APPROVED_LIMIT) {
        throw new MoleculerClientError(`You are not allowed to create group with a size greather then ${approve.NOT_APPROVED_LIMIT}`, 400, "BAD_REQUEST")
    } else if (isApprover && groupCount > approve.APPROVED_LIMIT) {
        throw new MoleculerClientError(`You are not allowed to create group with a size greather then ${approve.APPROVED_LIMIT}`, 400, "BAD_REQUEST")
    }
}

module.exports = checkIfApproved;