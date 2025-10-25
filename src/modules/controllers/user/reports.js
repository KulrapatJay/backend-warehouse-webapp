const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ErrorCodes } = require("../../../exception/root");
const NotFoundException = require("../../../exception/not-found");
const ConflictException = require("../../../exception/conflict");
const BadRequestException = require("../../../exception/bad-requests");

const getSalesOrders = async (req, res) => {
    const salesOrders = await prisma.sales_orders.findMany({
        orderBy: {
            order_date: 'desc'
        },
        select: {
            id: true,
            order_date: true,
            total_amount: true,
            status_id: true, // ใช้สำหรับกรองสถานะ
            created_at: true,  
            updated_at: true   
        }
    });
    res.json(salesOrders);
};

const getSalesOrderItems = async (req, res) => {
    const salesOrderItems = await prisma.sales_order_items.findMany({
        orderBy: {
            id: 'desc'
        },
        select: {
            sales_order_id: true,
            product_id: true,
            quantity: true,
            unit_price: true,
            created_at: true,  
            updated_at: true 
        }
    });
    res.json(salesOrderItems);
};

const getProducts = async (req, res) => {
    const products = await prisma.products.findMany({
        orderBy: {
            id: 'asc'
        },
        select: {
            id: true,
            product_name: true,
            price: true,
            created_at: true,  
            updated_at: true 
        }
    });
    res.json(products);
};

module.exports = {
    getSalesOrders,
    getSalesOrderItems,
    getProducts,
};