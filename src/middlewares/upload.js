const multer = require("multer");
const path = require("path");
const fs = require("fs");

// กำหนดตำแหน่งจัดเก็บไฟล์
const storageDirectory = "public/images/products";

// ตรวจสอบและสร้าง Directory ถ้ายังไม่มี
if (!fs.existsSync(storageDirectory)) {
  fs.mkdirSync(storageDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, storageDirectory);
  },
  filename: function (req, file, cb) {
    // สร้างชื่อไฟล์ใหม่ที่ไม่ซ้ำกัน
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// ฟังก์ชันตรวจสอบประเภทไฟล์ (อนุญาตเฉพาะรูปภาพ)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น', 400), false);
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