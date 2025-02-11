const express = require("express");
const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");
const {
  register,
  login,
  logout,
  getUserProfile,
  updateUser,
  deleteUser,
  getAllUsers, // Add this import
} = require("../controllers/authController"); // Ensure these are exported in `authController`
const {
  verifyToken,
  uploadErrorHandler,
  authorize,
} = require("../middlewares/authMiddleware");
const locationController = require("../controllers/locationController");
const devicesController = require("../controllers/devicesController");

const router = express.Router();

// Multer configuration
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (!file) {
    cb(null, true); // ไม่มีไฟล์ใหม่ ให้ผ่าน
    return;
  }

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error("Invalid file type");
    error.code = "LIMIT_FILE_TYPES";
    return cb(error, false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
});

// Routes
router.post(
  "/register",
  upload.single("profile_image"),
  uploadErrorHandler,
  register
);
router.post("/login", login);
router.post("/logout", verifyToken, logout);
router.get("/profile", verifyToken, getUserProfile);
router.get("/users", verifyToken, getAllUsers); // Ensure getAllUsers is imported and defined
router.patch(
  "/users/:id",
  upload.single("profile_image"),
  verifyToken,
  updateUser
);
router.delete("/users/delete/:id", verifyToken, deleteUser); // Ensure deleteUser is imported and defined

// Image upload and resize route
router.post("/upload", upload.single("profile_image"), (req, res) => {
  const filePath = `uploads/${req.file.filename}`;

  sharp(filePath)
    .resize(200, 200) // Resize to 200x200 pixels
    .toFile(`uploads/resized-${req.file.filename}`)
    .then(() => {
      // Remove original file
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting original file:", err);
      });
      res.send("Image uploaded and resized successfully");
    })
    .catch((err) => {
      console.error("Error resizing image:", err);
      res.status(500).send("Error processing image");
    });
});

// Location routes
router.post("/location/add", authorize, locationController.addLocation);
router.put("/location/edit/:id", authorize, locationController.editLocation);
router.get("/location/:id", authorize, locationController.getLocationById);
router.delete(
  "/location/delete/:id",
  authorize,
  locationController.deleteLocation
);
router.get("/location", authorize, locationController.getLocations);

// Devices routes
router.post(
  "/devices/add",
  upload.single("device_image"),
  authorize,
  devicesController.addDevice
);
router.put(
  "/devices/edit/:id",
  upload.single("device_image"),
  authorize,
  devicesController.editDevice
);
// Devices routes
router.post(
  "/devices/add",
  upload.single("device_image"),
  authorize,
  devicesController.addDevice
);
router.post('/devices/:deviceId/values', authorize, devicesController.addDeviceValues);
// Get Device with Values
router.get('/devices/:id/with-values', authorize, devicesController.getDeviceWithValues);
router.put('/values/:id', authorize, devicesController.editDeviceValues);
router.get('/devices/:deviceId/values', authorize, devicesController.getDeviceValuesByDeviceId);
router.get("/devices/:id", authorize, devicesController.getDeviceById);
router.delete("/devices/delete/:id", authorize, devicesController.deleteDevice);
router.get("/devices", authorize, devicesController.getDevices);


module.exports = router;
