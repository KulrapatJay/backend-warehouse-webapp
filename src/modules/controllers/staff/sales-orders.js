const { PrismaClient, Prisma } = require("@prisma/client");
const { ErrorCodes } = require("../../../exception/root");
const NotFoundException = require("../../../exception/not-found");
const ConflictException = require("../../../exception/conflict");
const BadRequestException = require("../../../exception/bad-requests");
const prisma = new PrismaClient();

const GetSalesOrders = async (req, res) => {
  try {
    const salesOrders = await prisma.sales_orders.findMany({
      select: {
        id: true,
        order_no: true,
        order_date: true,
        total_amount: true,
        notes: true,
        created_at: true,
        updated_at: true,
        // แสดงข้อมูลลูกค้าแทน customer_id
        customer: {
          select: {
            id: true,
            customer_code: true,
            name: true,
            phone: true,
          },
        },
        // แสดงข้อมูล status แทน status_id
        status: {
          select: {
            id: true,
            status_name: true,
            description: true,
          },
        },
        // แสดงข้อมูลผู้สร้างแทน created_by
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            prefix: {
              select: {
                name: true,
              },
            },
          },
        },
        // แสดงรายการสินค้าในใบสั่งซื้อ
        items: {
          select: {
            id: true,
            quantity: true,
            unit_price: true,
            product: {
              select: {
                id: true,
                product_name: true,
                sku: true,
                category: {
                  select: {
                    category_name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    res.json(salesOrders);
  } catch (err) {
    throw new NotFoundException(
      "ไม่พบคำสั่งซื้อ",
      ErrorCodes.SALES_ORDER_NOT_FOUND
    );
  }
};

const CreateSalesOrder = async (req, res) => {
  try {
    const { customer_id, warehouse_id, notes, items } = req.body;
    const created_by = req.user.id;

    // Validation
    if (!customer_id || !warehouse_id || !items || items.length === 0) {
      throw new BadRequestException(
        "กรุณาระบุลูกค้า คลังสินค้า และรายการสินค้า",
        ErrorCodes.BAD_REQUEST
      );
    }

    // ตรวจสอบว่าลูกค้ามีอยู่จริง
    const customer = await prisma.customers.findUnique({
      where: { id: customer_id },
    });

    if (!customer) {
      throw new NotFoundException(
        "ไม่พบข้อมูลลูกค้า",
        ErrorCodes.CUSTOMER_NOT_FOUND
      );
    }

    // ตรวจสอบว่าคลังสินค้ามีอยู่จริง
    const warehouse = await prisma.warehouses.findUnique({
      where: { id: warehouse_id },
    });

    if (!warehouse) {
      throw new NotFoundException(
        "ไม่พบข้อมูลคลังสินค้า",
        ErrorCodes.WAREHOUSE_NOT_FOUND
      );
    }

    // ตรวจสอบสินค้าทั้งหมดในคลังที่เลือก
    const productChecks = [];
    let total_amount = 0;

    for (const item of items) {
      const product = await prisma.products.findUnique({
        where: { sku: item.sku },
      });

      if (!product) {
        throw new NotFoundException(
          `ไม่พบสินค้าที่มี SKU: ${item.sku}`,
          ErrorCodes.PRODUCT_NOT_FOUND
        );
      }

      // *** เปลี่ยนการหาสินค้าในคลัง - เรียงตาม FIFO ***
      const productWarehouses = await prisma.product_warehouses.findMany({
        where: {
          product_id: product.id,
          warehouse_id: warehouse_id,
          quantity: { gt: 0 }, // เฉพาะที่มีจำนวนมากกว่า 0
          OR: [
            { expiry_date: null }, // ไม่มีวันหมดอายุ
            { expiry_date: { gte: new Date() } }, // หรือยังไม่หมดอายุ
          ],
        },
        orderBy: [
          { expiry_date: "asc" }, // เรียงตามวันหมดอายุ (เก่าที่สุดก่อน)
          { created_at: "asc" }, // ถ้าวันหมดอายุเท่ากันให้เรียงตามวันที่สร้าง
        ],
      });

      if (productWarehouses.length === 0) {
        throw new NotFoundException(
          `สินค้า ${product.product_name} (${item.sku}) ไม่มีในคลัง ${warehouse.name} หรือหมดอายุแล้ว`,
          ErrorCodes.PRODUCT_NOT_IN_WAREHOUSE
        );
      }

      // คำนวณจำนวนรวมที่มีอยู่
      const totalAvailable = productWarehouses.reduce(
        (sum, pw) => sum + pw.quantity,
        0
      );

      if (totalAvailable < item.quantity) {
        throw new BadRequestException(
          `สินค้า ${product.product_name} (${item.sku}) มีสต็อกไม่เพียงพอ (คงเหลือ: ${totalAvailable}, ต้องการ: ${item.quantity})`,
          ErrorCodes.INSUFFICIENT_STOCK
        );
      }

      // เตรียมข้อมูลสำหรับการหักสต็อกแบบ FIFO
      let remainingQuantity = item.quantity;
      const stockToDeduct = [];

      for (const pw of productWarehouses) {
        if (remainingQuantity <= 0) break;

        const deductQty = Math.min(remainingQuantity, pw.quantity);
        stockToDeduct.push({
          warehouse_record_id: pw.id,
          product_id: pw.product_id,
          deduct_quantity: deductQty,
          expiry_date: pw.expiry_date,
        });

        remainingQuantity -= deductQty;
      }

      productChecks.push({
        product_id: product.id,
        product_name: product.product_name,
        sku: product.sku,
        requested_quantity: item.quantity,
        unit_price: product.price,
        stock_to_deduct: stockToDeduct, // เก็บรายละเอียดการหักสต็อก
      });

      total_amount += parseFloat(product.price) * parseInt(item.quantity);
    }

    const result = await prisma.$transaction(async (tx) => {
      // สร้างออเดอร์
      const newOrder = await tx.sales_orders.create({
        data: {
          customer_id,
          order_date: new Date(),
          created_by,
          total_amount: total_amount.toFixed(2),
          notes,
          items: {
            create: productChecks.map((item) => ({
              product_id: item.product_id,
              quantity: item.requested_quantity,
              unit_price: item.unit_price,
            })),
          },
        },
        include: {
          customer: {
            select: {
              customer_code: true,
              name: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  product_name: true,
                  sku: true,
                },
              },
            },
          },
        },
      });

      // *** หักสต็อกแบบ FIFO ***
      for (const item of productChecks) {
        for (const stock of item.stock_to_deduct) {
          // 1. ลดสต็อกใน product_warehouses แต่ละ record
          await tx.product_warehouses.update({
            where: { id: stock.warehouse_record_id },
            data: {
              quantity: {
                decrement: stock.deduct_quantity,
              },
            },
          });

          await tx.inventory_movements.create({
            data: {
              product_id: stock.product_id,
              source_warehouse_id: warehouse_id,
              destination_warehouse_id: null,
              quantity_moved: stock.deduct_quantity,
              movement_type: "OUT",
              movement_date: new Date(),
              notes: `ขายสินค้า (FIFO) - ออเดอร์ ${newOrder.order_no}${
                stock.expiry_date
                  ? ` | หมดอายุ: ${
                      stock.expiry_date.toISOString().split("T")[0]
                    }`
                  : ""
              }`,
              created_by,
            },
          });
        }

        // 3. อัปเดตจำนวนรวมใน products
        await tx.products.update({
          where: { id: item.product_id },
          data: {
            quantity: {
              decrement: item.requested_quantity,
            },
          },
        });
      }

      return newOrder;
    });

    res.status(201).json({
      message: "สร้างใบสั่งซื้อสำเร็จ",
      data: result,
    });
  } catch (err) {
    if (
      err instanceof NotFoundException ||
      err instanceof BadRequestException ||
      err instanceof ConflictException
    ) {
      throw err;
    }

    console.error("CreateSalesOrder error:", err);
    throw new ConflictException(
      "ไม่สามารถสร้างคำสั่งซื้อได้",
      ErrorCodes.SALES_ORDER_CREATE_FAILED
    );
  }
};

const UpdateSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_id, warehouse_id, notes, items, status_id } = req.body;
    const updated_by = req.user.id;

    // Validation
    if (!id || isNaN(parseInt(id))) {
      throw new BadRequestException(
        "กรุณาระบุ ID ที่ถูกต้อง",
        ErrorCodes.BAD_REQUEST
      );
    }

    if (!customer_id || !warehouse_id || !items || items.length === 0) {
      throw new BadRequestException(
        "กรุณาระบุลูกค้า คลังสินค้า และรายการสินค้า",
        ErrorCodes.BAD_REQUEST
      );
    }

    // ตรวจสอบว่าออเดอร์มีอยู่จริงก่อน
    const existingOrder = await prisma.sales_orders.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        status: true,
      },
    });

    if (!existingOrder) {
      throw new NotFoundException(
        "ไม่พบคำสั่งซื้อที่ต้องการแก้ไข",
        ErrorCodes.SALES_ORDER_NOT_FOUND
      );
    }

    // ตรวจสอบสถานะ - ไม่อนุญาตให้แก้ไขถ้าจัดส่งแล้ว
    if (existingOrder.status.status_name === "จัดส่งสำเร็จ") {
      throw new BadRequestException(
        "ไม่สามารถแก้ไขคำสั่งซื้อที่จัดส่งสำเร็จแล้ว",
        ErrorCodes.ORDER_CANNOT_UPDATE
      );
    }

    // ตรวจสอบ status_id หลังจากมี existingOrder แล้ว
    if (status_id) {
      const status = await prisma.order_statuses.findUnique({
        where: { id: status_id },
      });

      if (!status) {
        throw new NotFoundException(
          "ไม่พบสถานะที่เลือก",
          ErrorCodes.STATUS_NOT_FOUND
        );
      }

      // ตรวจสอบกฎการเปลี่ยนสถานะ
      if (
        existingOrder.status.status_name === "จัดส่งสำเร็จ" &&
        status.status_name !== "จัดส่งสำเร็จ"
      ) {
        throw new BadRequestException(
          "ไม่สามารถเปลี่ยนสถานะจาก 'จัดส่งสำเร็จ' เป็นสถานะอื่น",
          ErrorCodes.INVALID_STATUS_CHANGE
        );
      }
    }

    // ตรวจสอบว่าลูกค้ามีอยู่จริง
    const customer = await prisma.customers.findUnique({
      where: { id: customer_id },
    });

    if (!customer) {
      throw new NotFoundException(
        "ไม่พบข้อมูลลูกค้า",
        ErrorCodes.CUSTOMER_NOT_FOUND
      );
    }

    // ตรวจสอบว่าคลังสินค้ามีอยู่จริง
    const warehouse = await prisma.warehouses.findUnique({
      where: { id: warehouse_id },
    });

    if (!warehouse) {
      throw new NotFoundException(
        "ไม่พบข้อมูลคลังสินค้า",
        ErrorCodes.WAREHOUSE_NOT_FOUND
      );
    }

    // ตรวจสอบสินค้าใหม่ทั้งหมดในคลังที่เลือก
    const newProductChecks = [];
    let total_amount = 0;

    for (const item of items) {
      // หาสินค้าจาก SKU
      const product = await prisma.products.findUnique({
        where: { sku: item.sku },
      });

      if (!product) {
        throw new NotFoundException(
          `ไม่พบสินค้าที่มี SKU: ${item.sku}`,
          ErrorCodes.PRODUCT_NOT_FOUND
        );
      }

      // ตรวจสอบสต็อกในคลังที่เลือก (รวมกับสินค้าเดิมที่จะคืน)
      const productWarehouse = await prisma.product_warehouses.findFirst({
        where: {
          product_id: product.id,
          warehouse_id: warehouse_id,
        },
      });

      if (!productWarehouse) {
        throw new NotFoundException(
          `สินค้า ${product.product_name} (${item.sku}) ไม่มีในคลัง ${warehouse.name}`,
          ErrorCodes.PRODUCT_NOT_IN_WAREHOUSE
        );
      }

      // หาจำนวนสินค้าเดิมที่จะคืน (ถ้ามี)
      const oldItem = existingOrder.items.find(
        (oldItem) => oldItem.product_id === product.id
      );
      const oldQuantity = oldItem ? oldItem.quantity : 0;
      const availableStock = productWarehouse.quantity + oldQuantity;

      if (availableStock < item.quantity) {
        throw new BadRequestException(
          `สินค้า ${product.product_name} (${item.sku}) มีสต็อกไม่เพียงพอ (คงเหลือ: ${availableStock}, ต้องการ: ${item.quantity})`,
          ErrorCodes.INSUFFICIENT_STOCK
        );
      }

      // เก็บข้อมูลสำหรับการอัพเดตออเดอร์
      newProductChecks.push({
        product_id: product.id,
        product_name: product.product_name,
        sku: product.sku,
        old_quantity: oldQuantity,
        new_quantity: item.quantity,
        unit_price: product.price,
      });

      total_amount += parseFloat(product.price) * parseInt(item.quantity);
    }

    // อัพเดตออเดอร์และจัดการสต็อกในครั้งเดียว (Transaction)
    const result = await prisma.$transaction(async (tx) => {
      // คืนสต็อกสินค้าเดิมทั้งหมด
      for (const oldItem of existingOrder.items) {
        await tx.product_warehouses.updateMany({
          where: {
            product_id: oldItem.product_id,
            warehouse_id: warehouse_id,
          },
          data: {
            quantity: {
              increment: oldItem.quantity,
            },
          },
        });

        // บันทึก inventory movement การคืนสต็อก
        await tx.inventory_movements.create({
          data: {
            product_id: oldItem.product_id,
            source_warehouse_id: null,
            destination_warehouse_id: warehouse_id,
            quantity_moved: oldItem.quantity,
            movement_type: "IN",
            movement_date: new Date(),
            notes: `คืนสต็อก - แก้ไขออเดอร์ ${existingOrder.order_no}`,
            created_by: updated_by,
          },
        });
      }

      // ลบรายการสินค้าเดิม
      await tx.sales_order_items.deleteMany({
        where: { sales_order_id: parseInt(id) },
      });

      // เตรียมข้อมูลสำหรับอัพเดต
      const updateData = {
        customer_id,
        total_amount: total_amount.toFixed(2),
        notes,
        items: {
          create: newProductChecks.map((item) => ({
            product_id: item.product_id,
            quantity: item.new_quantity,
            unit_price: item.unit_price,
          })),
        },
      };

      // เพิ่ม status_id ถ้ามีการส่งมา
      if (status_id) {
        updateData.status_id = status_id;
      }

      // อัพเดตข้อมูลออเดอร์
      const updatedOrder = await tx.sales_orders.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          customer: {
            select: {
              customer_code: true,
              name: true,
            },
          },
          status: {
            select: {
              id: true,
              status_name: true,
              description: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  product_name: true,
                  sku: true,
                },
              },
            },
          },
        },
      });

      // หักสต็อกสินค้าใหม่
      for (const item of newProductChecks) {
        await tx.product_warehouses.updateMany({
          where: {
            product_id: item.product_id,
            warehouse_id: warehouse_id,
          },
          data: {
            quantity: {
              decrement: item.new_quantity,
            },
          },
        });

        // บันทึก inventory movement การหักสต็อก
        await tx.inventory_movements.create({
          data: {
            product_id: item.product_id,
            source_warehouse_id: warehouse_id,
            destination_warehouse_id: null,
            quantity_moved: item.new_quantity,
            movement_type: "OUT",
            movement_date: new Date(),
            notes: `ขายสินค้า (แก้ไข) - ออเดอร์ ${existingOrder.order_no}`,
            created_by: updated_by,
          },
        });
      }

      // อัพเดต updated_at ด้วย raw SQL
      await tx.$executeRaw`UPDATE sales_orders SET updated_at = NOW() WHERE id = ${parseInt(
        id
      )}`;

      return updatedOrder;
    });

    res.json({
      message: "แก้ไขคำสั่งซื้อสำเร็จ",
      data: result,
    });
  } catch (err) {
    if (
      err instanceof NotFoundException ||
      err instanceof BadRequestException ||
      err instanceof ConflictException
    ) {
      throw err;
    }

    console.error("UpdateSalesOrder error:", err);
    throw new ConflictException(
      "ไม่สามารถแก้ไขคำสั่งซื้อได้",
      ErrorCodes.SALES_ORDER_UPDATE_FAILED
    );
  }
};

const UpdateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status_id } = req.body;
    const updated_by = req.user.id;

    // Validation
    if (!id || isNaN(parseInt(id))) {
      throw new BadRequestException(
        "กรุณาระบุ ID ที่ถูกต้อง",
        ErrorCodes.BAD_REQUEST
      );
    }

    if (!status_id) {
      throw new BadRequestException("กรุณาระบุสถานะ", ErrorCodes.BAD_REQUEST);
    }

    // ตรวจสอบว่าออเดอร์มีอยู่จริง
    const existingOrder = await prisma.sales_orders.findUnique({
      where: { id: parseInt(id) },
      include: {
        status: true,
        customer: {
          select: {
            customer_code: true,
            name: true,
          },
        },
      },
    });

    if (!existingOrder) {
      throw new NotFoundException(
        "ไม่พบคำสั่งซื้อที่ต้องการอัพเดต",
        ErrorCodes.SALES_ORDER_NOT_FOUND
      );
    }

    // ตรวจสอบสถานะใหม่
    const newStatus = await prisma.order_statuses.findUnique({
      where: { id: status_id },
    });

    if (!newStatus) {
      throw new NotFoundException(
        "ไม่พบสถานะที่เลือก",
        ErrorCodes.STATUS_NOT_FOUND
      );
    }

    // ตรวจสอบกฎการเปลี่ยนสถานะ
    if (
      existingOrder.status.status_name === "จัดส่งสำเร็จ" &&
      newStatus.status_name !== "จัดส่งสำเร็จ"
    ) {
      throw new BadRequestException(
        "ไม่สามารถเปลี่ยนสถานะจาก 'จัดส่งสำเร็จ' เป็นสถานะอื่น",
        ErrorCodes.INVALID_STATUS_CHANGE
      );
    }

    // ถ้าสถานะเดิมกับใหม่เหมือนกัน
    if (existingOrder.status.id === status_id) {
      return res.json({
        message: "สถานะเหมือนเดิม ไม่มีการเปลี่ยนแปลง",
        data: {
          id: existingOrder.id,
          order_no: existingOrder.order_no,
          status: existingOrder.status,
        },
      });
    }

    // อัพเดตสถานะ
    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.sales_orders.update({
        where: { id: parseInt(id) },
        data: { status_id },
        include: {
          status: {
            select: {
              id: true,
              status_name: true,
              description: true,
            },
          },
          customer: {
            select: {
              customer_code: true,
              name: true,
            },
          },
        },
      });

      // อัพเดต updated_at ด้วย raw SQL
      await tx.$executeRaw`UPDATE sales_orders SET updated_at = NOW() WHERE id = ${parseInt(
        id
      )}`;

      return updatedOrder;
    });

    res.json({
      message: `เปลี่ยนสถานะจาก '${existingOrder.status.status_name}' เป็น '${newStatus.status_name}' สำเร็จ`,
      data: {
        id: result.id,
        order_no: result.order_no,
        customer: result.customer,
        old_status: existingOrder.status.status_name,
        new_status: result.status,
      },
    });
  } catch (err) {
    if (
      err instanceof NotFoundException ||
      err instanceof BadRequestException
    ) {
      throw err;
    }

    console.error("UpdateOrderStatus error:", err);
    throw new ConflictException(
      "ไม่สามารถอัพเดตสถานะได้",
      ErrorCodes.STATUS_UPDATE_FAILED
    );
  }
};

const DeleteSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // ตรวจสอบว่าออเดอร์มีอยู่จริง
    const existingOrder = await prisma.sales_orders.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: true,
        status: true,
      },
    });

    if (!existingOrder) {
      throw new NotFoundException(
        "ไม่พบคำสั่งซื้อที่ต้องการลบ",
        ErrorCodes.SALES_ORDER_NOT_FOUND
      );
    }

    // ตรวจสอบสถานะ - ไม่อนุญาตให้ลบถ้าจัดส่งแล้ว
    if (existingOrder.status.status_name === "จัดส่งสำเร็จ") {
      throw new BadRequestException(
        "ไม่สามารถลบคำสั่งซื้อที่จัดส่งสำเร็จแล้ว",
        ErrorCodes.ORDER_CANNOT_DELETE
      );
    }

    // ลบออเดอร์และคืนสต็อกในครั้งเดียว (Transaction)
    await prisma.$transaction(async (tx) => {
      // คืนสต็อกสินค้าในคลัง
      for (const item of existingOrder.items) {
        await tx.product_warehouses.updateMany({
          where: {
            product_id: item.product_id,
            // หาคลังจาก inventory movement
          },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });

        // บันทึก inventory movement การคืนสต็อก
        await tx.inventory_movements.create({
          data: {
            product_id: item.product_id,
            source_warehouse_id: null,
            destination_warehouse_id: 1, // ต้องหาจาก movement เดิม
            quantity_moved: item.quantity,
            movement_type: "IN",
            movement_date: new Date(),
            notes: `คืนสต็อก - ยกเลิกออเดอร์ ${existingOrder.order_no}`,
            created_by: req.user.id,
          },
        });
      }

      // ลบ sales_order_items ก่อน
      await tx.sales_order_items.deleteMany({
        where: { sales_order_id: parseInt(id) },
      });

      // ลบ sales_orders
      await tx.sales_orders.delete({
        where: { id: parseInt(id) },
      });
    });

    res.json({
      message: "ลบคำสั่งซื้อสำเร็จ",
      order_id: id,
    });
  } catch (err) {
    if (
      err instanceof NotFoundException ||
      err instanceof BadRequestException
    ) {
      throw err;
    }

    console.error("DeleteSalesOrder error:", err);
    throw new ConflictException(
      "ไม่สามารถลบคำสั่งซื้อได้",
      ErrorCodes.SALES_ORDER_DELETE_FAILED
    );
  }
};

const GetSalesOrdersById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      throw new BadRequestException(
        "กรุณาระบุ ID ที่ถูกต้อง",
        ErrorCodes.BAD_REQUEST
      );
    }

    const salesOrder = await prisma.sales_orders.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        order_no: true,
        order_date: true,
        total_amount: true,
        notes: true,
        created_at: true,
        updated_at: true,
        // แสดงข้อมูลลูกค้าแทน customer_id
        customer: {
          select: {
            id: true,
            customer_code: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        // แสดงข้อมูล status แทน status_id
        status: {
          select: {
            id: true,
            status_name: true,
            description: true,
          },
        },
        // แสดงข้อมูลผู้สร้างแทน created_by
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            prefix: {
              select: {
                name: true,
              },
            },
          },
        },
        // แสดงรายการสินค้าในใบสั่งซื้อ
        items: {
          select: {
            id: true,
            quantity: true,
            unit_price: true,
            product: {
              select: {
                id: true,
                product_name: true,
                sku: true,
                price: true,
                image_url: true,
                category: {
                  select: {
                    category_name: true,
                  },
                },
                unit: {
                  select: {
                    unit_name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!salesOrder) {
      throw new NotFoundException(
        "ไม่พบคำสั่งซื้อที่ต้องการ",
        ErrorCodes.SALES_ORDER_NOT_FOUND
      );
    }

    res.json({
      message: "ดึงข้อมูลคำสั่งซื้อสำเร็จ",
      data: salesOrder,
    });
  } catch (err) {
    if (
      err instanceof NotFoundException ||
      err instanceof BadRequestException
    ) {
      throw err;
    }

    throw new ConflictException(
      "ไม่สามารถดึงข้อมูลคำสั่งซื้อได้",
      ErrorCodes.SALES_ORDER_FETCH_FAILED
    );
  }
};

module.exports = {
  GetSalesOrders,
  CreateSalesOrder,
  UpdateSalesOrder,
  UpdateOrderStatus,
  DeleteSalesOrder,
  GetSalesOrdersById,
};
