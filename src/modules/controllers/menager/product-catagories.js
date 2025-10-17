const { PrismaClient } = require("@prisma/client");
const { ErrorCodes } = require("../../../exception/root");
const NotFoundException = require("../../../exception/not-found");
const ConflictException = require("../../../exception/conflict");
const BadRequestException = require("../../../exception/bad-requests");
const prisma = new PrismaClient();

const GetCategories = async (req, res) => {
  const categories = await prisma.product_categories.findMany({
    select: {
      id: true,
      category_name: true,
    },
  });
  res.json(categories);
};

const CreateCategory = async (req, res) => {
  try {
    const { category_name } = req.body;

    if (!category_name || category_name.trim() === "") {
      throw new BadRequestException(
        "ชื่อหมวดหมู่สินค้าไม่สามารถเว้นว่างได้",
        ErrorCodes.CATEGORY_NAME_REQUIRED
      );
    }

    const existingCategory = await prisma.product_categories.findUnique({
      where: {
        category_name: category_name.trim(),
      },
    });
    if (existingCategory) {
      throw new ConflictException(
        "มีหมวดหมู่สินค้าชื่อนี้อยู่แล้ว",
        ErrorCodes.CATEGORY_ALREADY_EXISTS
      );
    }
    const newCategory = await prisma.product_categories.create({
      data: {
        category_name: category_name.trim(),
      },
    });
    return res.status(201).json({
      success: true,
      message: "สร้างหมวดหมู่สินค้าสำเร็จ",
      data: newCategory,
    });
  } catch (err) {
    if (err?.code === "P2005") {
      throw new ConflictException(
        "มีหมวดหมู่สินค้าชื่อนี้อยู่แล้ว",
        ErrorCodes.CATEGORY_ALREADY_EXISTS
      );
    }
    throw err;
  }
};

const UpdateCategory = async (req, res) => {
  try {
    const { category_name } = req.body;

    if (!category_name || category_name.trim() === "") {
      throw new BadRequestException(
        "ชื่อหมวดหมู่สินค้าไม่สามารถเว้นว่างได้",
        ErrorCodes.CATEGORY_NAME_REQUIRED
      );
    }

    const id = parseInt(req.params.id, 10);
    const updatedCategory = await prisma.product_categories.update({
      where: { id },
      data: { category_name: category_name.trim() },
    });
    res.json(updatedCategory);
  } catch (err) {
    if (err?.code === "P2025") {
      throw new NotFoundException(
        "Category not found",
        ErrorCodes.CATEGORY_NOT_FOUND
      );
    }
    throw err;
  }
};

const DeleteCategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.product_categories.delete({
      where: { id },
    });
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    if (err?.code === "P2025") {
      throw new NotFoundException(
        "Category not found",
        ErrorCodes.CATEGORY_NOT_FOUND
      );
    }
    throw err;
  }
};

const GetCategoriesById = async (req, res) => {
  try {
    const category = await prisma.product_categories.findFirstOrThrow({
      where: {
        id: +req.params.id,
      },
    });
    res.json(category);
  } catch (err) {
    if (err?.code === "P2025") {
      throw new NotFoundException(
        "Category not found",
        ErrorCodes.CATEGORY_NOT_FOUND
      );
    }
    throw err;
  }
};

module.exports = {
  GetCategories,
  CreateCategory,
  GetCategoriesById,
  UpdateCategory,
  DeleteCategory,
};
