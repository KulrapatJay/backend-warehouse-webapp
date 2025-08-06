const { HttpException } = require('../exception/root');
const { ZodError } = require('zod');
const UnprocessableEntity = require('../exception/vaildation');

const errorMiddleware = (error, req, res, next) => {

    if (error instanceof ZodError) {
        const zodError = new UnprocessableEntity(error.issues);
        return res.status(zodError.statusCode).json({
            message: zodError.message,
            errorCode: zodError.errorCode,
            errors: zodError.errors,
        });
    }

    if (error instanceof HttpException) {
        return res.status(error.statusCode).json({
            message: error.message,
            errorCode: error.errorCode,
            errors: error.errors,
        });
    }

    res.status(500).json({
        message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์',
        errorCode: 'INTERNAL_SERVER_ERROR',
        errors: null,
    });
};

module.exports = errorMiddleware;