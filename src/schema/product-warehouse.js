const { z } = require('zod');

const CreateProductWarehouseSchema = z.object({
  product_id: z.number().int().positive({
    message: "รหัสสินค้าต้องเป็นตัวเลขบวก"
  }),
  warehouse_id: z.number().int().positive({
    message: "รหัสคลังสินค้าต้องเป็นตัวเลขบวก"
  }),
  quantity: z.number().int().min(0, {
    message: "จำนวนสินค้าต้องเป็นตัวเลขที่ไม่ติดลบ"
  }),
  production_date: z.string().date().optional().or(z.null()),
  expiry_date: z.string().date().optional().or(z.null())
});

const UpdateProductWarehouseSchema = z.object({
  product_id: z.number().int().positive({
    message: "รหัสสินค้าต้องเป็นตัวเลขบวก"
  }).optional(),
  warehouse_id: z.number().int().positive({
    message: "รหัสคลังสินค้าต้องเป็นตัวเลขบวก"
  }).optional(),
  quantity: z.number().int().min(0, {
    message: "จำนวนสินค้าต้องเป็นตัวเลขที่ไม่ติดลบ"
  }).optional(),
  production_date: z.string().date().optional().or(z.null()),
  expiry_date: z.string().date().optional().or(z.null())
});

module.exports = {
  CreateProductWarehouseSchema,
  UpdateProductWarehouseSchema
};