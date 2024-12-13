const db = require('../config/db');

// ฟังก์ชันสำหรับจัดการ Location

// เพิ่ม Location
exports.addLocation = (name, description, callback) => {
    const query = 'INSERT INTO Location (name, description) VALUES (?, ?)';
    db.query(query, [name, description], callback);
};

// อัปเดต Location
exports.editLocation = (id, name, description, callback) => {
    const query = 'UPDATE Location SET name = ?, description = ? WHERE id = ?';
    db.query(query, [name, description, id], callback);
};


// ลบ Location
exports.deleteLocation = (id, callback) => {
    const query = 'DELETE FROM Location WHERE id = ?';
    db.query(query, [id], callback);
};


// ดึงข้อมูล Location ทั้งหมด
exports.getLocations = (callback) => {
    const query = 'SELECT * FROM Location';
    db.query(query, callback);
};

exports.getLocationById = (id, callback) => {
    const query = 'SELECT * FROM Location WHERE id = ?';
    db.query(query, [id], callback);
  };
  
