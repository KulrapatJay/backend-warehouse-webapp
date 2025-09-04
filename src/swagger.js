const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Warehouse API',
      version: '1.0.0',
      description: 'API Documentation for Warehouse Management System',
    },
    servers: [{ url: 'http://localhost:8000' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'nat' },
            email: { type: 'string', example: 'nat@example.com' },
            role_id: { type: 'integer', example: 2 },
          },
        },
        RegisterPayload: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: { type: 'string' },
            email: { type: 'string' },
            password: { type: 'string' },
          },
        },
        LoginCredentials: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string' },
            password: { type: 'string' },
          },
        },
        UpdateUser: {
          type: 'object',
          properties: {
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            username: { type: 'string' },
            password: { type: 'string' },
            role_id: { type: 'integer' },
          },
        },
      },
    },
  },
  apis: [
    path.join(__dirname, 'routes/*.js'),
    path.join(__dirname, 'routes/**/*.js'),
  ],
};

const swaggerSpecs = swaggerJsdoc(options);

// (debug) ดูจำนวน path
console.log('[swagger] paths found =', Object.keys(swaggerSpecs.paths || {}).length);

module.exports = { swaggerUi, swaggerSpecs };
