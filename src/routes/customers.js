const express = require('express');
const rateLimit = require('express-rate-limit');
const errorHandler = require('../error-handler');
const authMiddleware = require('../middlewares/auth');
const {adminMiddleware} = require('../middlewares/role');
const { GetCustomers, GetCustomersById, CreateCustomer, UpdateCustomer, DeleteCustomer } = require('../modules/controllers/admin/customers');

const apiLimit = rateLimit({
    windowMs: 1000 * 60 * 3, 
    max: 100,
    message: 'You have exceeded the 10 requests in 3 minutes limit!',
});

const customersRouter = express.Router();

customersRouter.get('/', apiLimit, [authMiddleware] ,errorHandler(GetCustomers));
customersRouter.post('/', apiLimit, [authMiddleware, adminMiddleware] ,errorHandler(CreateCustomer));
customersRouter.put('/:id', apiLimit, [authMiddleware, adminMiddleware] ,errorHandler(UpdateCustomer));
customersRouter.get('/:id', apiLimit, [authMiddleware] ,errorHandler(GetCustomersById));
customersRouter.delete('/:id', apiLimit, [authMiddleware, adminMiddleware] ,errorHandler(DeleteCustomer));


module.exports = customersRouter;