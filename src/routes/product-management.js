const express = require('express');
const rateLimit = require('express-rate-limit');
const errorHandler = require('../error-handler');
const authMiddleware = require('../middlewares/auth');
const { GetProducts, CreateProduct } = require('../modules/controllers/menager/product-management');
const {menagerMiddleware} = require('../middlewares/role');

const apiLimit = rateLimit({
    windowMs: 1000 * 60 * 3, 
    max: 100,
    message: 'You have exceeded the 10 requests in 3 minutes limit!',
});

const productManagementRouter = express.Router();
    
productManagementRouter.get('/', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(GetProducts));
productManagementRouter.post('/', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(CreateProduct));
// productManagementRouter.put('/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(UpdateUser));
// productManagementRouter.get('/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(GetUserById));
// productManagementRouter.delete('/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(DeleteUser));

module.exports = productManagementRouter;