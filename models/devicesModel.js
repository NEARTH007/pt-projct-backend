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


// ✅ รองรับการอัปเดตอุปกรณ์ พร้อมรองรับการเปลี่ยนแปลงรูปภาพ
exports.editDeviceWithImage = (id, data, callback) => {
  let query = `
      UPDATE Devices
      SET name = ?, description = ?, latitude = ?, longitude = ?, status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
  `;
  const params = [data.name, data.description, data.latitude, data.longitude, data.status, data.updated_by];

  if (data.image_url) {
      query += `, image_url = ?`; // ✅ อัปเดตรูปภาพถ้ามีการเปลี่ยนแปลง
      params.push(data.image_url);
  }

  query += ` WHERE id = ?`;
  params.push(id);

  console.log("🛠 Executing SQL:", query, params); // ✅ ตรวจสอบ SQL Query ก่อนรัน

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
         d.image_url, d.status, d.created_at, d.updated_at, 
         d.added_by, d.updated_by, dt.name AS device_type_name,
         COUNT(dv.id) AS value_count, 
         CONCAT('[', GROUP_CONCAT(DISTINCT 
              CONCAT('{"value_name": "', dv.value_name, '", "value": "', IFNULL(dv.value, '') , '"}')
              ORDER BY dv.value_name ASC SEPARATOR ','), ']') AS device_values
  FROM Devices d
  LEFT JOIN device_types dt ON d.device_type_id = dt.id
  LEFT JOIN device_values dv ON d.id = dv.device_id
  GROUP BY d.id
  ORDER BY d.created_at DESC;
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
         d.image_url, d.status, d.created_at, d.updated_at, 
         d.added_by, d.updated_by, dt.name AS device_type_name
  FROM devices d
  LEFT JOIN device_types dt ON d.device_type_id = dt.id
  WHERE d.id = ?;
  `;

  db.query(query, [id], callback);
};



// Edit Device Values
exports.editDeviceValues = (deviceId, values, callback) => {
  console.log('Updating device values:', deviceId, values);

  // 🟢 ลบค่าที่มีอยู่ก่อนหน้าเพื่อป้องกันข้อมูลซ้ำซ้อน
  const deleteQuery = `DELETE FROM device_values WHERE device_id = ?`;
  db.query(deleteQuery, [deviceId], (err) => {
      if (err) return callback(err);

      // 🟢 ถ้ามี values ใหม่ให้เพิ่มเข้าไป
      if (values.length > 0) {
          const insertQuery = `INSERT INTO device_values (device_id, value_name, value) VALUES ?`;
          const valueData = values.map(v => [deviceId, v.value_name, v.value]);

          db.query(insertQuery, [valueData], callback);
      } else {
          callback(null);
      }
  });
};




// Get Device by ID
exports.getDeviceById = (id, callback) => {
  const query = `
      SELECT d.*, dt.name AS device_type_name
      FROM devices d
      JOIN device_types dt ON d.device_type_id = dt.id
      WHERE d.id = ?
  `;
  db.query(query, [id], callback);
};


// Get Values by Device ID
exports.getDeviceValuesByDeviceId = (deviceId, callback) => {
  const query = `
      SELECT value_name, value
      FROM device_values
      WHERE device_id = ?
  `;
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


exports.createDeviceWithValues = (name, description, latitude, longitude, imageUrl, status, addedBy, deviceTypeId, callback) => {
  const deviceQuery = `
      INSERT INTO devices (name, description, latitude, longitude, image_url, status, added_by, device_type_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(deviceQuery, [name, description, latitude, longitude, imageUrl, status, addedBy, deviceTypeId], (err, result) => {
      if (err) return callback(err);

      const deviceId = result.insertId;

      // ดึงค่าเริ่มต้นจาก `device_type_values_template`
      const getValuesQuery = `
          SELECT value_name FROM device_type_values_template WHERE device_type_id = ?
      `;

      db.query(getValuesQuery, [deviceTypeId], (err, values) => {
          if (err) return callback(err);

          if (values.length === 0) return callback(null, { id: deviceId, message: "✅ Device added successfully (no values needed)" });

          // เตรียมข้อมูลเพื่อ insert ลง `device_values`
          const valueData = values.map(v => [deviceId, v.value_name, null]);

          const insertValuesQuery = `
              INSERT INTO device_values (device_id, value_name, value)
              VALUES ?
          `;

          db.query(insertValuesQuery, [valueData], (err) => {
              if (err) return callback(err);
              callback(null, { id: deviceId, message: "✅ Device and values added successfully" });
          });
      });
  });
};


// ดึงข้อมูลอุปกรณ์ทั้งหมด
exports.getAllDevicesWithValues = (callback) => {
  const query = `
      SELECT d.id, d.name, d.description, d.latitude, d.longitude, 
             d.image_url, d.status, d.created_at, d.updated_at, d.added_by, 
             d.updated_by, v.value_name, v.value
      FROM devices d
      LEFT JOIN device_values v ON d.id = v.device_id
      ORDER BY d.created_at DESC
  `;

  db.query(query, (err, results) => {
      if (err) return callback(err);
      console.log("Fetched Devices with Values:", results); // Debugging Log
      callback(null, results);
  });
};



// ดึงค่าของทุกอุปกรณ์
exports.getAllDeviceValues = (callback) => {
  const query = `
      SELECT device_id, value_name, value
      FROM device_values
  `;

  db.query(query, (err, results) => {
      if (err) return callback(err);
      console.log("Fetched Device Values:", results); // Debugging Log
      callback(null, results);
  });
};


// ✅ อัปเดตค่า values โดยไม่ลบค่าทั้งหมดก่อน
exports.updateDeviceValues = (deviceId, values, callback) => {
  console.log('📊 Updating device values:', deviceId, values);

  if (!values || values.length === 0) {
      return callback(null, { message: "No values to update" });
  }

  const updateQuery = `
      INSERT INTO device_values (device_id, value_name, value)
      VALUES ?
      ON DUPLICATE KEY UPDATE value = VALUES(value) 
  `;

  const valueData = values.map(v => [deviceId, v.value_name, v.value]);

  console.log("🛠 Executing SQL:", updateQuery, valueData);

  db.query(updateQuery, [valueData], (err, result) => {
      if (err) {
          console.error('❌ Database error:', err);
          return callback(err);
      }
      console.log(`✅ Updated ${result.affectedRows} rows for device ${deviceId}`);
      callback(null, result);
  });


// ✅ อัปเดตค่า values โดยไม่ลบค่าทั้งหมดก่อน
exports.updateDeviceValues = (deviceId, values, callback) => {
  console.log('Updating device values:', deviceId, values);

  // ✅ ตรวจสอบให้แน่ใจว่าไม่มีค่าซ้ำกัน
  const uniqueValues = values.filter((v, index, self) =>
      index === self.findIndex((t) => t.value_name === v.value_name)
  );

  const updateQuery = `
      INSERT INTO device_values (device_id, value_name, value)
      VALUES ?
      ON DUPLICATE KEY UPDATE value = VALUES(value) 
  `;

  const valueData = uniqueValues.map(v => [deviceId, v.value_name, v.value]);

  db.query(updateQuery, [valueData], (err, result) => {
      if (err) {
          console.error('Database error:', err);
          return callback(err);
      }
      console.log(`Updated ${result.affectedRows} rows for device ${deviceId}`);
      callback(null, result);
  });
};
};
