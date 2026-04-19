require("./src/config/env");

const express = require("express");

const env = require("./src/config/env");
const routes = require("./src/routes");
const notFoundMiddleware = require("./src/middlewares/notFoundMiddleware");
const errorMiddleware = require("./src/middlewares/errorMiddleware");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(env.apiPrefix, routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
