const { HttpException, ErrorCodes } = require('./root');

class UnprocessableEntity extends HttpException {
    constructor(message, errorCode, errors) {
        super(message, errorCode, 422, errors);
    }
}

module.exports = UnprocessableEntity;