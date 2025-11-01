const multer = require("multer");

// เปลี่ยนเป็น memoryStorage
const storage = multer.memoryStorage();

// ฟังก์ชันตรวจสอบประเภทไฟล์ (อนุญาตเฉพาะรูปภาพ)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // จำกัดขนาดไฟล์ไม่เกิน 5MB
  }
});

module.exports = upload;