const { PrismaClient } = require("@prisma/client");
const { ErrorCodes } = require("../../../exception/root");
const NotFoundException = require("../../../exception/not-found");
const ConflictException = require("../../../exception/conflict");
const BadRequestException = require("../../../exception/bad-requests");
const prisma = new PrismaClient();

const GetWarehouseName = async (req, res) => {
  const warehouses = await prisma.warehouses.findMany({
    select: {
      id: true,
      name: true,
      location: true,
      created_at: true,
      updated_at: true,
    },
  });
  res.json(warehouses);
};

const CreateWarehouseName = async (req, res) => {
  try {
    const { name, location } = req.body;

    if (!name || name.trim() === "") {
      throw new BadRequestException(
        "ชื่อคลังสินค้าไม่สามารถเว้นว่างได้",
        ErrorCodes.WAREHOUSE_NAME_REQUIRED
      );
    }

    const existingWarehouse = await prisma.warehouses.findUnique({
      where: {
        name: name.trim(),
      },
    });
    if (existingWarehouse) {
      throw new ConflictException(
        "มีคลังสินค้านี้อยู่แล้ว",
        ErrorCodes.WAREHOUSE_ALREADY_EXISTS
      );
    }
    const newWarehouse = await prisma.warehouses.create({
      data: {
        name: name.trim(),
        location: location ? location.trim() : null,
      },
    });
    return res.status(201).json({
      success: true,
      message: "สร้างคลังสินค้าสำเร็จ",
      data: newWarehouse,
    });
  } catch (err) {
    if (err?.code === "P2005") {
      throw new ConflictException(
        "มีคลังสินค้านี้อยู่แล้ว",
        ErrorCodes.WAREHOUSE_ALREADY_EXISTS
      );
    }
    throw err;
  }
};

const UpdateWarehouse = async (req, res) => {
  try {
    const { name, location } = req.body;

    if (!name || name.trim() === "") {
      throw new BadRequestException(
        "ชื่อคลังสินค้าไม่สามารถเว้นว่างได้",
        ErrorCodes.WAREHOUSE_NAME_REQUIRED
      );
    }

    const id = parseInt(req.params.id, 10);
    const updatedWarehouse = await prisma.warehouses.update({
      where: { id },
      data: { name: name.trim(), location: location ? location.trim() : null },
    });
    res.json(updatedWarehouse);
  } catch (err) {
    if (err?.code === "P2025") {
      throw new NotFoundException("Warehouse not found", ErrorCodes.WAREHOUSE_NOT_FOUND);
    }
    throw err;
  }
};

const DeleteWarehouse = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.warehouses.delete({
      where: { id },
    });
    res.json({ message: "Warehouse deleted successfully" });
  } catch (err) {
    if (err?.code === "P2025") {
      throw new NotFoundException("Warehouse not found", ErrorCodes.WAREHOUSE_NOT_FOUND);
    }
    throw err;
  }
};

const GetWarehouseById = async (req, res) => {
  try {
    const warehouse = await prisma.warehouses.findFirstOrThrow({
      where: {
        id: +req.params.id,
      },
    });
    res.json(warehouse);
  } catch (err) {
    if (err?.code === "P2025") {
      throw new NotFoundException("Warehouse not found", ErrorCodes.WAREHOUSE_NOT_FOUND);
    }
    throw err;
  }
};

module.exports = {
  GetWarehouseName,
  CreateWarehouseName,
  GetWarehouseById,
  UpdateWarehouse,
  DeleteWarehouse,
};
