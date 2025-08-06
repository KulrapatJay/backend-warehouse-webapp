const { HttpException } = require('./root');

class ConflictException extends HttpException {
    constructor(message, errorCode) {
        super(message, errorCode, 409, null);
    }
}

module.exports = ConflictException;
