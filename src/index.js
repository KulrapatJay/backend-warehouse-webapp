require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { swaggerUi, swaggerSpecs } = require('./swagger');
const cookieParser = require("cookie-parser");
const rootRouter = require("./routes");
const errorMiddleware = require("./middlewares/error");
const { PrismaClient } = require('@prisma/client');


const app = express();

const PORT = process.env.PORT

app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());


const prismaClient = new PrismaClient({
  log:['query']
})

app.get('/api-docs.json', (req, res) => {
  res.status(200).json(swaggerSpecs);
});
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: { url: '/api-docs.json' },
    customSiteTitle: 'Warehouse API Docs'
  })
);
app.use("/api", rootRouter);
app.use(errorMiddleware)

app.listen(PORT, () => {
  console.log("Server is running");
});

