const express = require('express');
const authRouter = require('./auth');
const userManagementRouter = require('./user-management');
const customersRouter = require('./customers');
const productManagementRouter = require('./product-management');
const productsWarehouseRouter = require('./product-warehouse');
const salesOrdersRouter = require('./sales-orders');

const rootRouter = express.Router();

rootRouter.use('/auth', authRouter);
rootRouter.use('/user-management', userManagementRouter);
rootRouter.use('/customers', customersRouter);
rootRouter.use('/products', productManagementRouter);
rootRouter.use('/products-warehouse', productsWarehouseRouter);
rootRouter.use('/sales-orders', salesOrdersRouter);

module.exports = rootRouter;