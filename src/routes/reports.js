const express = require('express');
const rateLimit = require('express-rate-limit');
const errorHandler = require('../error-handler');
const authMiddleware = require('../middlewares/auth');
const {adminMiddleware} = require('../middlewares/role');
const { getSalesOrders, getSalesOrderItems, getProducts, } = require('../modules/controllers/user/reports');

const apiLimit = rateLimit({
    windowMs: 1000 * 60 * 3, 
    max: 100,
    message: 'You have exceeded the 10 requests in 3 minutes limit!',
});

const reportsRouter = express.Router();

//ส่วน APT ของ sale_order
reportsRouter.get('/sales_order', apiLimit, [authMiddleware], errorHandler(getSalesOrders));
//ส่วน APT ของ sale_order_item
reportsRouter.get('/sales_order_item', apiLimit, [authMiddleware], errorHandler(getSalesOrderItems));
//ส่วน APT ของ products
reportsRouter.get('/products', apiLimit, [authMiddleware], errorHandler(getProducts));


module.exports = reportsRouter;