const express = require('express');
const rateLimit = require('express-rate-limit');
const errorHandler = require('../error-handler');
const authMiddleware = require('../middlewares/auth');
const { GetProducts, CreateProduct, GetProductById, DeleteProduct, UpdateProduct } = require('../modules/controllers/menager/product-management');
const { GetCategories, CreateCategory, UpdateCategory, DeleteCategory ,GetCategoriesById } = require('../modules/controllers/menager/product-catagories');
const { GetUnitName, CreateUnitName, UpdateUnitName, DeleteUnitName, GetUnitsById } = require('../modules/controllers/menager/units_of_measure');
const { GetWarehouseName, CreateWarehouseName, UpdateWarehouse, DeleteWarehouse, GetWarehouseById } = require('../modules/controllers/menager/warehouse');
const {menagerMiddleware} = require('../middlewares/role');
const upload  = require('../middlewares/upload');

const apiLimit = rateLimit({
    windowMs: 1000 * 60 * 3, 
    max: 100,
    message: 'You have exceeded the 10 requests in 3 minutes limit!',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const productManagementRouter = express.Router();
    
productManagementRouter.get('/', apiLimit, [authMiddleware] ,errorHandler(GetProducts));
productManagementRouter.post('/', apiLimit, [authMiddleware, menagerMiddleware], upload.single('image'), errorHandler(CreateProduct));
//ส่วน APT ของ categories
productManagementRouter.get('/categories', apiLimit, [authMiddleware] ,errorHandler(GetCategories));
productManagementRouter.post('/categories', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(CreateCategory));
productManagementRouter.get('/categories/:id', apiLimit, [authMiddleware] ,errorHandler(GetCategoriesById));
productManagementRouter.put('/categories/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(UpdateCategory));
productManagementRouter.delete('/categories/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(DeleteCategory));
//ส่วน APT ของหน่วยวัด
productManagementRouter.get('/units', apiLimit, [authMiddleware] ,errorHandler(GetUnitName));
productManagementRouter.post('/units', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(CreateUnitName));
productManagementRouter.get('/units/:id', apiLimit, [authMiddleware] ,errorHandler(GetUnitsById));
productManagementRouter.put('/units/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(UpdateUnitName));
productManagementRouter.delete('/units/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(DeleteUnitName));
//ส่วน APT ของคลังสินค้า
productManagementRouter.get('/warehouses', apiLimit, [authMiddleware] ,errorHandler(GetWarehouseName));
productManagementRouter.post('/warehouses', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(CreateWarehouseName));
productManagementRouter.get('/warehouses/:id', apiLimit, [authMiddleware] ,errorHandler(GetWarehouseById));
productManagementRouter.put('/warehouses/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(UpdateWarehouse));
productManagementRouter.delete('/warehouses/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(DeleteWarehouse)); 
productManagementRouter.put('/:id', apiLimit, [authMiddleware, menagerMiddleware] , upload.single('image') ,errorHandler(UpdateProduct));
productManagementRouter.get('/:id', apiLimit, [authMiddleware] ,errorHandler(GetProductById));
productManagementRouter.delete('/:id', apiLimit, [authMiddleware, menagerMiddleware] ,errorHandler(DeleteProduct));

module.exports = productManagementRouter;