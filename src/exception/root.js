// message, status code, error code, error

class HttpException extends Error {
    constructor(message, errorCode, statusCode, error) {
        super(message); 
        this.message = String(message);
        this.errorCode = errorCode;
        this.statusCode = Number(statusCode);
        this.errors = error;
    }
}

const ErrorCodes = Object.freeze({
    PLEASE_FILL_IN_ALL_REQUIRED_INFORMATION: 1000,
    USER_NOT_FOUND: 1001,
    USER_ALREADY_EXISTS: 1002,
    INCORRECT_PASSWORD: 1003,
    INVALID_PASSWORD_FORMAT: 1004,
    ROLE_NOT_FOUND: 1005,
    PREFIX_NOT_FOUND: 1006,
    PRODUCT_NOT_FOUND: 1007,
    PRODUCT_ALREADY_EXISTS: 1008,
    WAREHOUSE_NOT_FOUND: 1009,
    WAREHOUSE_ALREADY_EXISTS: 1010,
    CATEGORY_NOT_FOUND: 1011,
    CATEGORY_ALREADY_EXISTS: 1012,
    STOCK_NOT_FOUND: 1013,
    STOCK_ALREADY_EXISTS: 1014,
    UNPROCESSABLE_ENTITY: 2001,
    INTERNAL_EXCEPTION: 3001,
    UNAUTHORIZED: 4001
});

module.exports = {
    HttpException,
    ErrorCodes
};