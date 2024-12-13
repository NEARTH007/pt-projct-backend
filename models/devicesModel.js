const db = require('../config/db');

// Add Device
exports.addDevice = (name, description, callback) => {
    const query = 'INSERT INTO Devices (name, description) VALUES (?, ?)';
    db.query(query, [name, description], callback);
};

// Edit Device
exports.editDevice = (id, name, description, callback) => {
    const query = 'UPDATE Devices SET name = ?, description = ? WHERE id = ?';
    db.query(query, [name, description, id], callback);
};

// Delete Device
exports.deleteDevice = (id, callback) => {
    const query = 'DELETE FROM Devices WHERE id = ?';
    console.log('Executing query:', query, 'with ID:', id); // Debugging
    db.query(query, [id], callback);
};


// Get All Devices
exports.getDevices = (callback) => {
    const query = 'SELECT * FROM Devices';
    db.query(query, callback);
};

// Get Device by ID
exports.getDeviceById = (id, callback) => {
    const query = 'SELECT * FROM Devices WHERE id = ?';
    db.query(query, [id], callback);
};
