const { PrismaClient } = require("@prisma/client");
const { ErrorCodes } = require("../../../exception/root");
const NotFoundException  = require("../../../exception/not-found");
const prisma = new PrismaClient();

const GetPrefixes = async (req, res) => {
  const prefixes = await prisma.prefixes.findMany({
    select: {
      id: true,
      name: true,
    }
  });
  res.json(prefixes);
};

const GetPrefixesById = async (req, res) => {
  try {
      const prefix = await prisma.prefixes.findFirstOrThrow({
          where: { 
            id: +req.params.id
          }
      })
      res.json(prefix)
  } catch (err) {
    throw new NotFoundException("Prefix not found", ErrorCodes.PREFIX_NOT_FOUND);
  }
}

module.exports = {
  GetPrefixes,
  GetPrefixesById,
};