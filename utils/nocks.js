const nock = require('nock');

const { ad } = require('../config');

module.exports = class AdNockManager {
  static setNocks() {
    const url = ad.AD_SERVICE_URL;
    console.log("nockurl",url);
    const scope = nock(url).persist();

    // Post requests
    scope.post('/Group').reply(200, { success: true, message: 'success' });
    
    // Get requests
    // * Keep the order of the routes
    scope
      .get('/User')
      .query(() => true)
      .reply(200, { success: true, message: 'success' });
    scope
      .get(/\/User\/[a-zA-Z0-9\-]*\/groups/g)
      .reply(200, { success: true, message: 'success' });
    scope
      .get('/Group/Distribution')
      .query(
        () => true
      )
      .reply(200, { success: true, message: 'success' });
    scope
      .get('/Group/Security')
      .query(
        () => true
      )
      .reply(200, { success: true, message: 'success' });

    scope
      .get(/\/Group\/User\/[a-zA-Z0-9\-]*/g)
      .reply(200, { success: true, message: 'success' });

    scope
      .get(/\/Group\/[a-zA-Z0-9\-]*/g)
      .reply(200, { success: false, message: 'success', members: [] });

    // Put requests
    scope
      .put(
        '/Group/users'
        // , body
      )
      .reply(200, { success: true, message: 'success' });
    scope
      .put(
        '/Group/user'
        // , body
      )
      .reply(200, { success: true, message: 'success' });

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
      .reply(200, { success: true, message: 'success' });

    scope
      .put(
        '/Group/displayName'
        // , {
        //   id: ctx.params.groupId,
        //   type: ad.types[field],
        //   data: {
        //     groupId: ctx.params.groupId,
        //     value,
        //   },
        // }
      )
      .reply(200, { success: true, message: 'success' });

      scope
      .put(
        '/Group/name'
        // , {
        //   id: ctx.params.groupId,
        //   type: ad.types[field],
        //   data: {
        //     groupId: ctx.params.groupId,
        //     value,
        //   },
        // }
      )
      .reply(200, { success: true, message: 'success' });

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
      .reply(200, { success: true, message: 'success' });
    scope
      .delete(
        '/Group/users'
        // , body
      )
      .reply(200, { success: true, message: 'success' });
    scope
      .delete(
        '/Group/user'
        // , body
      )
      .reply(200, { success: true, message: 'success' });
  }
};
