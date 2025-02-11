const devicesModel = require('../models/devicesModel');
const moment = require('moment');


// Add Device and Values
exports.addDevice = (req, res) => {
    console.log('Request Body:', req.body);
    console.log('Value1:', req.body.value1);
    console.log('Value2:', req.body.value2);


    const { name, description, latitude, longitude, status, value1, value2 } = req.body;
    const addedBy = req.user ? `${req.user.role}:${req.user.username}` : "Unknown";
    const imageUrl = req.file ? `uploads/${req.file.filename}` : null;

    if (!name || !latitude || !longitude || !status) {
        return res.status(400).send('Name, latitude, longitude, and status are required');
    }

    devicesModel.addDeviceWithDetails(
        name,
        description,
        latitude,
        longitude,
        imageUrl,
        status,
        addedBy,
        (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Internal Server Error');
            }

            const deviceId = result.insertId;
            devicesModel.editDeviceValues(deviceId, value1, value2, (err) => {
                if (err) {
                    console.error('Database error (values):', err);
                    return res.status(500).send('Internal Server Error (values)');
                }

                res.status(201).send({ id: deviceId, message: 'Device and values added successfully', addedBy });
            });
        }
    );
};


  

// Edit Device with Image
exports.editDevice = (req, res) => {
    const { id } = req.params;
    const { name, description, latitude, longitude, status, value1, value2 } = req.body;
    const imageUrl = req.file ? `uploads/${req.file.filename}` : null;
    const updatedBy = req.user ? `${req.user.role}:${req.user.username}` : "Unknown";

    if (!name || !latitude || !longitude || !status) {
        return res.status(400).send('Name, latitude, longitude, and status are required');
    }

    const updatedData = { name, description, latitude, longitude, status, updated_by: updatedBy };
    if (imageUrl) {
        updatedData.image_url = imageUrl;
    }

    devicesModel.editDeviceWithImage(id, updatedData, (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }

        devicesModel.editDeviceValues(id, value1, value2, (err) => {
            if (err) {
                console.error('Database error (values):', err);
                return res.status(500).send('Internal Server Error (values)');
            }
            res.send({ message: 'Device and values updated successfully', updatedBy });
        });        
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
    devicesModel.getDevicesWithDetails((err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        const devices = results.map(device => ({
            ...device,
            image_url: device.image_url
                ? `${req.protocol}://${req.get('host')}/${device.image_url}`
                : null,
            created_at: moment(device.created_at).format('YYYY-MM-DD HH:mm:ss'),
            updated_at: moment(device.updated_at).format('YYYY-MM-DD HH:mm:ss'),
        }));
        res.send(devices);
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
            ? `${req.protocol}://${req.get('host')}/${device.image_url}` // สร้าง URL เต็ม
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
    const { id } = req.params; // ID ของ Device

    devicesModel.getDeviceById(id, (err, deviceResult) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        if (deviceResult.length === 0) {
            return res.status(404).send('Device not found');
        }

        const device = deviceResult[0];

        devicesModel.getDeviceValuesByDeviceId(id, (err, valuesResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Internal Server Error');
            }

            res.json({
                device,
                values: valuesResult,
            });
        });
    });
};
