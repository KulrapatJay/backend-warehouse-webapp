require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { swaggerUi, swaggerSpecs } = require("./swagger");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth");

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
app.use("/auth", authRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));



app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});

