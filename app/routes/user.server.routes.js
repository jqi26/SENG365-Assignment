const users = require('../controllers/user.server.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/users/register')
        .post(users.register);

    app.route(app.rootUrl + '/users/login')
        .post(users.login);

    app.route(app.rootUrl + '/users/logout')
        .post(users.logout);

    app.route(app.rootUrl + '/users/:id')
        .get(users.read)
        .patch(users.update);

    app.route(app.rootUrl + '/users/:id/photo')
        .get(users.getPhoto)
        .put(users.setPhoto)
        .delete(users.deletePhoto);
};