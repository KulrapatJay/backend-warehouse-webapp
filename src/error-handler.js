const { ZodError } = require('zod');
const { HttpException, ErrorCodes } = require('./exception/root');
const BadRequestsException = require('./exception/bad-requests');
const UnprocessableEntity = require('./exception/vaildation');
const InternalException = require('./exception/internal-exception');

function errorHandler(method) {
    return async function (req, res, next) {
        try {
            await method(req, res, next);   
        } catch (error) {
            if (error instanceof HttpException) {
                return next(error);
            }
            if (error instanceof ZodError) {
                return next(new UnprocessableEntity('Unprocessable entity.', ErrorCodes.UNPROCESSABLE_ENTITY, error.issues)
                );
            }
            return next(new InternalException('Internal server error.', ErrorCodes.INTERNAL_EXCEPTION));
        }
    };
}

module.exports = errorHandler;