const { HttpException } = require('./root');

class NotFoundException extends HttpException{
    constructor(message, errorCode){
        super(message, errorCode, 404, null)
    }

}

module.exports = NotFoundException;