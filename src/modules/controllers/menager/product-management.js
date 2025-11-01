const { Prisma, PrismaClient } = require("@prisma/client");
const { ErrorCodes } = require("../../../exception/root");
const NotFoundException = require("../../../exception/not-found");
const ConflictException = require("../../../exception/conflict");
const storageService = require("../../../services/storageService");
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
    const { product_name, sku, category_id, unit_id, price, quantity } = req.body;

    const existingProduct = await prisma.products.findUnique({
      where: {
        sku: sku,
      },
    });

    if (existingProduct) {
      throw new ConflictException(
        "A product with this SKU already exists.",
        ErrorCodes.PRODUCT_ALREADY_EXISTS
      );
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = await storageService.uploadImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    }

    const newProduct = await prisma.products.create({
      data: {
        product_name,
        sku,
        category_id: parseInt(category_id),
        unit_id: parseInt(unit_id),
        price: parseFloat(price),
        quantity: quantity ? parseInt(quantity) : 0,
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

    // ดึงข้อมูลสินค้าเก่าก่อน
    const oldProduct = await prisma.products.findUnique({
      where: { id },
      select: { image_url: true },
    });

    if (!oldProduct) {
      throw new NotFoundException(
        "Product not found",
        ErrorCodes.PRODUCT_NOT_FOUND
      );
    }

    let imageUrlToUpdate = oldProduct.image_url; // เก็บ URL เดิมไว้ก่อน
    
    // ถ้ามีการอัปโหลดรูปใหม่
    if (req.file) {
      // ลบรูปเก่า และอัปโหลดรูปใหม่
      imageUrlToUpdate = await storageService.updateImage(
        oldProduct.image_url,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    }

    const setClauses = [];

    if (product_name)
      setClauses.push(Prisma.sql`product_name = ${product_name}`);
    if (sku) setClauses.push(Prisma.sql`sku = ${sku}`);
    if (category_id)
      setClauses.push(Prisma.sql`category_id = ${parseInt(category_id, 10)}`);
    if (unit_id)
      setClauses.push(Prisma.sql`unit_id = ${parseInt(unit_id, 10)}`);
    if (price) setClauses.push(Prisma.sql`price = ${parseFloat(price)}`);
    if (quantity !== undefined) 
      setClauses.push(Prisma.sql`quantity = ${parseInt(quantity, 10)}`);
    
    // อัปเดต image_url ถ้ามีการเปลี่ยนแปลง
    if (imageUrlToUpdate !== oldProduct.image_url) {
      setClauses.push(Prisma.sql`image_url = ${imageUrlToUpdate}`);
    }

    if (setClauses.length === 0) {
      return res.status(200).json({ message: "No data provided to update." });
    }

    setClauses.push(Prisma.sql`updated_at = NOW()`);

    const setQuery = Prisma.join(setClauses, ", ");

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
    
    const product = await prisma.products.findUnique({
      where: { id },
      select: { image_url: true },
    });

    if (!product) {
      throw new NotFoundException(
        "Product not found",
        ErrorCodes.PRODUCT_NOT_FOUND
      );
    }

    if (product.image_url) {
      await storageService.deleteImage(product.image_url);
    }

    await prisma.products.delete({
      where: { id },
    });

    return res.json({ message: "Product deleted successfully" });
  } catch (err) {
    if (err instanceof NotFoundException) {
      throw err;
    }
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