const { HttpException } = require('./root');

class UnauthorizedException extends HttpException {
  // message, errorCode, errors
  constructor(message, errors, errorCode) {
    super(message, errorCode, 401, errors);
  }
}

module.exports = UnauthorizedException;