const devicesModel = require('../models/devicesModel');


// Add Device
exports.addDevice = (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).send('Name is required');
    }

    devicesModel.addDevice(name, description, (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.status(201).send({ id: result.insertId, message: 'Device added successfully' });
    });
};

// Edit Device
exports.editDevice = (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).send('Name is required');
    }

    devicesModel.editDevice(id, name, description, (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.send({ message: 'Device updated successfully' });
    });
};

// Delete Device
exports.deleteDevice = (req, res) => {
    const { id } = req.params;

    devicesModel.deleteDevice(id, (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.send({ message: 'Device deleted successfully' });
    });
};

// Get All Devices
exports.getDevices = (req, res) => {
    devicesModel.getDevices((err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.send(results);
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
        res.send(result[0]);
    });
};
