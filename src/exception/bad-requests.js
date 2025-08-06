const { HttpException, ErrorCodes } = require('./root');

class BadRequestException extends HttpException {
    constructor(message, errorCode) {
        super(message, errorCode, 400, null);
    }
}

module.exports = BadRequestException;