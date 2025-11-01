const { PrismaClient } = require('@prisma/client');
const NotFoundException = require("../../../exception/not-found");
const BadRequestException = require("../../../exception/bad-requests");
const { ErrorCodes } = require('../../../exception/root');

const prisma = new PrismaClient();

const GetSalesOrderForPrint = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    
    // Validate orderId
    if (!orderId || isNaN(parseInt(orderId))) {
      throw new BadRequestException('Invalid order ID provided', ErrorCodes.BAD_REQUEST);
    }
    
    // ดึงข้อมูลจาก sales_orders ตาม schema ของคุณ
    const salesOrder = await prisma.sales_orders.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        customer: {
          select: {
            customer_code: true,
            name: true,
            phone: true,
            address: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                product_name: true,
                sku: true,
                price: true
              }
            }
          }
        },
        status: {
          select: {
            status_name: true
          }
        },
        creator: {
          select: {
            first_name: true,
            last_name: true,
            prefix: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!salesOrder) {
      throw new NotFoundException('Sales order not found', ErrorCodes.SALES_ORDER_NOT_FOUND);
    }

    // ตรวจสอบว่ามี items หรือไม่
    if (!salesOrder.items || salesOrder.items.length === 0) {
      throw new BadRequestException('Sales order has no items to print', ErrorCodes.ORDER_NO_ITEMS);
    }

    // จัดรูปแบบข้อมูลสำหรับ frontend
    const printData = {
      orderId: salesOrder.order_no || `SO-${salesOrder.id}`,
      orderNumber: salesOrder.order_no,
      customer: {
        code: salesOrder.customer?.customer_code,
        name: salesOrder.customer?.name || 'Walk-in Customer',
        phone: salesOrder.customer?.phone,
        address: salesOrder.customer?.address
      },
      items: salesOrder.items.map(item => ({
        productName: item.product?.product_name || 'Unknown Product',
        sku: item.product?.sku,
        quantity: item.quantity || 0,
        unitPrice: parseFloat(item.unit_price) || 0,
        total: parseFloat((item.quantity || 0) * (item.unit_price || 0))
      })),
      subtotal: salesOrder.items.reduce(
        (sum, item) => sum + parseFloat((item.quantity || 0) * (item.unit_price || 0)),
        0
      ),
      discount: parseFloat(salesOrder.discount) || 0,
      tax: parseFloat(salesOrder.tax) || 0,
      total: parseFloat(salesOrder.total_amount) || 0,
      orderDate: salesOrder.order_date || salesOrder.created_at,
      status: salesOrder.status?.status_name || 'Processing',
      staff: salesOrder.creator ? 
        `${salesOrder.creator.prefix?.name || ''}${salesOrder.creator.first_name} ${salesOrder.creator.last_name}`.trim() 
        : 'System',
      notes: salesOrder.notes
    };

    res.status(200).json({
      success: true,
      data: printData
    });

  } catch (error) {
    console.error('GetSalesOrderForPrint Error:', error);
    next(error);
  }
};

const GetCustomReceiptData = async (req, res, next) => {
  try {
    const { orderId, customer, items, total } = req.body;
    
    // Validate required fields
    if (!orderId || !customer || !items || !total) {
      throw new BadRequestException(
        'Missing required fields: orderId, customer, items, or total',
        ErrorCodes.BAD_REQUEST
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Items must be a non-empty array', ErrorCodes.BAD_REQUEST);
    }

    // Validate items structure
    for (const item of items) {
      if (!item.name || !item.quantity || !item.price) {
        throw new BadRequestException(
          'Each item must have name, quantity, and price',
          ErrorCodes.BAD_REQUEST
        );
      }
    }
    
    const printData = {
      orderId,
      customer,
      items,
      total,
      date: new Date()
    };

    res.status(200).json({
      success: true,
      data: printData
    });

  } catch (error) {
    console.error('GetCustomReceiptData Error:', error);
    next(error);
  }
};

module.exports = {
  GetSalesOrderForPrint,
  GetCustomReceiptData
};