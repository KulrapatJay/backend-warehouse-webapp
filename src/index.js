require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { swaggerUi, swaggerSpecs } = require("./swagger");
const cookieParser = require("cookie-parser");
const rootRouter = require("./routes");
const errorMiddleware = require("./middlewares/error");
const { PrismaClient } = require('@prisma/client');


const app = express();

const PORT = process.env.PORT

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use("/api", rootRouter);

const prismaClient = new PrismaClient({
  log:['query']
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use(errorMiddleware)

app.listen(PORT, () => {
  console.log("Server is running");
});

