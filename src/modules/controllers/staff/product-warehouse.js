const { PrismaClient, Prisma } = require("@prisma/client");
const { ErrorCodes } = require("../../../exception/root");
const NotFoundException = require("../../../exception/not-found");
const ConflictException = require("../../../exception/conflict");
const BadRequestException = require("../../../exception/bad-requests");
const {
  CreateProductWarehouseSchema,
  UpdateProductWarehouseSchema,
} = require("../../../schema/product-warehouse");
const prisma = new PrismaClient();

const GetProductWarehouses = async (req, res) => {
  try {
    const { warehouse_id, product_id } = req.query; 

    const whereClause = {};

    if (warehouse_id) {
      whereClause.warehouse_id = parseInt(warehouse_id, 10);
    }

    if (product_id) {
      whereClause.product_id = parseInt(product_id, 10);
    }

    const productWarehouses = await prisma.product_warehouses.findMany({
      where: whereClause,
      select: {
        id: true,
        product: {
          select: {
            product_name: true,
            sku: true,
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
          },
        },
        warehouse: {
          select: {
            name: true,
            location: true,
          },
        },
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            prefix: {
              select: {
                name: true,
              },
            },
          },
        },
        quantity: true,
        production_date: true,
        expiry_date: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        created_at: "desc", // เรียงลำดับจากใหม่ไปเก่า
      },
    });

    res.json(productWarehouses);
  } catch (err) {
    throw err;
  }
};

const CreateProductWarehouse = async (req, res, next) => {
  try {
    // Validate request body (ไม่ต้องมี created_by แล้ว)
    CreateProductWarehouseSchema.parse(req.body);

    const { product_id, warehouse_id, quantity, production_date, expiry_date } =
      req.body;

    // ดึง user_id จาก token ที่ decode แล้วใน middleware
    const created_by = req.user.id;

    const existingProduct = await prisma.products.findUnique({
      where: { id: product_id },
    });

    if (!existingProduct) {
      throw new NotFoundException(
        "ไม่พบสินค้าที่ระบุ",
        ErrorCodes.PRODUCT_NOT_FOUND
      );
    }

    const existingWarehouse = await prisma.warehouses.findUnique({
      where: { id: warehouse_id },
    });

    if (!existingWarehouse) {
      throw new NotFoundException(
        "ไม่พบคลังสินค้าที่ระบุ",
        ErrorCodes.WAREHOUSE_NOT_FOUND
      );
    }

    // ใช้ transaction
    const result = await prisma.$transaction(async (tx) => {
      // สร้าง product_warehouse ใหม่
      const newProductWarehouse = await tx.product_warehouses.create({
        data: {
          product_id,
          warehouse_id,
          quantity,
          production_date: production_date ? new Date(production_date) : null,
          expiry_date: expiry_date ? new Date(expiry_date) : null,
          created_by, // ใช้ user_id จาก token
        },
        select: {
          id: true,
          product: {
            select: {
              product_name: true,
              sku: true,
            },
          },
          warehouse: {
            select: {
              name: true,
              location: true,
            },
          },
          creator: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              prefix: {
                select: {
                  name: true,
                },
              },
            },
          },
          quantity: true,
          production_date: true,
          expiry_date: true,
          created_at: true,
          updated_at: true,
        },
      });

      // อัพเดท quantity ในตาราง products
      await tx.products.update({
        where: { id: product_id },
        data: {
          quantity: {
            increment: quantity,
          },
        },
      });

      return newProductWarehouse;
    });

    res.status(201).json({
      message: "เพิ่มสินค้าในคลังสำเร็จ",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const UpdateProductWarehouse = async (req, res, next) => {
  try {
    UpdateProductWarehouseSchema.parse(req.body);
    const id = parseInt(req.params.id, 10);
    const { product_id, warehouse_id, quantity, production_date, expiry_date } =
      req.body;

    // ดึง user_id ของคนที่กำลัง login อยู่
    const updated_by = req.user.id;

    const existingProductWarehouse = await prisma.product_warehouses.findUnique(
      {
        where: { id },
        select: { quantity: true, product_id: true },
      }
    );

    if (!existingProductWarehouse) {
      throw new NotFoundException(
        "ไม่พบข้อมูลสินค้าในคลังที่ระบุ",
        ErrorCodes.PRODUCT_NOT_FOUND
      );
    }

    if (product_id) {
      const existingProduct = await prisma.products.findUnique({
        where: { id: product_id },
      });

      if (!existingProduct) {
        throw new NotFoundException(
          "ไม่พบสินค้าที่ระบุ",
          ErrorCodes.PRODUCT_NOT_FOUND
        );
      }
    }

    if (warehouse_id) {
      const existingWarehouse = await prisma.warehouses.findUnique({
        where: { id: warehouse_id },
      });

      if (!existingWarehouse) {
        throw new NotFoundException(
          "ไม่พบคลังสินค้าที่ระบุ",
          ErrorCodes.WAREHOUSE_NOT_FOUND
        );
      }
    }

    const setClauses = [];

    if (product_id) setClauses.push(Prisma.sql`product_id = ${product_id}`);
    if (warehouse_id)
      setClauses.push(Prisma.sql`warehouse_id = ${warehouse_id}`);
    if (quantity !== undefined)
      setClauses.push(Prisma.sql`quantity = ${quantity}`);
    if (production_date)
      setClauses.push(
        Prisma.sql`production_date = ${new Date(production_date)}`
      );
    if (expiry_date)
      setClauses.push(Prisma.sql`expiry_date = ${new Date(expiry_date)}`);

    // ถ้าไม่มีข้อมูลส่งมาให้อัปเดตเลย ก็ไม่ต้องทำอะไร
    if (setClauses.length === 0) {
      return res.status(200).json({ message: "ไม่มีข้อมูลที่ต้องอัปเดต" });
    }

    // เพิ่ม created_by (คนที่อัปเดต) และ updated_at เข้าไปใน query เสมอ
    setClauses.push(Prisma.sql`created_by = ${updated_by}`);
    setClauses.push(Prisma.sql`updated_at = NOW()`);

    // ใช้ transaction เพื่ออัปเดทพร้อมกับปรับ product quantity
    const result = await prisma.$transaction(async (tx) => {
      // รวม clause ทั้งหมดด้วย ','
      const setQuery = Prisma.join(setClauses, ", ");
      // สั่ง execute raw query
      const updateResult = await tx.$executeRaw`
        UPDATE product_warehouses 
        SET ${setQuery} 
        WHERE id = ${id}
      `;

      if (updateResult === 0) {
        throw new NotFoundException(
          "ไม่พบข้อมูลสินค้าในคลังที่ระบุ",
          ErrorCodes.PRODUCT_NOT_FOUND
        );
      }

      // อัปเดท quantity ในตาราง products ถ้ามีการเปลี่ยน quantity
      if (quantity !== undefined) {
        const quantityDifference = quantity - existingProductWarehouse.quantity;
        const targetProductId =
          product_id || existingProductWarehouse.product_id;

        if (quantityDifference !== 0) {
          await tx.products.update({
            where: { id: targetProductId },
            data: {
              quantity: {
                increment: quantityDifference,
              },
            },
          });
        }
      }

      // ดึงข้อมูลที่อัปเดตแล้ว พร้อมข้อมูลคนที่อัปเดต
      const updatedProductWarehouse = await tx.product_warehouses.findUnique({
        where: { id },
        select: {
          id: true,
          product: {
            select: {
              product_name: true,
              sku: true,
            },
          },
          warehouse: {
            select: {
              name: true,
              location: true,
            },
          },
          creator: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              prefix: {
                select: {
                  name: true,
                },
              },
            },
          },
          quantity: true,
          production_date: true,
          expiry_date: true,
          created_at: true,
          updated_at: true,
        },
      });

      return updatedProductWarehouse;
    });

    res.status(200).json({
      message: "อัปเดตข้อมูลสินค้าในคลังสำเร็จ",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const DeleteProductWarehouse = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.product_warehouses.delete({
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

const GetProductWarehouseById = async (req, res) => {
  try {
    const productWarehouse = await prisma.product_warehouses.findFirstOrThrow({
      where: {
        id: +req.params.id,
      },
      select: {
        id: true,
        product: {
          select: {
            product_name: true,
            sku: true,
          },
        },
        warehouse: {
          select: {
            name: true,
            location: true,
          },
        },
        quantity: true,
        production_date: true,
        expiry_date: true,
        created_at: true,
        updated_at: true,
      },
    });
    res.json(productWarehouse);
  } catch (err) {
    throw new NotFoundException(
      "Product warehouse not found",
      ErrorCodes.PRODUCT_NOT_FOUND
    );
  }
};

module.exports = {
  GetProductWarehouses,
  CreateProductWarehouse,
  UpdateProductWarehouse,
  GetProductWarehouseById,
  DeleteProductWarehouse,
};
