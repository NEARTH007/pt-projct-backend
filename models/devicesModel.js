const db = require("../config/db");

// Add Device
exports.addDevice = (name, description, callback) => {
  const query = "INSERT INTO Devices (name, description) VALUES (?, ?)";
  db.query(query, [name, description], callback);
};

// Edit Device
exports.editDevice = (id, name, description, latitude, longitude, callback) => {
  const query =
    "UPDATE Devices SET name = ?, description = ?, latitude = ?, longitude = ? WHERE id = ?";
  db.query(query, [name, description, latitude, longitude, id], callback);
};

// Add Device with Location, Image, and Added By
exports.addDeviceWithDetails = (name, description, latitude, longitude, imageUrl, status, addedBy, callback) => {
  const query = `
      INSERT INTO Devices (name, description, latitude, longitude, image_url, status, added_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(query, [name, description, latitude, longitude, imageUrl, status, addedBy], callback);
};

// Edit Device with Image
exports.editDeviceWithImage = (id, data, callback) => {
  let query = `
      UPDATE Devices
      SET name = ?, description = ?, latitude = ?, longitude = ?, status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
  `;
  const params = [data.name, data.description, data.latitude, data.longitude, data.status, data.updated_by];

  if (data.image_url) {
      query += `, image_url = ?`;
      params.push(data.image_url);
  }

  query += ` WHERE id = ?`;
  params.push(id);

  db.query(query, params, callback);
};



// Delete Device
exports.deleteDevice = (id, callback) => {
  const query = "DELETE FROM Devices WHERE id = ?";
  console.log("Executing query:", query, "with ID:", id); // Debugging
  db.query(query, [id], callback);
};

// Add Device with Location
exports.addDeviceWithLocation = (
  name,
  description,
  latitude,
  longitude,
  callback
) => {
  const query =
    "INSERT INTO Devices (name, description, latitude, longitude) VALUES (?, ?, ?, ?)";
  db.query(query, [name, description, latitude, longitude], callback);
};

// Get All Devices with Location
exports.getDevices = (callback) => {
  const query =
    "SELECT id, name, description, latitude, longitude FROM Devices";
  db.query(query, callback);
};

// Get All Devices with Dates and Added By
exports.getDevicesWithDetails = (callback) => {
  const query = `
      SELECT d.id, d.name, d.description, d.latitude, d.longitude, 
             d.image_url, d.status, d.created_at, d.updated_at, d.added_by, 
             d.updated_by,  -- เพิ่ม updated_by ในการดึงข้อมูล
             dv.value1, dv.value2
      FROM Devices d
      LEFT JOIN device_values dv ON d.id = dv.device_id
      ORDER BY d.created_at DESC
  `;
  db.query(query, callback);
};



// Get All Devices
exports.getDevices = (callback) => {
  const query = "SELECT * FROM Devices";
  db.query(query, callback);
};

// Get Device by ID
exports.getDeviceById = (id, callback) => {
  const query = `
      SELECT d.id, d.name, d.description, d.latitude, d.longitude, 
             d.image_url, d.status, d.created_at, d.updated_at, d.added_by, 
             d.updated_by, -- เพิ่ม updated_by
             dv.value1, dv.value2
      FROM Devices d
      LEFT JOIN device_values dv ON d.id = dv.device_id
      WHERE d.id = ?
  `;
  db.query(query, [id], callback);
};


// Edit Device Values
exports.editDeviceValues = (deviceId, value1, value2, callback) => {
  console.log('Updating device values:', deviceId, value1, value2);
  const query = `
      UPDATE device_values
      SET value1 = ?, value2 = ?
      WHERE device_id = ?
  `;
  db.query(query, [value1, value2, deviceId], (err, result) => {
      if (err) {
          console.error('Database error:', err);
          return callback(err);
      }
      if (result.affectedRows === 0) {
          // Add values if they do not exist
          const insertQuery = `
              INSERT INTO device_values (device_id, value1, value2)
              VALUES (?, ?, ?)
          `;
          db.query(insertQuery, [deviceId, value1, value2], callback);
      } else {
          callback(null, result);
      }
  });
};



// Get Device by ID
exports.getDeviceById = (id, callback) => {
  const query = "SELECT * FROM Devices WHERE id = ?";
  db.query(query, [id], callback);
};

// Get Values by Device ID
exports.getDeviceValuesByDeviceId = (deviceId, callback) => {
  const query = "SELECT value1, value2 FROM device_values WHERE device_id = ?";
  db.query(query, [deviceId], callback);
};


// Delete Device and its related values
exports.deleteDeviceWithValues = (id, callback) => {
  const deleteValuesQuery = "DELETE FROM device_values WHERE device_id = ?";
  const deleteDeviceQuery = "DELETE FROM Devices WHERE id = ?";

  db.query(deleteValuesQuery, [id], (err) => {
    if (err) return callback(err);
    db.query(deleteDeviceQuery, [id], callback);
  });
};
