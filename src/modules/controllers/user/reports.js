const { PrismaClient } = require("@prisma/client");
const { ErrorCodes } = require("../../../exception/root");
const NotFoundException = require("../../../exception/not-found");
const ConflictException = require("../../../exception/conflict");
const BadRequestException = require("../../../exception/bad-requests");
const prisma = new PrismaClient();

const GetReports = async (req, res) => {
    // 1. รับค่า Filter จาก Query String
    const { startDate, endDate } = req.query;

    // 2. สร้างเงื่อนไขการค้นหา (where clause) แบบไดนามิก
    const whereClause = {};

    if (startDate && endDate) {
        whereClause.order_date = {
            gte: new Date(startDate),
            lte: new Date(endDate),
        };
    }
    
    // 3. ดึงข้อมูลแบบประกอบร่าง (Nested Retrieval)
    const reports = await prisma.sales_orders.findMany({
        where: whereClause,
        orderBy: {
            order_date: 'desc'
        },
        select: {
            id: true,
            order_date: true,
            total_amount: true,
            created_at: true,
            updated_at: true,
            // เเสดงข้อมูล status
            status: {
                select: {
                    id: true, 
                    status_name: true 
                }
            },
            // เเสดงข้อมูลรายการสั่งซื้อ (items)
            items: { 
                select: {
                    id: true,
                    quantity: true,
                    unit_price: true,
                    // เเสดงข้อมูล product 
                    product: {
                        select: {
                            id: true,
                            product_name: true,
                        }
                    }
                }
            },
        }
    });

    res.json(reports);
};

module.exports = {
    GetReports,
};