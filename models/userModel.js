const db = require('../config/db');

const User = {
  create: (userData, callback) => {
    const query = 'INSERT INTO users SET ?';
    db.query(query, userData, callback);
  },
  findByEmailOrUsername: (emailOrUsername, callback) => {
    const query = 'SELECT * FROM users WHERE email = ? OR username = ?';
    db.query(query, [emailOrUsername, emailOrUsername], callback);
  },
  findByEmailOrUsernameExact: (email, username, callback) => {
    const query = 'SELECT * FROM users WHERE email = ? OR username = ?';
    db.query(query, [email, username], callback);
  },
  findById: (id, callback) => {
    const query = 'SELECT * FROM users WHERE id = ?';
    db.query(query, [id], callback);
  },
  updateUser: (id, userData, callback) => {
    const query = 'UPDATE users SET ? WHERE id = ?';
    db.query(query, [userData, id], callback);
  },
  deleteUser: (id, callback) => {
    const query = 'DELETE FROM users WHERE id = ?';
    db.query(query, [id], callback);
  },
  getAllUsers: (callback) => {
    const query = 'SELECT * FROM users';
    db.query(query, callback);
  }
};

module.exports = User;
