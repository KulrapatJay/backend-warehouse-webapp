const express = require('express');
const rateLimit = require('express-rate-limit');
const errorHandler = require('../error-handler');
const authMiddleware = require('../middlewares/auth');
const { GetUsers } = require('../modules/controllers/admin/user-management');
const {adminMiddleware} = require('../middlewares/role');


const apiLimit = rateLimit({
    windowMs: 1000 * 60 * 3, 
    max: 100,
    message: 'You have exceeded the 10 requests in 3 minutes limit!',
});

const userManagementRouter = express.Router();

userManagementRouter.get('/', apiLimit, [authMiddleware, adminMiddleware] ,errorHandler(GetUsers));


module.exports = userManagementRouter;