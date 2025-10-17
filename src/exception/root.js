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
    INVALID_INPUT_FORMAT: 1004,
    INVALID_PASSWORD_FORMAT: 1005,
    ROLE_NOT_FOUND: 1006,
    PREFIX_NOT_FOUND: 1007,
    PRODUCT_NOT_FOUND: 1008,
    PRODUCT_ALREADY_EXISTS: 1009,
    WAREHOUSE_NOT_FOUND: 1010,
    WAREHOUSE_ALREADY_EXISTS: 1011,
    CATEGORY_NOT_FOUND: 1012,
    CATEGORY_ALREADY_EXISTS: 1013,
    STOCK_NOT_FOUND: 1014,
    CATEGORY_NAME_REQUIRED: 1016,
    UNIT_NAME_REQUIRED: 1017,
    STOCK_ALREADY_EXISTS: 1015,
    UNIT_ALREADY_EXISTS: 1018,
    UNIT_NOT_FOUND: 1019,
    WAREHOUSE_NAME_REQUIRED: 1020,
    UNPROCESSABLE_ENTITY: 2001,
    INTERNAL_EXCEPTION: 3001,
    UNAUTHORIZED: 4001
});

module.exports = {
    HttpException,
    ErrorCodes
};