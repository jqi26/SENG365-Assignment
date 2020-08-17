const User = require('../models/user.server.model');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const app_dir = path.dirname(require.main.filename);

exports.register = async function(req, res) {
    try {
        if (!req.body.hasOwnProperty('name') || !req.body.hasOwnProperty('email') || !req.body.hasOwnProperty('password')) {
            res.status(400).send("A required field is missing");
            return;
        }
        let user_data = {
            "name": req.body.name,
            "email": req.body.email,
            "password": req.body.password,
            "city": req.body.city,
            "country": req.body.country
        };
        let name = user_data['name'];
        let email = user_data['email'];
        let password = user_data['password'];
        let city = null;
        let country = null;

        if (!isNaN(name)|| !isNaN(email) || !isNaN(password)) {
            res.status(400).send();
            return;
        }

        if (req.body.hasOwnProperty('city')) {
            city = user_data['city'];
            if (!isNaN(city)) {
                res.status(400).send();
                return;
            }
        }
        if (req.body.hasOwnProperty('country')) {
            country = user_data['country'];
            if (!isNaN(country)) {
                res.status(400).send();
                return;
            }
        }

        const usersWithEmail = await User.readByEmail(email);
        if (!email.includes('@')) {
            res.status(400).send("Invalid email");
        } else if (usersWithEmail.length != 0) {
            res.status(400).send("User with that email already exists");
        } else {
            const result = await User.register(name, email, password, city, country);
            res.status(201).send(JSON.parse('{\"userId\": ' + result.insertId + '}'));
        }
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.login = async function(req, res) {
    try {
        if (!req.body.hasOwnProperty('email') || !req.body.hasOwnProperty('password')) {
            res.status(400).send("A required field is missing");
            return;
        }
        let user_data = {
            "email": req.body.email,
            "password": req.body.password,
        };
        let email = user_data['email'];
        let password = user_data['password'];

        if (!isNaN(email) || !isNaN(password)) {
            res.status(400).send();
            return;
        }

        const result = await User.login(email, password);

        if (typeof result === 'string' || result instanceof String) {
            res.status(400).send(result);
        } else {
            const id = result[0].user_id;
            const token = result[0].auth_token;
            res.status(200).send(JSON.parse('{\"userId\": ' + id + ', \"token\": \"' + token + '\"}'));
        }
    } catch (err) {
        res.status(500).send(err);
    }
};


exports.logout = async function(req, res) {
    try {
        const xAuthorization = req.get('X-Authorization');
        if (xAuthorization == null || xAuthorization === "") {
            res.status(401).send("No X-Authorization supplied");
        } else {
            const user = await User.readByToken(xAuthorization);
            if (user.length == 0) {
                res.status(401).send("No user with that token");
                return;
            }
            await User.logout(user[0].user_id);
            res.status(200).send();
        }
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.read = async function(req, res) {
    try {
        const id = req.params.id;
        const xAuthorization = req.get('X-Authorization');

        const result = await User.read(id);
        if (result.length == 0) {
            res.status(404).send('No User with that id');
        } else {
            let json = "{\"name\": \"" + result[0].name + "\", \"city\": \"" + result[0].city +
                "\", \"country\": \"" + result[0].country;
            if (xAuthorization === result[0].auth_token) {
                json += "\", \"email\": \"" + result[0].email;
            }
            json += "\"}";
            res.status(200).send(JSON.parse(json));
        }
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.update = async function(req, res) {
    try {
        const id = req.params.id;
        const xAuthorization = req.get('X-Authorization');
        if (xAuthorization == null || xAuthorization === "") {
            res.status(401).send("No X-Authorization supplied");
            return;
        }
        const userCheck = await User.readByToken(xAuthorization);
        if (userCheck.length === 0) {
            res.status(401).send();
            return;
        }

        const user = await User.read(id);

        if (user.length == 0) {
            res.status(404).send("No user with that id");
            return;
        }
        if (xAuthorization != user[0].auth_token) {
            res.status(403).send("Not authorized to edit");
            return;
        }

        if (!req.body.hasOwnProperty('password')) {
            res.status(400).send("The password is missing");
            return;
        }

        let user_data = {
            "name": req.body.name,
            "email": req.body.email,
            "password": req.body.password,
            "currentPassword": req.body.currentPassword,
            "city": req.body.city,
            "country": req.body.country
        };
        let name = null;
        let email = null;
        let currentPassword = null;
        let city = null;
        let country = null;

        if (req.body.hasOwnProperty('name')) {
            name = user_data['name'];
            if (!isNaN(name)) {
                res.status(400).send();
                return;
            }
        }
        if (req.body.hasOwnProperty('email')) {
            email = user_data['email'];
            if (!isNaN(email) || !email.includes('@')) {
                res.status(400).send("Invalid new email");
                return;
            }
            const usersWithEmail = await User.readByEmail(email);
            if (usersWithEmail.length !== 0 && Number(usersWithEmail[0].user_id) !== Number(id)) {
                res.status(400).send("User with that email already exists");
                return;
            }
        }

        let password = user_data['password'];
        if (!isNaN(password)) {
            res.status(400).send();
            return;
        }
        if (!bcrypt.compareSync(password, user[0].password)) {
            if (!req.body.hasOwnProperty('currentPassword')) {
                res.status(400).send('Must supply current password to change it');
                return;
            }
            currentPassword = user_data['currentPassword'];
            if (!isNaN(currentPassword)) {
                res.status(400).send();
                return;
            }
            if (!bcrypt.compareSync(currentPassword, user[0].password)) {
                res.status(400).send('Current password is incorrect');
                return;
            }
        }

        if (req.body.hasOwnProperty('city')) {
            city = user_data['city'];
            if (!isNaN(city)) {
                res.status(400).send();
                return;
            }
        }
        if (req.body.hasOwnProperty('country')) {
            country = user_data['country'];
            if (!isNaN(country)) {
                res.status(400).send();
                return;
            }
        }

        await User.update(id, name, email, password, city, country);
        res.status(200).send();
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.getPhoto = async function(req, res) {
    try {
        const id = req.params.id;
        const result = await User.getPhoto(id);

        if (!result) {
            res.status(404).send("No User with that id");
            return;
        }
        if (result[0].photo_filename == null) {
            res.status(404).send("User does not have a photo");
            return;
        }

        let default_path = app_dir + "/storage/photos";
        res.status(200).sendFile(default_path + "/" + result[0].photo_filename);
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.setPhoto = async function(req, res) {
    try {
        const id = req.params.id;
        const xAuthorization = req.get('X-Authorization');
        if (xAuthorization == null) {
            res.status(401).send('Must supply an X-Authorization header');
            return;
        }
        const userCheck = await User.readByToken(xAuthorization);
        if (userCheck.length === 0) {
            res.status(401).send();
            return;
        }

        const contentType = req.get('Content-Type');
        if (contentType != "image/png" && contentType != "image/jpeg" && contentType != "image/gif") {
            res.status(400).send('Image must be a png, jpeg, or gif');
            return;
        }

        const imageType = contentType.substring(6, contentType.length);
        const filename = "user_" + id + "." + imageType;

        const defaultPath = "./storage/photos/";

        const result = await User.setPhoto(id, xAuthorization, filename);
        if (result == "BAD TOKEN") {
            res.status(403).send("Token does not match the user's token");
            return;
        }
        if (result == "BAD ID") {
            res.status(404).send("No User with that id");
            return;
        }
        if (result == "BAD SAVE") {
            res.status(500).send("Error saving image");
            return;
        }
        fs.writeFile(defaultPath + filename, req.body, (err) => {
            if (err) throw err;
        });
        res.status(result).send();
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.deletePhoto = async function(req, res) {
    try {
        const id = req.params.id;
        const xAuthorization = req.get('X-Authorization');
        if (xAuthorization == null) {
            res.status(401).send('Must supply an X-Authorization header');
            return;
        }
        const userCheck = await User.readByToken(xAuthorization);
        if (userCheck.length === 0) {
            res.status(401).send();
            return;
        }

        const result = await User.deletePhoto(id, xAuthorization);
        if (result == "BAD TOKEN") {
            res.status(403).send("Token does not match the user's token");
            return;
        }
        if (result == "BAD ID") {
            res.status(404).send("No User with that id");
            return;
        }
        res.status(200).send();
    } catch (err) {
        res.status(500).send(err);
    }
};