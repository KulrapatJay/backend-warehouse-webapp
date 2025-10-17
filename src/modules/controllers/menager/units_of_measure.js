const { PrismaClient } = require("@prisma/client");
const { ErrorCodes } = require("../../../exception/root");
const NotFoundException = require("../../../exception/not-found");
const ConflictException = require("../../../exception/conflict");
const BadRequestException = require("../../../exception/bad-requests");
const prisma = new PrismaClient();

const GetUnitName = async (req, res) => {
  const units = await prisma.units_of_measure.findMany({
    select: {
      id: true,
      unit_name: true,
    },
  });
  res.json(units);
};

const CreateUnitName = async (req, res) => {
  try {
    const { unit_name } = req.body;

    if (!unit_name || unit_name.trim() === "") {
      throw new BadRequestException(
        "ชื่อหน่วยวัดไม่สามารถเว้นว่างได้",
        ErrorCodes.UNIT_NAME_REQUIRED
      );
    }

    const existingUnit = await prisma.units_of_measure.findUnique({
      where: {
        unit_name: unit_name.trim(),
      },
    });
    if (existingUnit) {
      throw new ConflictException(
        "มีหน่วยนับมาตรฐานชื่อนี้อยู่แล้ว",
        ErrorCodes.UNIT_ALREADY_EXISTS
      );
    }
    const newUnit = await prisma.units_of_measure.create({
      data: {
        unit_name: unit_name.trim(),
      },
    });
    return res.status(201).json({
      success: true,
      message: "สร้างหน่วยนับมาตรฐานสำเร็จ",
      data: newUnit,
    });
  } catch (err) {
    if (err?.code === "P2005") {
      throw new ConflictException(
        "มีหน่วยนับมาตรฐานชื่อนี้อยู่แล้ว",
        ErrorCodes.UNIT_ALREADY_EXISTS
      );
    }
    throw err;
  }
};

const UpdateUnitName = async (req, res) => {
  try {
    const { unit_name } = req.body;

    if (!unit_name || unit_name.trim() === "") {
      throw new BadRequestException(
        "ชื่อหน่วยวัดไม่สามารถเว้นว่างได้",
        ErrorCodes.UNIT_NAME_REQUIRED
      );
    }

    const id = parseInt(req.params.id, 10);
    const updatedUnit = await prisma.units_of_measure.update({
      where: { id },
      data: { unit_name: unit_name.trim() },
    });
    res.json(updatedUnit);
  } catch (err) {
    if (err?.code === "P2025") {
      throw new NotFoundException("Unit not found", ErrorCodes.UNIT_NOT_FOUND);
    }
    throw err;
  }
};

const DeleteUnitName = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.units_of_measure.delete({
      where: { id },
    });
    res.json({ message: "Unit deleted successfully" });
  } catch (err) {
    if (err?.code === "P2025") {
      throw new NotFoundException("Unit not found", ErrorCodes.UNIT_NOT_FOUND);
    }
    throw err;
  }
};

const GetUnitsById = async (req, res) => {
  try {
    const unit = await prisma.units_of_measure.findFirstOrThrow({
      where: {
        id: +req.params.id,
      },
    });
    res.json(unit);
  } catch (err) {
    if (err?.code === "P2025") {
      throw new NotFoundException("Unit not found", ErrorCodes.UNIT_NOT_FOUND);
    }
    throw err;
  }
};

module.exports = {
  GetUnitName,
  CreateUnitName,
  GetUnitsById,
  UpdateUnitName,
  DeleteUnitName,
};
