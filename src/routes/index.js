const express = require('express');
const authRouter = require('./auth');
const userManagementRouter = require('./user-management');

const rootRouter = express.Router();

rootRouter.use('/auth', authRouter);
rootRouter.use('/user-management', userManagementRouter);

module.exports = rootRouter;