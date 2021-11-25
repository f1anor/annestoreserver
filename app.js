"use strict";

const express = require("express");
const session = require("express-session");
const app = express();
app.set("trust proxy", 1);

const MongoStore = require("connect-mongo")(session);

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const useragent = require("express-useragent");
const requestIp = require("request-ip");

// Подключение к базе
const mongoose = require("./libs/mongoose");

// Разрешение кросдоменных запросов
const cors = require("cors");
app.use(
  cors({
    origin: [
      "https://anna-store-admin.herokuapp.com",
      "https://f1anor.github.io",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
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

// Сессии

app.use(
  session({
    secret: "justsomestuff",
    resave: false,
    saveUninitialized: true,
    expires: new Date(Date.now() + 60 * 60 * 24 * 7 * 1000),
    proxy: true,
    cookie: { sameSite: "none", domain: "heroku.com" },
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  })
);

//

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
  console.info(`Server start on port ${PORT}`);
});
