const Petition = require('../models/petition.server.model');
const User = require('../models/user.server.model');
const path = require('path');
const app_dir = path.dirname(require.main.filename);
const fs = require('fs');

exports.getAll = async function(req, res) {
    try {
        const startIndex = req.query.startIndex;
        const count = req.query.count;
        const q = req.query.q;
        const categoryId = req.query.categoryId;
        const authorId = req.query.authorId;
        const sortBy = req.query.sortBy;

        if ((startIndex != null && (isNaN(startIndex) || startIndex < 0)) ||
            (count != null && (isNaN(count) || count < 0)) || (q != null && q.length === 0) ||
            (categoryId != null && (isNaN(categoryId) || categoryId < 0)) ||
            (authorId != null && (isNaN(authorId) || authorId < 0)) || (sortBy != null &&
                !["ALPHABETICAL_ASC", "ALPHABETICAL_DESC", "SIGNATURES_ASC", "SIGNATURES_DESC"].includes(sortBy))) {
            res.status(400).send();
            return;
        }

        let numSearchParameters = 0;
        if (q != null) {
            numSearchParameters++;
        }
        if (categoryId != null) {
            numSearchParameters++;
        }
        if (authorId != null) {
            numSearchParameters++;
        }
        const result = await Petition.getAll(numSearchParameters, q, categoryId, authorId, sortBy);

        if (startIndex == null && count == null) {
            res.status(200).send(result);
        } else if (startIndex != null && count == null) {
            res.status(200).send(result.slice(Number(startIndex), result.length));
        } else if (startIndex == null && count != null) {
            res.status(200).send(result.slice(0, Number(count)));
        } else {
            res.status(200).send(result.slice(Number(startIndex), Number(startIndex) + Number(count)));
        }
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.create = async function(req, res) {
    try {
        const xAuthorization = req.get('X-Authorization');
        if (xAuthorization == null) {
            res.status(401).send('Must supply an X-Authorization header');
            return;
        }
        if (!req.body.hasOwnProperty('title')) {
            res.status(400).send("The title is missing");
            return;
        }
        let petition_data = {
            "title": req.body.title,
            "description": req.body.description,
            "categoryId": req.body.categoryId,
            "closingDate": req.body.closingDate
        };
        let title = petition_data['title'];
        let description = null;
        let categoryId = petition_data['categoryId'];
        let closingDate = null;

        if (title == "" || !isNaN(title) || isNaN(categoryId)) {
            res.status(400).send();
            return;
        }

        if (req.body.hasOwnProperty('description')) {
            description = petition_data['description'];
            if (!isNaN(description)) {
                res.status(400).send();
                return;
            }
        }
        if (req.body.hasOwnProperty('closingDate')) {
            closingDate = petition_data['closingDate'];
            if (!isNaN(closingDate)) {
                res.status(400).send();
                return;
            }
            closingDate = closingDate.replace(" ", "T");
            closingDate = new Date(closingDate);
        }

        const today = new Date();
        if (closingDate != null && today >= closingDate) {
            res.status(400).send("The date must be in the future");
            return;
        }
        const result = await Petition.create(title, description, xAuthorization, categoryId, today, closingDate);
        if (result == "BAD TOKEN") {
            res.status(401).send("X-Authorization does not match any user");
            return;
        }
        if (result == "BAD CATEGORY") {
            res.status(400).send("No Category with that CategoryID");
            return;
        }
        res.status(201).send(JSON.parse('{\"petitionId\": ' + result.insertId + '}'));
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.read = async function(req, res) {
    try {
        const id = req.params.id;
        const petition = await Petition.read(id);

        if (petition.length == 0) {
            res.status(404).send("No Petition with that id.");
            return;
        }

        const user = await User.read(petition[0].author_id);
        const category = await Petition.getCategory(petition[0].category_id);
        let json = "{\"petitionId\": " + petition[0].id +
            ", \"title\": \"" + petition[0].title +
            "\", \"category\": \"" + category[0].name +
            "\", \"authorName\": \"" + user[0].name +
            "\", \"signatureCount\": " + petition[0].signatureCount +
            ", \"description\": \"" + petition[0].description.replace(/"/g, '\\"').replace(/\n/g, "\\n") +
            "\", \"authorId\": " + petition[0].author_id +
            ", \"authorCity\": \"" + user[0].city +
            "\", \"authorCountry\": \"" + user[0].country +
            "\", \"createdDate\": \"" + formatDate(petition[0].created_date) +
            "\", \"closingDate\": \"";
        if (petition[0].closing_date == null) {
            json += null + "\"}";
        } else {
            json += formatDate(petition[0].closing_date) + "\"}";
        }
        res.status(200).send(JSON.parse(json));
    } catch (err) {
        res.status(500).send(err);
    }
};

function formatDate(date) {
    let result = date.getFullYear() + "-" + getTwoDigitFormat(date.getMonth() + 1) + "-" +
        getTwoDigitFormat(date.getDate());
    result += "T" + getTwoDigitFormat(date.getHours()) + ":" + getTwoDigitFormat(date.getMinutes()) + ":" +
        getTwoDigitFormat(date.getSeconds()) + ":" + date.getMilliseconds() + "Z";
    return result;
}

function getTwoDigitFormat(monthOrDate) {
    return (monthOrDate < 10) ? '0' + monthOrDate : '' + monthOrDate;
}

exports.update = async function(req, res) {
    try {
        const id = req.params.id;
        const xAuthorization = req.get('X-Authorization');
        if (xAuthorization == null) {
            res.status(401).send('Must supply an X-Authorization header');
            return;
        }
        const user = await User.readByToken(xAuthorization);
        if (user.length === 0) {
            res.status(401).send();
            return;
        }

        let petition_data = {
            "title": req.body.title,
            "description": req.body.description,
            "categoryId": req.body.categoryId,
            "closingDate": req.body.closingDate
        };
        let title = null;
        let description = null;
        let categoryId = null;
        let closingDate = null;

        if (req.body.hasOwnProperty('title')) {
            title = petition_data['title'];
            if (!isNaN(title) || title === "") {
                res.status(400).send();
                return;
            }
        }
        if (req.body.hasOwnProperty('description')) {
            description = petition_data['description'];
            if (!isNaN(description)) {
                res.status(400).send();
                return;
            }
        }
        if (req.body.hasOwnProperty('categoryId')) {
            categoryId = petition_data['categoryId'];
            if (isNaN(categoryId)) {
                res.status(400).send();
                return;
            }
        }
        if (req.body.hasOwnProperty('closingDate')) {
            closingDate = petition_data['closingDate'];
            if (!isNaN(closingDate)) {
                res.status(400).send();
                return;
            }
            closingDate = closingDate.replace(" ", "T");
            closingDate = new Date(closingDate);
        }

        const today = new Date();
        if (closingDate != null && today >= closingDate) {
            res.status(400).send("The date must be in the future");
            return;
        }
        const result = await Petition.update(id, xAuthorization, title, description, categoryId, closingDate);

        if (!result) {
            res.status(400).send("No Category with that CategoryID");
            return;
        }
        if (result == "BAD TOKEN") {
            res.status(403).send("Token does not match the author's token");
            return;
        }
        if (result == "BAD ID") {
            res.status(404).send("No Petition with that id");
            return;
        }

        res.status(200).send();
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.delete = async function(req, res) {
    try {
        const id = req.params.id;
        const xAuthorization = req.get('X-Authorization');
        if (xAuthorization == null) {
            res.status(401).send('Must supply an X-Authorization header');
            return;
        }
        const user = await User.readByToken(xAuthorization);
        if (user.length === 0) {
            res.status(401).send();
            return;
        }

        const result = await Petition.delete(id, xAuthorization);
        if (result == "BAD TOKEN") {
            res.status(403).send("Token does not match the author's token");
            return;
        }
        if (result == "BAD ID") {
            res.status(404).send("No Petition with that id");
            return;
        }

        res.status(200).send();
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.getAllCategories = async function(req, res) {
    try {
        const result = await Petition.getAllCategories();
        let json = "[";
        for(let i = 0; i < result[0].length; i++) {
            json += " {\"categoryId\": " + result[0][i].category_id +
                ", \"name\": \"" + result[0][i].name + "\"},";
        }
        json = json.substring(0, json.length - 1) + " ]";
        res.status(200).send(JSON.parse(json));
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.getSignatures = async function(req, res) {
    try {
        const id = req.params.id;
        const petition = await Petition.read(id);
        if (petition.length == 0) {
            res.status(404).send("No Petition with that id.");
            return;
        }

        const result = await Petition.getSignatures(id);
        res.status(200).send(result);
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.createSignature = async function(req, res) {
    try {
        const id = req.params.id;
        const xAuthorization = req.get('X-Authorization');
        if (xAuthorization == null) {
            res.status(401).send('Must supply an X-Authorization header');
            return;
        }
        const petition = await Petition.read(id);
        if (petition.length == 0) {
            res.status(404).send("No Petition with that id");
            return;
        }
        const today = new Date();
        if (petition[0].closing_date != null && petition[0].closing_date < today) {
            res.status(403).send("The petition has already ended");
            return;
        }
        const user = await User.readByToken(xAuthorization);
        if (user.length == 0) {
            res.status(401).send('No user with that token');
            return;
        }
        const result = await Petition.createSignature(id, user[0].user_id, today);
        if (!result) {
            res.status(403).send("User has already signed this petition");
        } else {
            res.status(201).send();
        }
    } catch (err) {
        res.status(500).send();
    }
};

exports.deleteSignature = async function(req, res) {
    try {
        const id = req.params.id;
        const xAuthorization = req.get('X-Authorization');
        if (xAuthorization == null) {
            res.status(401).send('Must supply an X-Authorization header');
            return;
        }
        const petition = await Petition.read(id);
        if (petition.length == 0) {
            res.status(404).send("No Petition with that id");
            return;
        }
        const today = new Date();
        if (petition[0].closing_date != null && petition[0].closing_date < today) {
            res.status(403).send("The petition has already ended");
            return;
        }
        const user = await User.readByToken(xAuthorization);
        if (user.length == 0) {
            res.status(401).send('No user with that token');
            return;
        }
        if (petition[0].author_id == user[0].user_id) {
            res.status(403).send('Cannot remove a signature from a petition that this user created');
            return;
        }
        const result = await Petition.deleteSignature(id, user[0].user_id);
        if (!result) {
            res.status(403).send("User has not signed this petition");
        } else {
            res.status(200).send();
        }

    } catch (err) {
        res.status(500).send(err);
    }
};

exports.getPhoto = async function(req, res) {
    try {
        const id = req.params.id;
        const result = await Petition.getPhoto(id);

        if (!result) {
            res.status(404).send("No Petition with that id");
            return;
        }
        if (result[0].photo_filename == null) {
            res.status(404).send("Petition does not have a photo");
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
        const user = await User.readByToken(xAuthorization);
        if (user.length === 0) {
            res.status(401).send();
            return;
        }

        const contentType = req.get('Content-Type');
        if (contentType != "image/png" && contentType != "image/jpeg" && contentType != "image/gif") {
            res.status(400).send('Image must be a png, jpeg, or gif');
            return;
        }

        const imageType = contentType.substring(6, contentType.length);
        const filename = "petition_" + id + "." + imageType;

        const defaultPath = "./storage/photos/";

        const result = await Petition.setPhoto(id, xAuthorization, filename);
        if (result == "BAD TOKEN") {
            res.status(403).send("Token does not match the author's token");
            return;
        }
        if (result == "BAD ID") {
            res.status(404).send("No Petition with that id");
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