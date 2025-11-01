const express = require('express');
const rateLimit = require('express-rate-limit');
const errorHandler = require('../error-handler');
const authMiddleware = require('../middlewares/auth');
const {staffOrManagerMiddleware} = require('../middlewares/role');
const { GetProductWarehouses, GetProductWarehouseById, CreateProductWarehouse, UpdateProductWarehouse, DeleteProductWarehouse} = require('../modules/controllers/staff/product-warehouse');


const apiLimit = rateLimit({
    windowMs: 1000 * 60 * 3, 
    max: 100,
    message: 'You have exceeded the 10 requests in 3 minutes limit!',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const productsWarehouseRouter = express.Router();

productsWarehouseRouter.get('/', apiLimit, [authMiddleware] ,errorHandler(GetProductWarehouses));
productsWarehouseRouter.post('/', apiLimit, [authMiddleware, staffOrManagerMiddleware] ,errorHandler(CreateProductWarehouse));
productsWarehouseRouter.put('/:id', apiLimit, [authMiddleware, staffOrManagerMiddleware] ,errorHandler(UpdateProductWarehouse));
productsWarehouseRouter.get('/:id', apiLimit, [authMiddleware] ,errorHandler(GetProductWarehouseById));
productsWarehouseRouter.delete('/:id', apiLimit, [authMiddleware, staffOrManagerMiddleware] ,errorHandler(DeleteProductWarehouse));

module.exports = productsWarehouseRouter;