const express = require('express');
const rateLimit = require('express-rate-limit');
const errorHandler = require('../error-handler');
const authMiddleware = require('../middlewares/auth');
const { GetUsers, UpdateUser, GetUserById, DeleteUser } = require('../modules/controllers/admin/user-management');
const {adminMiddleware} = require('../middlewares/role');


const apiLimit = rateLimit({
    windowMs: 1000 * 60 * 3, 
    max: 100,
    message: 'You have exceeded the 10 requests in 3 minutes limit!',
});

const userManagementRouter = express.Router();

/**
 * @swagger
 * /api/user-management:
 *   get:
 *     summary: ดึงข้อมูลผู้ใช้งานทั้งหมด
 *     description: API สำหรับดึงรายชื่อผู้ใช้งานทั้งหมดในระบบ (เฉพาะ Admin)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: รายชื่อผู้ใช้งานทั้งหมด
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       '401':
 *         description: Unauthorized - ไม่มี Token หรือ Token ไม่ถูกต้อง
 *       '403':
 *         description: Forbidden - ไม่มีสิทธิ์เข้าถึง
 */
userManagementRouter.get('/', apiLimit, [authMiddleware, adminMiddleware] ,errorHandler(GetUsers));

/**
 * @swagger
 * /api/user-management/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: integer
 *       description: ID ของผู้ใช้งาน
 *   get:
 *     summary: ดึงข้อมูลผู้ใช้งานตาม ID
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: ข้อมูลผู้ใช้งาน
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: User not found
 *   put:
 *     summary: อัปเดตข้อมูลผู้ใช้งาน
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUser'
 *     responses:
 *       '200':
 *         description: อัปเดตข้อมูลสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '400':
 *         description: Bad Request
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: User not found
 *   delete:
 *     summary: ลบผู้ใช้งาน
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: ลบผู้ใช้งานสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: User not found
 */
userManagementRouter.put('/:id', apiLimit, [authMiddleware, adminMiddleware] ,errorHandler(UpdateUser));
userManagementRouter.get('/:id', apiLimit, [authMiddleware, adminMiddleware] ,errorHandler(GetUserById));
userManagementRouter.delete('/:id', apiLimit, [authMiddleware, adminMiddleware] ,errorHandler(DeleteUser));

module.exports = userManagementRouter;