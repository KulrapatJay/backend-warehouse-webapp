const express = require('express');
const rateLimit = require('express-rate-limit');
const errorHandler = require('../error-handler');
const { register,testApi, login, me } = require('../modules/auth');
const authMiddleware = require('../middlewares/auth');

const apiLimit = rateLimit({
    windowMs: 1000 * 60 * 3, // 3 minutes
    max: 100,
    message: 'You have exceeded the 10 requests in 3 minutes limit!',
});

const authRouter = express.Router();

authRouter.get('/test', apiLimit, testApi);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: สมัครสมาชิกใหม่
 *     description: API สำหรับลงทะเบียนผู้ใช้งานใหม่ในระบบ
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterPayload'
 *     responses:
 *       '201':
 *         description: สมัครสมาชิกสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '400':
 *         description: ข้อมูลไม่ครบถ้วน หรือ Username ซ้ำ
 */
authRouter.post('/register', apiLimit, errorHandler(register));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: เข้าสู่ระบบ
 *     description: API สำหรับให้ผู้ใช้งานเข้าสู่ระบบเพื่อรับ Access Token (JWT)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginCredentials'
 *     responses:
 *       '200':
 *         description: เข้าสู่ระบบสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       '401':
 *         description: Unauthorized - ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง
 */
authRouter.post('/login', apiLimit, errorHandler(login));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: ดึงข้อมูลผู้ใช้งานปัจจุบัน
 *     description: ใช้ Bearer Token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: ข้อมูลโปรไฟล์
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '401':
 *         description: Unauthorized - ไม่มี Token หรือ Token ไม่ถูกต้อง
 */
authRouter.get('/me', apiLimit, [authMiddleware] ,errorHandler(me));


module.exports = authRouter;