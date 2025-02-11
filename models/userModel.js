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
    
    console.log('Executing SQL:', query);
    console.log('With Data:', userData); // Debug ข้อมูลที่จะอัปเดต
  
    db.query(query, [userData, id], (err, results) => {
      if (err) {
        console.error('Error Executing Query:', err);
      } else {
        console.log('Update Results:', results); // ตรวจสอบผลลัพธ์จาก Query
      }
      callback(err, results);
    });
  },
  
  
  deleteUser: (id, callback) => {
    const query = "DELETE FROM users WHERE id = ?";
    db.query(query, [id], callback);
  },
  getAllUsers: (callback) => {
    const query = 'SELECT * FROM users';
    db.query(query, callback);
  },
};

module.exports = User;
