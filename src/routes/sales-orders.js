const express = require('express');
const rateLimit = require('express-rate-limit');
const errorHandler = require('../error-handler');
const authMiddleware = require('../middlewares/auth');
const {staffOrManagerMiddleware} = require('../middlewares/role');
const { GetSalesOrders, CreateSalesOrder, UpdateSalesOrder, DeleteSalesOrder, GetSalesOrdersById, UpdateOrderStatus, GetStatus} = require('../modules/controllers/staff/sales-orders');

const apiLimit = rateLimit({
    windowMs: 1000 * 60 * 3, 
    max: 100,
    message: 'You have exceeded the 10 requests in 3 minutes limit!',
});

const salesOrdersRouter = express.Router();
salesOrdersRouter.use(express.json());

salesOrdersRouter.get('/', apiLimit, [authMiddleware] ,errorHandler(GetSalesOrders));
salesOrdersRouter.post('/', apiLimit, [authMiddleware, staffOrManagerMiddleware] ,errorHandler(CreateSalesOrder));
salesOrdersRouter.get('/status', apiLimit, [authMiddleware], errorHandler(GetStatus));
salesOrdersRouter.get('/:id', apiLimit, [authMiddleware] ,errorHandler(GetSalesOrdersById));
salesOrdersRouter.put('/:id', apiLimit, [authMiddleware, staffOrManagerMiddleware] ,errorHandler(UpdateSalesOrder));
salesOrdersRouter.put('/status/:id', apiLimit, [authMiddleware, staffOrManagerMiddleware], errorHandler(UpdateOrderStatus));
salesOrdersRouter.delete('/:id', apiLimit, [authMiddleware, staffOrManagerMiddleware] ,errorHandler(DeleteSalesOrder));

module.exports = salesOrdersRouter;