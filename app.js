"use strict";

const express = require("express");
const app = express();

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const useragent = require("express-useragent");
const requestIp = require("request-ip");

// Подключение к базе
const mongoose = require("./libs/mongoose");

// Работа с сессиями
const sessions = require("./libs/sessions");

// Разрешение кросдоменных запросов
const cors = require("cors");
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

// Отдаем статику

app.use(express.static("public"));

// Авторизация через PassportJS
const passport = require("passport");
const Session = require("./models/session-model");
const { addUser } = require("./models/user-model");

const urlencodedParser = bodyParser.urlencoded({
  extended: true,
  limit: "50mb",
  parameterLimit: "50000",
});

app.use(bodyParser.json({ limit: "50mb" }));
app.use(cookieParser("loremIpsum"));

const PORT = process.env.PORT || 80;

app.use(passport.initialize());
require("./libs/passport")(passport);

//Определение User-Agent
app.use(useragent.express());

//Определение IP
app.use(requestIp.mw());

// Отладка в консоли
app.use((req, res, next) => {
  console.info([req.method, req.url].join(" "));
  next();
});

// Роутер
app.use("/api/1.0/auth", require("./routes/auth"));
app.use(sessions);

app.use("/api/1.0/statistic", require("./routes/statistic"));
app.use("/api/1.0/category", require("./routes/category"));
app.use("/api/1.0/comments", require("./routes/comments"));
app.use("/api/1.0/product", require("./routes/product"));
app.use("/api/1.0/orders", require("./routes/orders"));
app.use("/api/1.0/admins", require("./routes/admins"));

//Обработка исключений

app.use((err, req, res, next) => {
  console.info("H A N D L E  E R R O R ! ! !", err);
  // res.status(500);
  return res.json({ status: 1, message: err });
});

//

// Запускаем сервер

app.listen(PORT, () => {
  console.info("Server start on port 3001");
});
