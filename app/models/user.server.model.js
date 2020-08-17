const db = require('../../config/db');
const passwords = require('./passwords');
const bcrypt = require('bcryptjs');
const UIDGenerator = require('uid-generator');
const uidgen = new UIDGenerator();
const fs = require('fs');

exports.register = async function(name, email, password, city, country) {
    const encryptedPassword = await passwords.hash(password);
    let values = [[name, email, encryptedPassword, city, country]];
    const connection = await db.getPool().getConnection();
    const q = 'INSERT INTO User (name, email, password, city, country) VALUES ?';
    const [result, _] = await connection.query(q, [values]);
    connection.release();
    return result;
};

exports.login = async function(email, attempt) {
    const connection = await db.getPool().getConnection();
    const q = 'SELECT password, user_id FROM User WHERE email = ?';
    const [result] = await connection.query(q, email);
    if (result.length == 0) {
        connection.release();
        return "No User with that email";
    }
    if (bcrypt.compareSync(attempt, result[0].password)) {
        const token = await uidgen.generate();
        const q2 = 'UPDATE User SET auth_token = ? WHERE user_id = ?';
        await connection.query(q2, [token, result[0].user_id]);
    } else {
        connection.release();
        return "Incorrect password";
    }
    const q3 = 'SELECT password, user_id, auth_token FROM User WHERE email = ?';
    const [result3] = await connection.query(q3, email);
    connection.release();
    return result3;
};

exports.logout = async function(id) {
    const connection = await db.getPool().getConnection();
    const q = 'UPDATE User SET auth_token = null WHERE user_id = ?';
    await connection.query(q, id);
    connection.release();
    return true;
};

exports.read = async function(id) {
    const connection = await db.getPool().getConnection();
    const q = 'SELECT * FROM User WHERE user_id = ?';
    const [result, _] = await connection.query(q, id);
    connection.release();
    return result;
};

exports.readByEmail = async function(email) {
    const connection = await db.getPool().getConnection();
    const q = 'SELECT * FROM User WHERE email = ?';
    const [result, _] = await connection.query(q, email);
    connection.release();
    return result;
};

exports.readByToken = async function(token) {
    const connection = await db.getPool().getConnection();
    const q = 'SELECT * FROM User WHERE auth_token = ?';
    const [result, _] = await connection.query(q, token);
    connection.release();
    return result;
};

exports.update = async function(id, name, email, password, city, country) {
    const connection = await db.getPool().getConnection();
    let values = [];
    let q = 'UPDATE User SET';
    if (name != null) {
        q += ' name = ?,';
        values.push(name);
    }
    if (email != null) {
        q += ' email = ?,';
        values.push(email);
    }
    if (password != null) {
        q += ' password = ?,';
        values.push(await passwords.hash(password));
    }
    if (city != null) {
        q += ' city = ?,';
        values.push(city);
    }
    if (country != null) {
        q += ' country = ?,';
        values.push(country);
    }

    q = q.substring(0, q.length - 1);
    q += ' WHERE user_id = ?';
    values.push(id);
    await connection.query(q, values);
    connection.release();
};

exports.getPhoto = async function(id) {
    const connection = await db.getPool().getConnection();
    const q = "SELECT photo_filename FROM User WHERE user_id = ?";
    const [result, _] = await connection.query(q, id);

    if (result.length == 0) {
        return false;
    }
    connection.release();
    return result;
};

exports.setPhoto = async function(id, token, filename) {
    const connection = await db.getPool().getConnection();
    const check = await verifyIDAndToken(id, token);
    if (check == 0) {
        connection.release();
        return "BAD ID";
    } else if (check == 1) {
        connection.release();
        return "BAD TOKEN";
    }

    let statusCode = 0;
    const q1 = "SELECT photo_filename FROM User WHERE user_id = ?";
    const [result, _] = await connection.query(q1, id);
    if (result[0].photo_filename == null) {
        statusCode = 201;
    } else {
        const defaultPath = "./storage/photos/";
        fs.unlink(defaultPath + result[0].photo_filename, (err) => {
            if (err) throw err;
        });
        statusCode = 200;
    }

    const q2 = "UPDATE User SET photo_filename = ? WHERE user_id = ?";
    await connection.query(q2, [filename, id]);
    connection.release();
    return statusCode;
};

exports.deletePhoto = async function(id, token) {
    const connection = await db.getPool().getConnection();
    const check = await verifyIDAndToken(id, token);
    if (check == 0) {
        connection.release();
        return "BAD ID";
    } else if (check == 1) {
        connection.release();
        return "BAD TOKEN";
    }
    const q1 = "SELECT photo_filename FROM User WHERE user_id = ?";
    const [result, _] = await connection.query(q1, id);
    const q2 = "UPDATE User SET photo_filename = null WHERE user_id = ?";
    await connection.query(q2, id);

    const defaultPath = "./storage/photos/";
    fs.unlink(defaultPath + result[0].photo_filename, (err) => {
        if (err) throw err;
    });
    connection.release();
    return true;
};

async function verifyIDAndToken(id, token) {
    const connection = await db.getPool().getConnection();
    const q1 = 'SELECT * FROM User WHERE user_id = ?';
    const [user, _] = await connection.query(q1, id);
    if (user.length == 0) {
        connection.release();
        return 0;
    }
    if (token != user[0].auth_token) {
        return 1;
    }
    connection.release();
    return 2;
}