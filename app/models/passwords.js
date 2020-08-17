const bcrypt = require('bcryptjs');

exports.hash = async function (password) {
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);
    return hash;
}