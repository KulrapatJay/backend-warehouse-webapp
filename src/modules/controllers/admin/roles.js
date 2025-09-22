const { PrismaClient } = require("@prisma/client");
const { ErrorCodes } = require("../../../exception/root");
const NotFoundException  = require("../../../exception/not-found");
const prisma = new PrismaClient();

const GetRoles = async (req, res) => {
  const roles = await prisma.roles.findMany({
    select: {
      id: true,
      role_name: true,
    }
  });
  res.json(roles);
};

const GetRolesById = async (req, res) => {
  try {
      const role = await prisma.roles.findFirstOrThrow({
          where: { 
            id: +req.params.id
          }
      })
      res.json(role)
  } catch (err) {
    throw new NotFoundException("Role not found", ErrorCodes.ROLE_NOT_FOUND);
  }
}

module.exports = {
  GetRoles,
  GetRolesById,
};