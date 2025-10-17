const { Prisma, PrismaClient } = require("@prisma/client");
const { ErrorCodes } = require("../../../exception/root");
const NotFoundException = require("../../../exception/not-found");
const ConflictException = require("../../../exception/conflict");
const { AddProductSchema } = require("../../../schema/product");
const fs = require("fs");
const path = require("path");
const prisma = new PrismaClient();

const GetProducts = async (req, res) => {
  const products = await prisma.products.findMany({
    select: {
      id: true,
      product_name: true,
      sku: true,
      price: true,
      quantity: true,
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
    },
  });
  res.json(products);
};

const CreateProduct = async (req, res, next) => {
  try {
    const { product_name, sku, category_id, unit_id, price, quantity  } = req.body;

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
        quantity: parseInt(quantity),
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
    const { product_name, sku, category_id, unit_id, price, quantity } = req.body;

    let newImageUrl = null;
    if (req.file) {
      const oldProduct = await prisma.products.findUnique({
        where: { id },
        select: { image_url: true },
      });

      if (oldProduct && oldProduct.image_url) {
        const oldImagePath = path.join(process.cwd(), `public${oldProduct.image_url}`);
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error("Failed to delete old image:", err);
          else console.log("Successfully deleted old image:", oldImagePath);
        });
      }
      newImageUrl = `/images/products/${req.file.filename}`;
    }

    // 2. สร้างส่วนของ SET clause แบบ dynamic
    const setClauses = [];

    if (product_name)
      setClauses.push(Prisma.sql`product_name = ${product_name}`);
    if (sku) setClauses.push(Prisma.sql`sku = ${sku}`);
    if (category_id)
      setClauses.push(Prisma.sql`category_id = ${parseInt(category_id, 10)}`);
    if (unit_id)
      setClauses.push(Prisma.sql`unit_id = ${parseInt(unit_id, 10)}`);
    if (price) setClauses.push(Prisma.sql`price = ${parseFloat(price)}`);
    if (quantity) setClauses.push(Prisma.sql`quantity = ${parseInt(quantity, 10)}`);
    if (newImageUrl) setClauses.push(Prisma.sql`image_url = ${newImageUrl}`);

    // ถ้าไม่มีข้อมูลส่งมาให้อัปเดตเลย ก็ไม่ต้องทำอะไร
    if (setClauses.length === 0) {
      return res.status(200).json({ message: "No data provided to update." });
    }

    // เพิ่ม updated_at เข้าไปใน query เสมอ
    setClauses.push(Prisma.sql`updated_at = NOW()`);

    // 3. รวม clause ทั้งหมดด้วย ','
    const setQuery = Prisma.join(setClauses, ", ");

    // 4. สั่ง execute raw query
    const result = await prisma.$executeRaw`
      UPDATE products 
      SET ${setQuery} 
      WHERE id = ${id}
    `;

    if (result === 0) {
      throw new NotFoundException(
        "Product not found",
        ErrorCodes.PRODUCT_NOT_FOUND
      );
    }

    const updatedProduct = await prisma.products.findUnique({ where: { id } });
    res.status(200).json(updatedProduct);
  } catch (err) {
    next(err);
  }
};

const DeleteProduct = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.products.delete({
      where: { id },
    });
    return res.json({ message: "Product deleted successfully" });
  } catch (err) {
    throw new NotFoundException(
      "Product not found",
      ErrorCodes.PRODUCT_NOT_FOUND
    );
  }
};

const GetProductById = async (req, res) => {
  try {
    const products = await prisma.products.findFirstOrThrow({
      where: {
        id: +req.params.id,
      },
      select: {
        id: true,
        product_name: true,
        sku: true,
        price: true,
        quantity: true,
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
      },
    });
    res.json(products);
  } catch (err) {
    throw new NotFoundException(
      "Product not found",
      ErrorCodes.PRODUCT_NOT_FOUND
    );
  }
};

module.exports = {
  GetProducts,
  CreateProduct,
  UpdateProduct,
  DeleteProduct,
  GetProductById,
};
