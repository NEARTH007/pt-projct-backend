const locationModel = require('../models/locationModel');


// Add Location
exports.addLocation = (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).send('Name is required');
    }

    locationModel.addLocation(name, description, (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.status(201).send({ id: result.insertId, message: 'Location added successfully' });
    });
};

// Edit Location
exports.editLocation = (req, res) => {
    const { id } = req.params; // รับ ID ของ Location
    const { name, description } = req.body; // รับข้อมูลใหม่จาก body

    if (!name) {
        return res.status(400).send('Name is required');
    }

    locationModel.editLocation(id, name, description, (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.send({ message: 'Location updated successfully' });
    });
};

// Delete Location
exports.deleteLocation = (req, res) => {
    const { id } = req.params; // รับ ID จาก URL

    locationModel.deleteLocation(id, (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.send({ message: 'Location deleted successfully' });
    });
};

// Get All Locations
exports.getLocations = (req, res) => {
    locationModel.getLocations((err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.send(results);
    });
};

exports.getLocationById = (req, res) => {
    const { id } = req.params;
  
    locationModel.getLocationById(id, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('Internal Server Error');
      }
      if (result.length === 0) {
        return res.status(404).send('Location not found');
      }
      res.send(result[0]);
    });
  };
  
