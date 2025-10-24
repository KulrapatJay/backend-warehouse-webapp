const { PrismaClient } = require("@prisma/client");
const { ErrorCodes } = require("../../../exception/root");
const NotFoundException = require("../../../exception/not-found");
const ConflictException = require("../../../exception/conflict");
const BadRequestException = require("../../../exception/bad-requests");
const prisma = new PrismaClient();

const GetCustomers = async (req, res) => {
  const customers = await prisma.customers.findMany({
    select: {
      id: true,
      customer_code: true,
      name: true,
      address: true,
      phone: true,
      created_at: true,
      updated_at: true,
    },
  });
  res.json(customers);
};

const CreateCustomer = async (req, res) => {
  try {
    const { customer_code, name, address, phone } = req.body;

    if (!customer_code || !name) {
      throw new BadRequestException(
        "กรุณากรอกรหัสลูกค้าและชื่อลูกค้า",
        ErrorCodes.BAD_REQUEST
      );
    }
    const existingCustomer = await prisma.customers.findFirst({
      where: {
        OR: [{ customer_code: customer_code }, { name: name }],
      },
    });
    if (existingCustomer) {
      if (existingCustomer.customer_code === customer_code) {
        throw new ConflictException(
          "รหัสลูกค้านี้มีอยู่ในระบบแล้ว",
          ErrorCodes.CUSTOMER_ALREADY_EXISTS
        );
      }
      if (existingCustomer.name === name) {
        throw new ConflictException(
          "ชื่อลูกค้านี้มีอยู่ในระบบแล้ว",
          ErrorCodes.CUSTOMER_ALREADY_EXISTS
        );
      }
    }
    const newCustomer = await prisma.customers.create({
      data: {
        customer_code,
        name,
        address: address || null,
        phone: phone || null,
      },
    });
    res.status(201).json(newCustomer);
  } catch (err) {
    if (err.code === "P2002") {
      throw new ConflictException(
        "ข้อมูลลูกค้านี้มีอยู่ในระบบแล้ว",
        ErrorCodes.CUSTOMER_ALREADY_EXISTS
      );
    }
    throw err;
  }
};

const UpdateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_code, name, address, phone } = req.body;

    if (!customer_code || !name) {
      throw new BadRequestException(
        "กรุณากรอกรหัสลูกค้าและชื่อลูกค้า",
        ErrorCodes.BAD_REQUEST
      );
    }

    const existingCustomer = await prisma.customers.findUnique({
      where: { id: +id },
    });

    if (!existingCustomer) {
      throw new NotFoundException(
        "ไม่พบข้อมูลลูกค้า",
        ErrorCodes.CUSTOMER_NOT_FOUND
      );
    }

    // ตรวจสอบรหัสลูกค้าซ้ำ (ยกเว้นตัวเอง)
    const duplicateCustomer = await prisma.customers.findFirst({
      where: {
        customer_code: customer_code,
        id: { not: +id },
      },
    });

    if (duplicateCustomer) {
      throw new ConflictException(
        "รหัสลูกค้านี้มีอยู่ในระบบแล้ว",
        ErrorCodes.CUSTOMER_ALREADY_EXISTS
      );
    }

    // อัปเดตข้อมูลลูกค้า
    await prisma.$executeRaw`
      UPDATE customers 
      SET customer_code = ${customer_code}, 
          name = ${name}, 
          address = ${address || null}, 
          phone = ${phone || null}, 
          updated_at = NOW() 
      WHERE id = ${+id}
    `;
    const updatedCustomer = await prisma.customers.findUnique({
      where: { id: +id },
    });

    res.json(updatedCustomer);
  } catch (err) {
    throw err;
  }
};

const GetCustomersById = async (req, res) => {
  try {
    const customer = await prisma.customers.findFirstOrThrow({
      where: {
        id: +req.params.id,
      },
    });
    res.json(customer);
  } catch (err) {
    throw new NotFoundException(
      "Customer not found",
      ErrorCodes.CUSTOMER_NOT_FOUND
    );
  }
};

const DeleteCustomer = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.customers.delete({
      where: { id },
    });
    return res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    if (err?.code === "P2025") {
      throw new NotFoundException("Customer not found", ErrorCodes.CUSTOMER_NOT_FOUND);
    }
    throw err;
  }
};

module.exports = {
  GetCustomers,
  GetCustomersById,
  CreateCustomer,
  UpdateCustomer,
  DeleteCustomer,
};
