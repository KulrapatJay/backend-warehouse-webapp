const express = require('express');
const authRouter = require('./auth');
const userManagementRouter = require('./user-management');
const productManagementRouter = require('./product-management');

const rootRouter = express.Router();

rootRouter.use('/auth', authRouter);
rootRouter.use('/user-management', userManagementRouter);
rootRouter.use('/products', productManagementRouter);

module.exports = rootRouter;