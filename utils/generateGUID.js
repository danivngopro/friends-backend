const generateGUID = async (broker, type) => {
    return broker.call('groupId.getGroupId', { type });
}

module.exports = generateGUID;