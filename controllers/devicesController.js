const devicesModel = require('../models/devicesModel');
const moment = require('moment');
const db = require("../config/db"); // ✅ เชื่อมต่อ Database



// Add Device and Values
exports.addDevice = (req, res) => {
    console.log("📥 Received Add Device Request:", req.body);
    console.log("📷 Uploaded File:", req.file);

    const { name, description, latitude, longitude, status, deviceTypeId } = req.body;
    const addedBy = req.user ? `${req.user.role}:${req.user.username}` : "Unknown";
    const imageUrl = req.file ? `uploads/${req.file.filename}` : null;

    if (!name || !latitude || !longitude || !status || !deviceTypeId) {
        return res.status(400).send('❌ Missing required fields');
    }

    devicesModel.createDeviceWithValues(name, description, latitude, longitude, imageUrl, status, addedBy, deviceTypeId, (err, result) => {
        if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).send('Internal Server Error');
        }

        res.status(201).send({ message: "✅ Device added successfully", device: result });
    });
};
  


// ✅ แก้ไขให้ `values` ไม่ถูกลบทิ้งก่อนอัปเดต และรองรับการอัปโหลดรูปภาพ
exports.editDevice = (req, res) => {
    console.log("📥 Received FormData:", req.body); // ✅ Debug FormData
    console.log("📷 Uploaded File:", req.file); // ✅ Debug Image Upload

    const { id } = req.params;
    const updatedBy = req.user ? `${req.user.role}:${req.user.username}` : "Unknown";

    const name = req.body.name;
    const description = req.body.description;
    const latitude = req.body.latitude;
    const longitude = req.body.longitude;
    const status = req.body.status;
    const imageUrl = req.file ? `uploads/${req.file.filename}` : null;

    let values = [];
    try {
        if (req.body.values) {
            values = JSON.parse(req.body.values);
            console.log("📊 Parsed Values:", values);
            if (!Array.isArray(values)) {
                throw new Error("values must be an array");
            }
        }
    } catch (error) {
        console.error("❌ JSON Parse Error:", error.message);
        return res.status(400).send("Invalid JSON format in values");
    }

    if (!name || !latitude || !longitude || !status) {
        return res.status(400).send('Missing required fields');
    }

    const updatedData = { 
        name, description, latitude, longitude, status, updated_by: updatedBy 
    };

    if (imageUrl) {
        updatedData.image_url = imageUrl;
    }

    console.log("🛠 Updating Device with Data:", updatedData);

    devicesModel.editDeviceWithImage(id, updatedData, (err) => {
        if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).send('Failed to update device');
        }

        if (values.length > 0) {
            devicesModel.updateDeviceValues(id, values, (err) => {
                if (err) {
                    console.error('❌ Database error (values):', err);
                    return res.status(500).send('Failed to update values');
                }
                console.log(`✅ Updated ${values.length} values for device ${id}`);
                res.send({ message: 'Device updated successfully', updatedBy, imageUrl });
            });
        } else {
            res.send({ message: 'Device updated successfully', updatedBy, imageUrl });
        }
    });
};



// Delete Device
exports.deleteDevice = (req, res) => {
    const { id } = req.params;
  
    devicesModel.deleteDeviceWithValues(id, (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('Internal Server Error');
      }
      res.send({ message: 'Device and its values deleted successfully' });
    });
  };
  
// Get All Devices
exports.getDevices = (req, res) => {
    console.log("🔍 User Role:", req.user?.role); // Debug role
    console.log("🔍 Fetching Devices...");

    devicesModel.getDevicesWithDetails((err, results) => {
        if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).send('Internal Server Error');
        }

        console.log("✅ Devices Found:", results.length); // เช็คจำนวน device ที่ดึงมา

        const devices = results.map(device => ({
            id: device.id,
            name: device.name,
            description: device.description,
            latitude: device.latitude,
            longitude: device.longitude,
            image_url: device.image_url
                ? `${req.protocol}://${req.get('host')}/${device.image_url}`
                : null,
            status: device.status,
            device_type_name: device.device_type_name || "Unknown",
            created_at: moment(device.created_at).format('YYYY-MM-DD HH:mm:ss'),
            updated_at: moment(device.updated_at).format('YYYY-MM-DD HH:mm:ss'),
            added_by: device.added_by,
            updated_by: device.updated_by,
            values: device.device_values ? JSON.parse(device.device_values) : []
        }));

        res.send(devices);
    });
};


exports.getDeviceTypes = (req, res) => {
    const query = "SELECT id, name FROM device_types"; // ✅ ตรวจสอบว่า table `device_types` มีอยู่จริง

    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.json(results);
    });
};



// Get Device by ID
exports.getDeviceById = (req, res) => {
    const { id } = req.params;

    devicesModel.getDeviceById(id, (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        if (result.length === 0) {
            return res.status(404).send('Device not found');
        }

        const device = result[0];
        device.image_url = device.image_url
            ? `${req.protocol}://${req.get('host')}/${device.image_url}`
            : null;
        device.created_at = moment(device.created_at).format('YYYY-MM-DD HH:mm:ss');
        device.updated_at = moment(device.updated_at).format('YYYY-MM-DD HH:mm:ss');

        res.send(device);
    });
};

// Add Device Values
exports.addDeviceValues = (req, res) => {
    const { deviceId, value1, value2 } = req.body;

    if (!deviceId) {
        return res.status(400).json({ error: 'Device ID is required' });
    }

    devicesModel.addDeviceValues(deviceId, value1, value2, (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.status(201).json({ id: result.insertId, message: 'Values added successfully' });
    });
};

// Edit Device Values
// Edit Device Values
exports.editDeviceValues = (req, res) => {
    const { id } = req.params; // ID of the row in the device_values table
    const { value1, value2 } = req.body;

    // ตรวจสอบว่ามีค่าที่จำเป็น
    if (!id) {
        return res.status(400).json({ error: 'Value ID is required' });
    }

    // ตรวจสอบการเชื่อมต่อกับ Model
    devicesModel.editDeviceValues(id, value1, value2, (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // ตรวจสอบว่ามี row ที่ถูกอัปเดต
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No values found to update' });
        }

        res.json({ message: 'Values updated successfully', updatedRows: result.affectedRows });
    });
};




// Get Device Values by Device ID
exports.getDeviceValuesByDeviceId = (req, res) => {
    const { deviceId } = req.params;
    devicesModel.getDeviceValuesByDeviceId(deviceId, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.json(results);
    });
};


// Get Device by ID with Values
exports.getDeviceWithValues = (req, res) => {
    const { id } = req.params; // รับ `id` ของอุปกรณ์ที่ต้องการดูข้อมูล

    devicesModel.getDeviceById(id, (err, deviceResult) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        if (deviceResult.length === 0) {
            return res.status(404).send('Device not found');
        }

        const device = deviceResult[0];

        // ดึงค่า values ของอุปกรณ์นี้
        devicesModel.getDeviceValuesByDeviceId(id, (err, valuesResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Internal Server Error');
            }

            res.json({
                device,
                values: valuesResult, // คืนค่า value_name และ value ของอุปกรณ์นี้
            });
        });
    });
};

exports.getAllDevicesWithValues = (req, res) => {
    devicesModel.getAllDevicesWithValues((err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }

        // กลุ่มข้อมูล Devices
        const devicesMap = new Map();

        results.forEach(row => {
            if (!devicesMap.has(row.id)) {
                devicesMap.set(row.id, {
                    id: row.id,
                    name: row.name,
                    description: row.description,
                    latitude: row.latitude,
                    longitude: row.longitude,
                    image_url: row.image_url
                        ? `${req.protocol}://${req.get('host')}/${row.image_url}`
                        : null,
                    status: row.status,
                    created_at: moment(row.created_at).format('YYYY-MM-DD HH:mm:ss'),
                    updated_at: moment(row.updated_at).format('YYYY-MM-DD HH:mm:ss'),
                    added_by: row.added_by,
                    updated_by: row.updated_by,
                    values: [] // ใส่ค่า value_name, value
                });
            }

            // ถ้ามี value_name และ value
            if (row.value_name) {
                devicesMap.get(row.id).values.push({
                    value_name: row.value_name,
                    value: row.value
                });
            }
        });

        res.json(Array.from(devicesMap.values()));
    });
};


exports.getDeviceTypes = (req, res) => {
    const query = "SELECT id, name FROM device_types"; // ตรวจสอบว่า Table `device_types` มีอยู่จริง
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.json(results);
    });
};
