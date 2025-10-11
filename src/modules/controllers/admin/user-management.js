const { PrismaClient } = require("@prisma/client");
const { ErrorCodes } = require("../../../exception/root");
const NotFoundException = require("../../../exception/not-found");
const { UpdateUserSchema } = require("../../../schema/users");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

const GetUsers = async (req, res) => {
  const users = await prisma.users.findMany({
    select: {
      id: true,
      employee_id: true,
      prefix: {
        select: {
          name: true,
        },
      },
      first_name: true,
      last_name: true,
      username: true,
      role: {
        select: {
          role_name: true,
        },
      },
      last_login: true,
      updated_at: true,
    },
  });
  res.json(users);
};

const UpdateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const body = UpdateUserSchema.parse(req.body);
    const data = {
      first_name: body.first_name,
      last_name: body.last_name,
      username: body.username,
      prefix_id: body.prefix_id,
      role_id: body.role_id,
    };
    if (body.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(body.password, salt);
    }
    await prisma.users.update({
      where: { id },
      data: data,
    });
    await prisma.$executeRaw`UPDATE users SET updated_at = NOW() WHERE id = ${id}`;
    const updatedUser = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true, 
        employee_id: true,
        prefix: { select: { name: true } },
        first_name: true,
        last_name: true,
        username: true,
        role: { select: { role_name: true } },
        last_login: true,
        updated_at: true,
      },
    });

    res.json(updatedUser);
  } catch (err) {
    if (err?.code === "P2025") {
      throw new NotFoundException("User not found", ErrorCodes.USER_NOT_FOUND);
    }
    throw err;
  }
};

const DeleteUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.users.delete({
      where: { id },
    });
    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    if (err?.code === "P2025") {
      throw new NotFoundException("User not found", ErrorCodes.USER_NOT_FOUND);
    }
    throw err;
  }
};

const GetUserById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        employee_id: true,
        prefix: {
          select: {
            name: true,
          },
        },
        first_name: true,
        last_name: true,
        username: true,
        role: {
          select: {
            role_name: true,
          },
        },
        last_login: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found", ErrorCodes.USER_NOT_FOUND);
    }

    res.json(user);
  } catch (err) {
    throw err;
  }
};

module.exports = {
  GetUsers,
  UpdateUser,
  DeleteUser,
  GetUserById,
};
