const { HttpException } = require('./root');

class UnauthorizedException extends HttpException {
  constructor(message, errorCode, errors) {
    super(message, errorCode, 401, errors);
  }
}

module.exports = UnauthorizedException;