"use strict";

const express = require("express");
const app = express();

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

// Подключение к базе
const mongoose = require("./libs/mongoose");

// Разрешение кросдоменных запросов
const cors = require("cors");
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Авторизация через PassportJS
const passport = require("passport");
const Session = require("./models/session-model");

const urlencodedParser = bodyParser.urlencoded({
  extended: true,
  limit: "50mb",
  parameterLimit: "50000",
});

app.use(bodyParser.json({ limit: "50mb" }));
app.use(cookieParser("loremIpsum"));

const port = 3001;

// Куки для сессий
app.use(async (req, res, next) => {
  const { sid } = req.signedCookies;
  console.log(req.headers["x-forwarded-for"] || req.connection.remoteAddress);
  if (!sid) {
    const ans = await Session.setNewSession();
    res.cookie("sid", ans._id, { signed: true });
  }
  next();
});

// app.use(passport.initialize());
// require("./libs/passport")(passport);

// Отладка в консоли
app.use((req, res, next) => {
  console.log([req.method, req.url].join(" "));
  next();
});

// Роутер

app.use("/api/1.0/statistic", require("./routes/statistic"));
app.use("/api/1.0/category", require("./routes/category"));
app.use("/api/1.0/product", require("./routes/product"));
app.use("/api/1.0/orders", require("./routes/orders"));

// Отдаем статику

app.use(express.static("public"));

//

// Запускаем сервер

app.listen(port, () => {
  console.log("Server start on port 3001");
});
