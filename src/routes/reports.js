const express = require('express');
const rateLimit = require('express-rate-limit');
const errorHandler = require('../error-handler');
const authMiddleware = require('../middlewares/auth');
const {adminMiddleware} = require('../middlewares/role');
const {GetReports} = require('../modules/controllers/user/reports');

const apiLimit = rateLimit({
    windowMs: 1000 * 60 * 3, 
    max: 100,
    message: 'You have exceeded the 10 requests in 3 minutes limit!',
});

const reportsRouter = express.Router();

reportsRouter.get('/', apiLimit, [authMiddleware], errorHandler(GetReports));



module.exports = reportsRouter;