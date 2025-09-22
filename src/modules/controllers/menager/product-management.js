const { PrismaClient } = require("@prisma/client");
const { ErrorCodes } = require("../../../exception/root");
const NotFoundException  = require("../../../exception/not-found");
const ConflictException = require("../../../exception/conflict");
const { AddProductSchema } = require('../../../schema/users');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

const GetProducts = async (req, res) => {
    const products = await prisma.products.findMany({
      select: {
        id: true,
        product_name: true,
        sku: true,
        price: true,
        category: {
          select: {
            category_name: true,
          },
        },
        unit: {
          select: {
            unit_name: true,
          },
        },
        image_url: true,
        created_at: true,
        updated_at: true,
      }
    });
    res.json(products);
};

const CreateProduct = async (req, res, next) => {
  try {
    const { product_name, sku, category_id, unit_id, price } = req.body;

    // 1. ตรวจสอบว่ามีสินค้าที่ใช้ SKU นี้อยู่แล้วหรือไม่
    const existingProduct = await prisma.products.findUnique({
      where: {
        sku: sku,
      },
    });

    // 2. ถ้ามีอยู่แล้ว ให้โยน ConflictException
    if (existingProduct) {
      throw new ConflictException(
        "A product with this SKU already exists.",
        ErrorCodes.PRODUCT_ALREADY_EXISTS
      );
    }

    if (!req.file) {
      // ใช้ BadRequestsException หรือส่ง response ตรงก็ได้
      return res.status(400).json({ message: "Image is required." });
    }

    const imageUrl = `/images/products/${req.file.filename}`;

    const newProduct = await prisma.products.create({
      data: {
        product_name,
        sku,
        category_id: parseInt(category_id),
        unit_id: parseInt(unit_id),
        price: parseFloat(price),
        image_url: imageUrl,
      },
    });

    res.status(201).json(newProduct);
  } catch (err) {
    next(err);
  }
};

const UpdateProduct = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    // 1. ตรวจสอบว่ามีการอัปโหลดไฟล์รูปใหม่หรือไม่
    if (req.file) {
      // ค้นหาสินค้าตัวเดิมใน DB เพื่อเอา path รูปเก่า
      const product = await prisma.products.findUnique({
        where: { id },
        select: { image_url: true } // เอาแค่ image_url ก็พอ
      });

      // ถ้ามีรูปเก่าอยู่จริง ให้ทำการลบไฟล์นั้นทิ้ง
      if (product && product.image_url) {
        const oldImagePath = path.join(__dirname, '../../../public', product.image_url);
        
        // เช็คอีกครั้งว่าไฟล์มีอยู่จริงบน server ก่อนจะสั่งลบ
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err) {
              // ไม่ต้องหยุดการทำงาน แค่ log ไว้ก็พอว่าลบไฟล์เก่าไม่สำเร็จ
              console.error("Failed to delete old image:", oldImagePath, err);
            } else {
              console.log("Successfully deleted old image:", oldImagePath);
            }
          });
        }
      }
    }

    const { product_name, sku, category_id, unit_id, price } = req.body;
    
    // 2. เตรียมข้อมูลสำหรับอัปเดต
    const dataToUpdate = {
        product_name,
        sku,
        category_id: category_id ? parseInt(category_id) : undefined,
        unit_id: unit_id ? parseInt(unit_id) : undefined,
        price: price ? parseFloat(price) : undefined,
    };

    // ถ้ามีไฟล์ใหม่ ก็เพิ่ม URL รูปใหม่เข้าไปในข้อมูลที่จะอัปเดต
    if (req.file) {
      dataToUpdate.image_url = `/images/products/${req.file.filename}`;
    }

    // 3. สั่งอัปเดตข้อมูลในฐานข้อมูล
    const updatedProduct = await prisma.products.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json(updatedProduct);
  } catch (err) {
    // 4. จัดการ Error ประเภทต่างๆ
    // กรณีที่หา ID ของสินค้าที่จะอัปเดตไม่เจอ (Prisma จะโยน error code P2025)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
       next(new NotFoundException("Product not found", ErrorCodes.PRODUCT_NOT_FOUND));
       return; // หยุดการทำงานหลังจากส่ง error
    }
    
    // ส่งต่อ error อื่นๆ ที่ไม่รู้จักไปให้ errorHandler จัดการ
    next(err);
  }
};


const DeleteProduct = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.products.delete({
      where: { id }
    });
    return res.json({ message: "Product deleted successfully" });
  } catch (err) {
    throw new NotFoundException("Product not found", ErrorCodes.PRODUCT_NOT_FOUND);
  }
};

const GetProductById = async (req, res) => {
  try {
      const products = await prisma.products.findFirstOrThrow({
          where: {
            id: +req.params.id
          }
      })
      res.json(products)
  } catch (err) {
    throw new NotFoundException("Product not found", ErrorCodes.PRODUCT_NOT_FOUND);
  }
};

module.exports = {
  GetProducts,
  CreateProduct,
  UpdateProduct,
  DeleteProduct,
  GetProductById
};