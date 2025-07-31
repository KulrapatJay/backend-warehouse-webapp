const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Warehouse API',
      version: '1.0.0',
      description: 'API Documentation for Warehouse Management System',
    },
    servers: [
      {
        url: 'http://localhost:8000', 
      },
    ],
  },
  apis: ['./src/routes/*.js'], 
};

const swaggerSpecs = swaggerJsdoc(options);

module.exports = { swaggerUi, swaggerSpecs };