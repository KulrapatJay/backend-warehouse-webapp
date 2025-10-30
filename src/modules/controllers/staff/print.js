const printerService = require('../../../services/printerService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const InitializePrinter = async (req, res) => {
  try {
    const success = await printerService.initialize();
    
    if (success) {
      res.status(200).json({
        success: true,
        message: 'Printer ES-8803 initialized successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to initialize printer. Please check connection.'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const PrintSalesOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // ดึงข้อมูลจาก sales_orders ตาม schema ของคุณ
    const salesOrder = await prisma.sales_orders.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        customer: {
          select: {
            customer_code: true,
            name: true,
            phone: true
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
      return res.status(404).json({
        success: false,
        error: 'Sales order not found'
      });
    }

    // เตรียมข้อมูลสำหรับพิมพ์ตาม structure ของ sales-orders
    const printData = {
      orderId: salesOrder.order_no || `SO-${salesOrder.id}`,
      customer: salesOrder.customer?.name || 'Walk-in Customer',
      items: salesOrder.items.map(item => ({
        name: item.product.product_name,
        quantity: item.quantity,
        price: parseFloat(item.unit_price),
        total: parseFloat(item.quantity * item.unit_price)
      })),
      total: parseFloat(salesOrder.total_amount),
      date: salesOrder.order_date || salesOrder.created_at,
      status: salesOrder.status?.status_name || 'Processing',
      staff: salesOrder.creator ? 
        `${salesOrder.creator.prefix?.name || ''}${salesOrder.creator.first_name} ${salesOrder.creator.last_name}`.trim() 
        : 'System'
    };

    const result = await printerService.printReceipt(printData);
    
    res.status(200).json({
      success: true,
      message: result,
      orderInfo: {
        orderId: printData.orderId,
        customer: printData.customer,
        total: printData.total,
        itemCount: printData.items.length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const PrintCustomReceipt = async (req, res) => {
  try {
    const { orderId, customer, items, total } = req.body;
    
    const printData = {
      orderId,
      customer,
      items,
      total,
      date: new Date()
    };

    const result = await printerService.printReceipt(printData);
    
    res.status(200).json({
      success: true,
      message: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const TestPrint = async (req, res) => {
  try {
    const testData = {
      orderId: 'TEST-' + Date.now(),
      customer: 'Test Customer',
      items: [
        { name: 'Test Product A', quantity: 2, price: 25.00, total: 50.00 },
        { name: 'Test Product B', quantity: 1, price: 15.00, total: 15.00 }
      ],
      total: 65.00,
      date: new Date()
    };

    const result = await printerService.printReceipt(testData);
    
    res.status(200).json({
      success: true,
      message: result,
      testData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  InitializePrinter,
  PrintSalesOrder,
  PrintCustomReceipt,
  TestPrint
};