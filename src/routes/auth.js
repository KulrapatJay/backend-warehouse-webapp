const express = require('express');
const rateLimit = require('express-rate-limit');
const errorHandler = require('../error-handler');
const { register,testApi, login, me } = require('../modules/auth');
const authMiddleware = require('../middlewares/auth');


const apiLimit = rateLimit({
    windowMs: 1000 * 60 * 3, // 3 minutes
    max: 100,
    message: 'You have exceeded the 10 requests in 3 minutes limit!',
});

const authRouter = express.Router();

authRouter.get('/test', apiLimit, testApi);
authRouter.post('/register', apiLimit, errorHandler(register));
authRouter.post('/login', apiLimit, errorHandler(login));
authRouter.get('/me', apiLimit, [authMiddleware] ,errorHandler(me));


module.exports = authRouter;