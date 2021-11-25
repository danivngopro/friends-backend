const nock = require('nock');

const { ad } = require('../config');

module.exports = class AdNockManager {
  static setNocks() {
    const url = ad.AD_SERVICE_URL;

    const scope = nock(url).persist();

    // Post requests
    scope.post('/Group').reply(200, 'good');

    // Get requests
    scope
      .get('/User')
      // .query((query) => !!query.user)
      .reply(200, 'good');
    //oiuhl
    scope.get('/User/[a-zA-Z0-9-]*/g/groups').reply(200, 'good');
    scope
      .get('/Group/Distribution')
      // .query({
      //   group: ctx.params.partialName,
      // })
      .reply(200, 'good');
    scope
      .get('/Group/Security')
      // .query({
      //   group: ctx.params.partialName,
      // })
      .reply(200, 'good');
    scope.get('/Group/User/[a-zA-Z0-9-]*/g').reply(200, 'good');
    scope.get('/Group/[a-zA-Z0-9-]*/g').reply(200, 'good');

    // Put requests
    scope.put('/Group/users'
    // , body
    ).reply(200, 'good');
    scope.put('/Group/user'
    // , body
    ).reply(200, 'good');
    scope
      .put(
        '/Group/owner'
        // , {
        //   id: ctx.params.groupId,
        //   type: ad.types['owner'],
        //   data: {
        //     groupId: ctx.params.groupId,
        //     value: ctx.params.owner,
        //   },
        // }
      )
      .reply(200, 'good');
    scope
      .put(
        '/Group/[a-zA-Z0-9-]*/g'
        // , {
        //   id: ctx.params.groupId,
        //   type: ad.types[field],
        //   data: {
        //     groupId: ctx.params.groupId,
        //     value,
        //   },
        // }
      )
      .reply(200, 'good');

    // Delete requests
    scope
      .delete(
        '/Group'
        // , {
        //   data: {
        //     data: {
        //       groupId: ctx.params.groupId,
        //     },
        //     id: ctx.params.groupId,
        //     type: ad.types.delete,
        //   },
        // }
      )
      .reply(200, 'good');
    scope
      .delete(
        '/Group/users'
        // , body
      )
      .reply(200, 'good');
    scope
      .delete(
        '/Group/user'
        // , body
      )
      .reply(200, 'good');
  }
};
