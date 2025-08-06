const { z } = require('zod');

const RegisterSchema = z.object({
    employee_id: z.string({
        required_error: 'กรุณากรอกรหัสพนักงาน'
    }).min(3, 'กรุณากรอกรหัสพนักงาน'),

    prefix_id: z.number({
        required_error: 'กรุณาระบุคำนำหน้าชื่อ'
    }),

    first_name: z.string({
        required_error: 'กรุณากรอกชื่อจริง'
    }).min(1, 'กรุณากรอกชื่อจริง'),

    last_name: z.string({
        required_error: 'กรุณากรอกนามสกุล'
    }).min(1, 'กรุณากรอกนามสกุล'),

    username: z.string({
        required_error: 'กรุณากรอก Username'
    }).min(3, 'Username ต้องมีอย่างน้อย 3 ตัวอักษร'),

    password: z.string({
        required_error: 'กรุณากรอกรหัสผ่าน'
    }).regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/,
        'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร และประกอบด้วยตัวพิมพ์เล็ก, ตัวพิมพ์ใหญ่, ตัวเลข, และอักขระพิเศษ'
    ),

    role_id: z.number({
        required_error: 'กรุณาระบุตำแหน่ง'
    })
});

module.exports = {
    RegisterSchema
};