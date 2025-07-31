const express = require('express');
const rateLimit = require('express-rate-limit');
const { register,testApi, login } = require('../modules/auth');

const apiLimit = rateLimit({
    windowMs: 1000 * 60 * 3, // 3 minutes
    max: 100,
    message: 'You have exceeded the 100 requests in 3 minutes limit!',
});

const authRouter = express.Router();

authRouter.get('/test', apiLimit, testApi);
authRouter.post('/register', apiLimit, register);
authRouter.post('/login', apiLimit, login);

module.exports = authRouter;