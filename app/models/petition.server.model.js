const db = require('../../config/db');
const fs = require('fs');

exports.getAll = async function(numSearchParameters, searchTerm, categoryId, authorId, sortBy) {
    const connection = await db.getPool().getConnection();
    let values = [];
    let q = 'SELECT p.petition_id as petitionId, p.title, c.name as category, u.name as authorName, count(*) signatureCount ' +
        'FROM Petition p LEFT OUTER JOIN Signature s ON p.petition_id = s.petition_id ' +
        'LEFT OUTER JOIN User u on p.author_id = u.user_id ' +
        'LEFT OUTER JOIN Category c on p.category_id = c.category_id ';
    if (numSearchParameters > 0) {
        q += 'WHERE'
    }
    if (searchTerm != null) {
        q += ` p.title LIKE '%${searchTerm}%' AND`;
    }
    if (categoryId != null) {
        q += ' p.category_id = ? AND';
        values.push(categoryId);
    }
    if (authorId != null) {
        q += ' p.author_id = ? AND';
        values.push(authorId);
    }
    if (numSearchParameters > 0) {
        q = q.substring(0, q.length - 3);
    }

    q += 'GROUP BY p.petition_id, p.title, category, authorName ';

    if (sortBy != null && sortBy.toString() === "ALPHABETICAL_ASC") {
        q += 'ORDER BY title ASC';
    } else if (sortBy != null && sortBy.toString() === "ALPHABETICAL_DESC") {
        q += 'ORDER BY title DESC';
    } else if (sortBy != null && sortBy.toString() === "SIGNATURES_ASC") {
        q += 'ORDER BY Count(s.petition_id) ASC';
    } else {
        q += 'ORDER BY Count(s.petition_id) DESC';
    }

    const [result, _] = await connection.query(q, values);
    connection.release();
    return result;
};

exports.create = async function(title, description, token, categoryId, startingDate, closingDate) {
    const connection = await db.getPool().getConnection();
    const q1 = 'SELECT * FROM User WHERE auth_token = ?';
    const [result1, _] = await connection.query(q1, token);
    if (result1.length == 0) {
        connection.release();
        return "BAD TOKEN";
    }
    if (!await categoryExists(categoryId)) {
        connection.release();
        return "BAD CATEGORY";
    }
    const id = result1[0].user_id;

    let values = [[title, description, id, categoryId, startingDate, closingDate]];
    const q2 = 'INSERT INTO Petition (title, description, author_id, category_id, created_date, closing_date) VALUES ?';
    const [result2] = await connection.query(q2, [values]);
    connection.release();
    return result2;
};

async function categoryExists(categoryId) {
    const connection = await db.getPool().getConnection();
    const q = 'SELECT * FROM Category WHERE category_id = ?';
    const [result, _] = await connection.query(q, categoryId);
    connection.release();
    return result.length > 0;
}

exports.read = async function(id) {
    const connection = await db.getPool().getConnection();
    const q = 'SELECT p.petition_id id, title, description, author_id, ' +
        'category_id, created_date, closing_date, count(*) signatureCount ' +
        'FROM Petition p LEFT OUTER JOIN Signature s ON p.petition_id = s.petition_id ' +
        'WHERE p.petition_id = ? ' +
        'GROUP BY p.petition_id, p.title, p.description, p.author_id, ' +
        'p.category_id, p.created_date, p.closing_date';
    const [result, _] = await connection.query(q, id);
    connection.release();
    return result;
};

exports.getCategory = async function(id) {
    const connection = await db.getPool().getConnection();
    const q = 'SELECT * FROM Category WHERE category_id = ?';
    const [result, _] = await connection.query(q, id);
    connection.release();
    return result;
};

exports.update = async function(id, token, title, description, categoryId, closingDate) {
    const connection = await db.getPool().getConnection();
    const check = await verifyIDAndToken(id, token);
    if (check == 0) {
        connection.release();
        return "BAD ID";
    } else if (check == 1) {
        connection.release();
        return "BAD TOKEN";
    }

    let values = [];
    let q = 'UPDATE Petition SET';
    if (title != null) {
        q += ' title = ?,';
        values.push(title);
    }
    if (description != null) {
        q += ' description = ?,';
        values.push(description);
    }
    if (categoryId != null) {
        if (!await categoryExists(categoryId)) {
            connection.release();
            return "BAD CATEGORY";
        }
        q += ' category_id = ?,';
        values.push(categoryId);
    }
    if (closingDate != null) {
        q += ' closing_date = ?,';
        values.push(closingDate);
    }

    q = q.substring(0, q.length - 1);
    q += ' WHERE petition_id = ?';
    values.push(id);
    await connection.query(q, values);
    connection.release();
    return true;
};

exports.delete = async function(id, token) {
    const connection = await db.getPool().getConnection();
    const check = await verifyIDAndToken(id, token);
    if (check == 0) {
        connection.release();
        return "BAD ID";
    } else if (check == 1) {
        connection.release();
        return "BAD TOKEN";
    }
    const q3 = 'DELETE FROM Petition Where petition_id = ?';
    await connection.query(q3, id);
    connection.release();
};

/**
 * Checks that there is a petition with the ID and the given token matches the
 * auth_token of the author of the petition.
 * 0 - Bad ID
 * 1 - Bad Token
 * 2 - Success
 * @param token
 * @param id
 * @returns {Promise<number>}
 */
async function verifyIDAndToken(id, token) {
    const connection = await db.getPool().getConnection();
    const q1 = 'SELECT * FROM Petition WHERE petition_id = ?';
    const [petition, _] = await connection.query(q1, id);
    if (petition.length == 0) {
        connection.release();
        return 0;
    }

    const q2 = 'SELECT auth_token FROM User WHERE user_id = ?';
    const [user, blank] = await connection.query(q2, petition[0].author_id);
    connection.release();
    if (token != user[0].auth_token) {
        return 1;
    }
    return 2;
}

exports.getAllCategories = async function() {
    const connection = await db.getPool().getConnection();
    const q = 'SELECT * FROM Category';
    const result = await connection.query(q);
    connection.release();
    return result;
};

exports.getSignatures = async function(id) {
    const connection = await db.getPool().getConnection();
    const q = 'SELECT s.signatory_id AS signatoryId, u.name, u.city, u.country, s.signed_date AS signedDate' +
        ' FROM Signature s JOIN User u ON s.signatory_id = u.user_id' +
        ' WHERE s.petition_id = ? ORDER BY s.signed_date';
    const [result, _] = await connection.query(q, id);
    connection.release();
    return result;
};

exports.createSignature = async function(petitionId, userId, signedDate) {
    const connection = await db.getPool().getConnection();
    const q1 = "SELECT * FROM Signature WHERE signatory_id = ? AND petition_id = ?";
    const [result, _] = await connection.query(q1, [userId, petitionId]);
    if (result.length != 0) {
        connection.release();
        return false;
    }

    const q2 = "INSERT INTO Signature (signatory_id, petition_id, signed_date) VALUES ?";

    let values = [[userId, petitionId, signedDate]];
    await connection.query(q2, [values]);
    connection.release();
    return true;
};

exports.deleteSignature = async function(petitionId, userId) {
    const connection = await db.getPool().getConnection();
    const q1 = "SELECT * FROM Signature WHERE signatory_id = ? AND petition_id = ?";
    const [result, _] = await connection.query(q1, [userId, petitionId]);
    if (result.length == 0) {
        connection.release();
        return false;
    }
    const q2 = "DELETE FROM Signature WHERE signatory_id = ? AND petition_id = ?";
    await connection.query(q2, [userId, petitionId]);
    connection.release();
    return true;
};

exports.getPhoto = async function(id) {
    const connection = await db.getPool().getConnection();
    const q = "SELECT photo_filename FROM Petition WHERE petition_id = ?";
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
    const q1 = "SELECT photo_filename FROM Petition WHERE petition_id = ?";
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

    const q2 = "UPDATE Petition SET photo_filename = ? WHERE petition_id = ?";
    await connection.query(q2, [filename, id]);
    connection.release();
    return statusCode;
};