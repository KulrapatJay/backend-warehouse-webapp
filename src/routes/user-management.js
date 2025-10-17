const express = require('express');
const rateLimit = require('express-rate-limit');
const errorHandler = require('../error-handler');
const authMiddleware = require('../middlewares/auth');
const { GetUsers, UpdateUser, GetUserById, DeleteUser } = require('../modules/controllers/admin/user-management');
const { GetRoles, GetRolesById } = require('../modules/controllers/admin/roles');
const { GetPrefixes, GetPrefixesById } = require('../modules/controllers/admin/prefixes');
const {adminMiddleware} = require('../middlewares/role');


const apiLimit = rateLimit({
    windowMs: 1000 * 60 * 3, 
    max: 100,
    message: 'You have exceeded the 10 requests in 3 minutes limit!',
});

const userManagementRouter = express.Router();

userManagementRouter.get('/', apiLimit, [authMiddleware, adminMiddleware] ,errorHandler(GetUsers));
userManagementRouter.get('/roles', apiLimit, [authMiddleware, adminMiddleware] ,errorHandler(GetRoles));
userManagementRouter.get('/prefixes', apiLimit, [authMiddleware, adminMiddleware] ,errorHandler(GetPrefixes));
userManagementRouter.put('/:id', apiLimit, [authMiddleware, adminMiddleware] ,errorHandler(UpdateUser));
userManagementRouter.get('/:id', apiLimit, [authMiddleware, adminMiddleware] ,errorHandler(GetUserById));
userManagementRouter.delete('/:id', apiLimit, [authMiddleware, adminMiddleware] ,errorHandler(DeleteUser));
userManagementRouter.get('/prefixe/:id', apiLimit, [authMiddleware, adminMiddleware] ,errorHandler(GetPrefixesById));
userManagementRouter.get('/role/:id', apiLimit, [authMiddleware, adminMiddleware] ,errorHandler(GetRolesById));



module.exports = userManagementRouter;