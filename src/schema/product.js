const { z } = require('zod');

const AddProductSchema = z.object({
  product_name: z.string({
    required_error: 'กรุณากรอกชื่อสินค้า'
  }).min(1, 'กรุณากรอกชื่อสินค้า'),

  category_id: z.number({
    required_error: 'กรุณาระบุหมวดหมู่'
  }),
  sku: z.string({
    required_error: 'กรุณากรอก SKU'
  }).min(1, 'กรุณากรอก SKU'),
  quantity: z.number({
    required_error: 'กรุณากรอกจำนวนสินค้า'
  }).min(0, 'จำนวนสินค้าต้องไม่ติดลบ'),
});

module.exports = {
  AddProductSchema,
};