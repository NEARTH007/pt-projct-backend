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
  const query = 'UPDATE users SET ?, updated_at = NOW() WHERE id = ?';
  
  // ✅ ลบค่าที่เป็น undefined หรือ null
  Object.keys(userData).forEach((key) => {
    if (userData[key] === undefined || userData[key] === null) {
      delete userData[key];
    }
  });

  console.log('🛠 Executing SQL:', query);
  console.log('🛠 With Data:', userData);

  db.query(query, [userData, id], (err, results) => {
    if (err) {
      console.error('⚠️ Error Executing Query:', err);
    } else {
      console.log('✅ Update Results:', results);
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
  updatePassword: (id, hashedPassword, callback) => {
    const query = "UPDATE users SET password = ? WHERE id = ?";
    db.query(query, [hashedPassword, id], callback);
  },

  findByEmail: (email, callback) => {
    const query = "SELECT * FROM users WHERE email = ?";
    console.log("🔍 Executing query:", query, "with email:", email);
    db.query(query, [email], (err, results) => {
      console.log("📊 Query Results:", results);
      callback(err, results);
    });
  },

  clearResetToken: (id, callback) => {
    const query = "UPDATE users SET reset_token = NULL, token_expiry = NULL WHERE id = ?";
    db.query(query, [id], callback);
  },
  
  saveResetToken: (id, token, callback) => {
    const query = "UPDATE users SET reset_token = ? WHERE id = ?";
    db.query(query, [token, id], (err, results) => {
      if (err) {
        console.error("🔴 Error executing saveResetToken:", err);
      } else {
        console.log("✅ Reset token saved:", results);
      }
      callback(err, results);
    });
  },
  
  findByResetToken: (token, callback) => {
    const query = "SELECT * FROM users WHERE reset_token = ?";
    console.log("🔍 Checking Reset Token:", token);  // Debug token ที่ได้รับ
    db.query(query, [token], (err, results) => {
        console.log("📊 Query Results:", results);  // Debug ค่าที่ได้จากฐานข้อมูล
        callback(err, results);
    });
},


};



module.exports = User;
