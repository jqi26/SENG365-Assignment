const petitions = require('../controllers/petition.server.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/petitions')
        .get(petitions.getAll)
        .post(petitions.create);

    app.route(app.rootUrl + '/petitions/categories')
        .get(petitions.getAllCategories);

    app.route(app.rootUrl + '/petitions/:id')
        .get(petitions.read)
        .patch(petitions.update)
        .delete(petitions.delete);

    app.route(app.rootUrl + '/petitions/:id/signatures')
        .get(petitions.getSignatures)
        .post(petitions.createSignature)
        .delete(petitions.deleteSignature);

    app.route(app.rootUrl + '/petitions/:id/photo')
        .get(petitions.getPhoto)
        .put(petitions.setPhoto);
};