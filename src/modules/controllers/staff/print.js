const printerService = require('../../../services/printerService');
const { PrismaClient } = require('@prisma/client');
const NotFoundException = require("../../../exception/not-found");
const ConflictException = require("../../../exception/conflict");
const BadRequestException = require("../../../exception/bad-requests");
const { ErrorCodes } = require('../../../exception/root');

const prisma = new PrismaClient();

const InitializePrinter = async (req, res) => {
  try {
    const success = await printerService.initialize();
    
    if (!success) {
      throw new ConflictException('Failed to initialize printer. Please check connection.', ErrorCodes.PRINTER_INIT_FAILED);
    }

    res.status(200).json({
      success: true,
      message: 'Printer ES-8803 initialized successfully'
    });

  } catch (error) {
    if (error instanceof ConflictException) {
      throw error;
    }
    
    console.error('InitializePrinter error:', error);
    throw new ConflictException(
      'ไม่สามารถเชื่อมต่อเครื่องพิมพ์ได้',
      ErrorCodes.PRINTER_CONNECTION_FAILED
    );
  }
};

const PrintSalesOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Validate orderId
    if (!orderId || isNaN(parseInt(orderId))) {
      throw new BadRequestException('Invalid order ID provided', ErrorCodes.BAD_REQUEST);
    }

    // ตรวจสอบสถานะของเครื่องพิมพ์ก่อนทำการพิมพ์
    const printerStatus = await printerService.checkPrinterStatus();
    if (!printerStatus) {
      throw new ConflictException('Printer is not ready. Please initialize printer first.', ErrorCodes.PRINTER_NOT_READY);
    }
    
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
      throw new NotFoundException('Sales order not found', ErrorCodes.SALES_ORDER_NOT_FOUND);
    }

    // ตรวจสอบว่ามี items หรือไม่
    if (!salesOrder.items || salesOrder.items.length === 0) {
      throw new BadRequestException('Sales order has no items to print', ErrorCodes.ORDER_NO_ITEMS);
    }

    // เตรียมข้อมูลสำหรับพิมพ์ตาม structure ของ sales-orders
    const printData = {
      orderId: salesOrder.order_no || `SO-${salesOrder.id}`,
      customer: salesOrder.customer?.name || 'Walk-in Customer',
      items: salesOrder.items.map(item => ({
        name: item.product?.product_name || 'Unknown Product',
        quantity: item.quantity || 0,
        price: parseFloat(item.unit_price) || 0,
        total: parseFloat((item.quantity || 0) * (item.unit_price || 0))
      })),
      total: parseFloat(salesOrder.total_amount) || 0,
      date: salesOrder.order_date || salesOrder.created_at,
      status: salesOrder.status?.status_name || 'Processing',
      staff: salesOrder.creator ? 
        `${salesOrder.creator.prefix?.name || ''}${salesOrder.creator.first_name} ${salesOrder.creator.last_name}`.trim() 
        : 'System'
    };

    // พยายามพิมพ์และจัดการ error
    let result;
    try {
      result = await printerService.printReceipt(printData);
    } catch (printError) {
      // หากเกิดข้อผิดพลาดในการพิมพ์ให้พยายาม disconnect แล้วเชื่อมต่อใหม่
      console.error('Print error:', printError.message);
      
      try {
        await printerService.disconnect();
        await new Promise(resolve => setTimeout(resolve, 1000)); // รอ 1 วินาที
        await printerService.initialize();
        result = await printerService.printReceipt(printData);
      } catch (retryError) {
        throw new ConflictException(
          `Printing failed: ${printError.message}. Retry also failed.`,
          ErrorCodes.PRINT_FAILED
        );
      }
    }
    
    res.status(200).json({
      success: true,
      message: result || 'Print job completed successfully',
      orderInfo: {
        orderId: printData.orderId,
        customer: printData.customer,
        total: printData.total,
        itemCount: printData.items.length
      }
    });

  } catch (error) {
    console.error('PrintSalesOrder Error:', error);
    
    try {
      if (printerService.disconnect && typeof printerService.disconnect === 'function') {
        await printerService.disconnect();
      }
    } catch (disconnectError) {
      console.error('Error disconnecting printer:', disconnectError.message);
    }
    
    if (error instanceof NotFoundException || 
        error instanceof BadRequestException || 
        error instanceof ConflictException) {
      throw error;
    }
    
    // Generic error
    throw new ConflictException(
      'ไม่สามารถพิมพ์ใบสั่งซื้อได้',
      ErrorCodes.PRINT_ORDER_FAILED
    );
  }
};

const PrintCustomReceipt = async (req, res) => {
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

    // ตรวจสอบสถานะของเครื่องพิมพ์
    const printerStatus = await printerService.checkPrinterStatus();
    if (!printerStatus) {
      throw new ConflictException('Printer is not ready. Please initialize printer first.', ErrorCodes.PRINTER_NOT_READY);
    }
    
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
      message: result || 'Custom receipt printed successfully'
    });

  } catch (error) {
    console.error('PrintCustomReceipt Error:', error);
    
    if (error instanceof BadRequestException || error instanceof ConflictException) {
      throw error;
    }
    
    throw new ConflictException(
      'ไม่สามารถพิมพ์ใบเสร็จได้',
      ErrorCodes.PRINT_RECEIPT_FAILED
    );
  }
};

const TestPrint = async (req, res) => {
  try {
    // ตรวจสอบสถานะของเครื่องพิมพ์
    const printerStatus = await printerService.checkPrinterStatus();
    if (!printerStatus) {
      throw new ConflictException('Printer is not ready. Please initialize printer first.', ErrorCodes.PRINTER_NOT_READY);
    }

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
      message: result || 'Test print completed successfully',
      testData
    });

  } catch (error) {
    console.error('TestPrint Error:', error);
    
    if (error instanceof ConflictException) {
      throw error;
    }
    
    throw new ConflictException(
      'ไม่สามารถทดสอบการพิมพ์ได้',
      ErrorCodes.TEST_PRINT_FAILED
    );
  }
};

module.exports = {
  InitializePrinter,
  PrintSalesOrder,
  PrintCustomReceipt,
  TestPrint
};