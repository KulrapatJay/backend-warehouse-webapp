const { HttpException, ErrorCodes } = require('./root');

class UnprocessableEntity extends HttpException {
    constructor(errors) {
        super('Unprocessable Entity', ErrorCodes.UNPROCESSABLE_ENTITY, 422, errors);
    }
}

module.exports = UnprocessableEntity;