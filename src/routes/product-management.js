const express = require('express');
const rateLimit = require('express-rate-limit');
const errorHandler = require('../error-handler');
const authMiddleware = require('../middlewares/auth');
const { GetProducts, CreateProduct } = require('../modules/controllers/menager/product-management');
const { GetCategories, CreateCategory, UpdateCategory, DeleteCategory ,GetCategoriesById } = require('../modules/controllers/menager/product-catagories');
const { GetUnitName, CreateUnitName, UpdateUnitName, DeleteUnitName, GetUnitsById } = require('../modules/controllers/menager/units_of_measure');
const { GetWarehouseName, CreateWarehouseName, UpdateWarehouse, DeleteWarehouse, GetWarehouseById } = require('../modules/controllers/menager/warehouse');
const {menagerMiddleware} = require('../middlewares/role');

const apiLimit = rateLimit({
    windowMs: 1000 * 60 * 3, 
    max: 100,
    message: 'You have exceeded the 10 requests in 3 minutes limit!',
});

const productManagementRouter = express.Router();
    
productManagementRouter.get('/', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(GetProducts));
productManagementRouter.post('/', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(CreateProduct));
productManagementRouter.get('/categories', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(GetCategories));
productManagementRouter.post('/categories', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(CreateCategory));
productManagementRouter.get('/categories/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(GetCategoriesById));
productManagementRouter.put('/categories/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(UpdateCategory));
productManagementRouter.delete('/categories/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(DeleteCategory));
productManagementRouter.get('/units', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(GetUnitName));
productManagementRouter.post('/units', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(CreateUnitName));
productManagementRouter.get('/units/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(GetUnitsById));
productManagementRouter.put('/units/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(UpdateUnitName));
productManagementRouter.delete('/units/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(DeleteUnitName));
productManagementRouter.get('/warehouses', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(GetWarehouseName));
productManagementRouter.post('/warehouses', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(CreateWarehouseName));
productManagementRouter.get('/warehouses/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(GetWarehouseById));
productManagementRouter.put('/warehouses/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(UpdateWarehouse));
productManagementRouter.delete('/warehouses/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(DeleteWarehouse));
// productManagementRouter.get('/role/:id', apiLimit
// productManagementRouter.put('/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(UpdateUser));
// productManagementRouter.get('/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(GetUserById));
// productManagementRouter.delete('/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(DeleteUser));

module.exports = productManagementRouter;