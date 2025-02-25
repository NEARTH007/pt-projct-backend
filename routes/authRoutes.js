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
  updatePassword, 
  requestPasswordReset, 
  resetPassword,
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
      cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.patch("/users/:id", verifyToken, upload.single("profile_image"), updateUser);

// ✅ Register
router.post(
  "/register",
  upload.single("profile_image"),
  uploadErrorHandler,
  register
);
// ✅ Login / Logout
router.post("/login", login);
router.post("/logout", verifyToken, logout)

// ✅ Profile
router.get("/profile", verifyToken, getUserProfile);
router.get("/users", verifyToken, getAllUsers); // Ensure getAllUsers is imported and defined
router.delete("/users/delete/:id", verifyToken, deleteUser); // Ensure deleteUser is imported and defined

// ✅ User Management (เฉพาะ Admin เท่านั้น)
router.get("/users", verifyToken, authorize(["Admin"]), getAllUsers);
router.patch("/users/:id", verifyToken, authorize(["Admin"]), updateUser);
router.delete("/users/delete/:id", verifyToken, authorize(["Admin"]), deleteUser);


// เปลี่ยนรหัสผ่านโดยตรง (ต้องล็อกอิน)
router.patch("/users/:id/update-password", verifyToken, updatePassword);
// ขอ Token รีเซ็ตรหัสผ่าน (ส่งไป Email)
router.post("/users/request-password-reset", requestPasswordReset);
// ใช้ Token ตั้งรหัสผ่านใหม่
router.post("/users/reset-password", resetPassword);


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
  verifyToken, // ✅ ตรวจสอบ Token ก่อน
  authorize(["Admin"]), // ✅ อนุญาตเฉพาะ Admin เท่านั้น
  upload.single("device_image"), // ✅ รองรับอัปโหลดรูปภาพ
  devicesController.addDevice
);
router.put(
  "/devices/edit/:id",
  verifyToken, // 🛠 เช็ค Token ก่อน
  authorize(["Admin"]), // 🛠 เช็คสิทธิ์ว่าเป็น Admin
  upload.single("device_image"), 
  devicesController.editDevice
);
// Devices routes ✅ ตรวจสอบสิทธิ์ก่อนทุกครั้ง
router.get("/devices", verifyToken, authorize(["Admin", "User"]), devicesController.getDevices);
router.get("/devices/:id", verifyToken, authorize(["Admin", "User"]), devicesController.getDeviceById);
router.get('/devices/:id/with-values', verifyToken, authorize(["Admin", "User"]), devicesController.getDeviceWithValues);
router.get('/devices/:deviceId/values', verifyToken, authorize(["Admin", "User"]), devicesController.getDeviceValuesByDeviceId);
router.get('/devices/with-values', verifyToken, authorize(["Admin", "User"]), devicesController.getAllDevicesWithValues);

// Admin-only actions (ต้องใช้ verifyToken ก่อน authorize)
router.post("/devices/add", verifyToken, authorize(["Admin"]), upload.single("device_image"), devicesController.addDevice);
router.put("/devices/edit/:id", verifyToken, authorize(["Admin"]), upload.single("device_image"), devicesController.editDevice);
router.delete("/devices/delete/:id", verifyToken, authorize(["Admin"]), devicesController.deleteDevice);
router.put('/values/:id', verifyToken, authorize(["Admin"]), devicesController.editDeviceValues);
router.post('/devices/:deviceId/values', verifyToken, authorize(["Admin"]), devicesController.addDeviceValues);

// Device Types (Admin & User)
router.get('/device-types', verifyToken, authorize(["Admin", "User"]), devicesController.getDeviceTypes);


module.exports = router;
