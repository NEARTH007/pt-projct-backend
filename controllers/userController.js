const User = require('../models/userModel');

exports.getAllUsers = (req, res) => {
  User.getAllUsers((err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).send('Internal server error');
    }
    res.json(results);
  });
};

exports.updateUser = (req, res) => {
  const { id } = req.params;
  const { username, email, first_name, last_name } = req.body;
  const profile_image = req.file ? req.file.filename : null;

  const userData = { username, email, first_name, last_name };
  if (profile_image) {
    userData.profile_image = profile_image; // เพิ่มรูปโปรไฟล์ในข้อมูลการอัปเดตถ้ามีการอัปโหลดรูปภาพใหม่
  }


  User.updateUser(id, userData, (err) => {
    if (err) {
      console.error('Database update error:', err);
      return res.status(500).send('Update failed. Try again later.');
    }
    res.json({ message: 'User updated successfully' });
  });
};

exports.deleteUser = (req, res) => {
  const { id } = req.params;

  User.deleteUser(id, (err) => {
    if (err) {
      console.error('Database deletion error:', err);
      return res.status(500).send('Deletion failed. Try again later.');
    }
    res.json({ message: 'User deleted successfully' });
  });
};
