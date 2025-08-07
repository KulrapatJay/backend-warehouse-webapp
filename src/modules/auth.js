require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
const { ErrorCodes } = require('../exception/root');
const BadRequestException = require('../exception/bad-requests');
const ConflictException = require('../exception/conflict');
const NotFoundException = require('../exception/not-found');
const { RegisterSchema } = require('../schema/users');
const JWT_SECRET = process.env.JWT_SECRET;

const register = async (req, res, next) => {
    const { employee_id, prefix_id, first_name, last_name, username, password, role_id } = RegisterSchema.parse(req.body);

    const existingUser = await prisma.users.findFirst({
        where: {
            OR: [
                { username: username },
                { employee_id: employee_id }
            ]
        }
    });

    if (existingUser) {
        throw new ConflictException('Username หรือรหัสพนักงานนี้มีผู้ใช้งานแล้ว', ErrorCodes.USER_ALREADY_EXISTS);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.users.create({
        data: {
            employee_id,
            prefix_id,
            first_name,
            last_name,
            username,
            password: hashedPassword,
            role_id
        }
    });

    delete newUser.password;

    res.status(201).json({
        success: true,
        message: 'ลงทะเบียนสำเร็จ',
        data: {
            user: newUser
        }
    });
};


const login = async (req, res, next) => {
    const { identifier, password } = req.body;

    const user = await prisma.users.findFirst({
        where: {
            OR: [
                { username: identifier },
                { employee_id: identifier }
            ]
        }
    });

    if (!user) {
        throw new NotFoundException('ไม่พบผู้ใช้งานนี้', ErrorCodes.USER_NOT_FOUND);
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
        throw new BadRequestException('รหัสผ่านไม่ถูกต้อง', ErrorCodes.INCORRECT_PASSWORD);
    }

    await prisma.$executeRaw`UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = ${user.id}`;

    const token = jwt.sign(
        { id: user.id, username: user.username, role_id: user.role_id },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    delete user.password;

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000
    });

    return res.status(200).json({
        success: true,
        message: 'เข้าสู่ระบบสำเร็จ'
    });
};

const me = async (req, res) => {
    res.json(req.user)
}



const testApi = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: 'API ทำงานปกติ',
            timestamp: new Date().toISOString(),
            data: {
                server: 'Warehouse Management System Backend',
                version: '1.0.0',
                status: 'running'
            }
        });
    } catch (error) {
        console.error('Test API error:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการทดสอบ API'
        });
    }
};

module.exports = {
    register,
    login,
    testApi,
    me
};