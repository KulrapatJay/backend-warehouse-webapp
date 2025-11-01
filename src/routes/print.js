const express = require('express');
const rateLimit = require('express-rate-limit');
const errorHandler = require('../error-handler');
const authMiddleware = require('../middlewares/auth');
const {staffOrManagerMiddleware} = require('../middlewares/role');
const { GetSalesOrderForPrint, GetCustomReceiptData } = require('../modules/controllers/staff/print');

const apiLimit = rateLimit({
    windowMs: 1000 * 60 * 3, 
    max: 100,
    message: 'You have exceeded the 10 requests in 3 minutes limit!',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const printRouter = express.Router();

// printRouter.post('/initialize', apiLimit, [authMiddleware, staffOrManagerMiddleware], errorHandler(InitializePrinter));
// // Print sales order by ID
// printRouter.post('/sales-order/:orderId', apiLimit, [authMiddleware, staffOrManagerMiddleware], errorHandler(PrintSalesOrder));
// // Print custom receipt
// printRouter.post('/receipt', apiLimit, [authMiddleware, staffOrManagerMiddleware], errorHandler(PrintCustomReceipt));
// // Test print
// printRouter.post('/test', apiLimit, [authMiddleware, staffOrManagerMiddleware], errorHandler(TestPrint));

printRouter.get('/sales-order/:orderId',apiLimit, [authMiddleware, staffOrManagerMiddleware], GetSalesOrderForPrint);


printRouter.post('/custom-receipt',apiLimit, [authMiddleware, staffOrManagerMiddleware], GetCustomReceiptData);



module.exports = printRouter;