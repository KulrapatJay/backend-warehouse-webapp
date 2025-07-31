require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const e = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;

const register = async (req, res) => {
    try {
        const { employee_id, prefix_id, first_name, last_name, username, password, role_id } = req.body;

        if (!username || !password || !first_name || !last_name || !employee_id || !role_id) {
            return res.status(400).json({
                success: false,
                message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน'
            });
        }

        const existingUser = await prisma.users.findFirst({
            where: {
                OR: [
                    { username: username },
                    { employee_id: employee_id }
                ]
            }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Username หรือรหัสพนักงานนี้มีผู้ใช้งานแล้ว'
            });
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

        return res.status(200).json({
            success: true,
            message: 'ลงทะเบียนสำเร็จ',
            data: {
                user: newUser
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการลงทะเบียน'
        });
    }
};

const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'กรุณากรอกข้อมูลสำหรับเข้าสู่ระบบให้ครบถ้วน'
            });
        }

        const user = await prisma.users.findFirst({
            where: {
                OR: [
                    { username: identifier },
                    { employee_id: identifier }
                ]
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้งานนี้' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'รหัสผ่านไม่ถูกต้อง'
            });
        }

        await prisma.$executeRaw`UPDATE users SET last_login = NOW() WHERE id = ${user.id}`;

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

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
        });
    }
};




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
    testApi
};