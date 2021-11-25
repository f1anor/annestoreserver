const express = require("express");
const Session = require("../models/session-model");
const Order = require("../models/order-model");
const pagination = require("../utlis/pagination");
const User = require("../models/user-model");
const Product = require("../models/product-model");

const router = express.Router();

// Данные для графика о посетителях и заказах
router.get("/", async (req, res, next) => {
  try {
    let { range = "week", time } = req.query;

    const date = new Date(+time || Date.now());
    !!time && date.setDate(date.getDate() + 1);

    const now = date.getTime();

    const timeArr = [];
    let sessions = await Session.getSessions();
    let orders;

    switch (range) {
      case "day": {
        date.setDate(date.getDate() - 1);
        const period = {
          min: now - (now - date.getTime()),
          max: now,
          firstHour: new Date(now - (now - date.getTime())).getHours(),
        };

        // Фильтруем по заданному времени
        sessions = sessions
          .map((item) => JSON.parse(item.session))
          .filter(
            (item) => +item.date >= period.min && +item.date <= period.max
          );

        orders = await Order.getOrders({
          creationDate: { $gte: period.min, $lte: period.max },
        });

        for (let i = period.firstHour; i <= period.firstHour + 24; i++) {
          const date = new Date(+time || Date.now());
          !time && date.setDate(date.getDate() - 1);
          let hour = i;
          if (hour >= 24) {
            hour = hour - 24;
            date.setDate(date.getDate() + 1);
          }

          date.setHours(hour);
          date.setMinutes(0);
          date.setSeconds(0);

          const min = date.getTime();
          const max = date.getTime() + 3600000 - 1;

          let visitors = 0;
          let makedOrders = 0;

          sessions.forEach((session) => {
            if (session.date > min && session.date < max) visitors++;
          });

          orders.forEach((order) => {
            if (order.creationDate > min && order.creationDate < max)
              makedOrders++;
          });

          timeArr.push({
            time: hour,
            visitors,
            makedOrders,
          });
        }
        break;
      }
      case "week": {
        const now = date.getTime();
        date.setDate(date.getDate() - 7);
        const period = {
          min: now - (now - date.getTime()),
          max: now,
        };

        // Фильтруем по заданному времени
        sessions = sessions
          .map((item) => JSON.parse(item.session))
          .filter(
            (item) => +item.date >= period.min && +item.date <= period.max
          );

        orders = await Order.getOrders({
          creationDate: { $gte: period.min, $lte: period.max },
        });

        for (let i = 0; i < 7; i++) {
          const date = new Date(+time || Date.now());
          if (!time) {
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
          }
          date.setDate(date.getDate() - i);

          const day = date.toLocaleString("ru", {
            weekday: "short",
          });

          const min = date.getTime();
          const max = min + 86400000 - 1;

          let visitors = 0;
          let makedOrders = 0;

          sessions.forEach((session) => {
            if (session.date > min && session.date < max) visitors++;
          });

          orders.forEach((order) => {
            if (order.creationDate > min && order.creationDate < max)
              makedOrders++;
          });

          timeArr.push({
            time: day,
            visitors,
            makedOrders,
          });
        }
        timeArr.reverse();
        break;
      }
      case "all": {
        const now = date.getTime();
        date.setDate(date.getDate() - 14);
        const period = {
          min: now - (now - date.getTime()),
          max: now,
        };

        // Фильтруем по заданному времени
        sessions = sessions
          .map((item) => JSON.parse(item.session))
          .filter(
            (item) => +item.date >= period.min && +item.date <= period.max
          );

        orders = await Order.getOrders({
          creationDate: { $gte: period.min, $lte: period.max },
        });

        for (let i = 0; i < 14; i++) {
          const date = new Date(+time || Date.now());
          if (!time) {
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
          }
          date.setDate(date.getDate() - i);

          const day = date.toLocaleString("ru", {
            weekday: "short",
          });

          const min = date.getTime();
          const max = min + 86400000 - 1;

          let visitors = 0;
          let makedOrders = 0;

          sessions.forEach((session) => {
            if (session.date > min && session.date < max) visitors++;
          });

          orders.forEach((order) => {
            if (order.creationDate > min && order.creationDate < max)
              makedOrders++;
          });

          timeArr.push({
            time: day,
            visitors,
            makedOrders,
          });
        }
        timeArr.reverse();
        break;
      }
    }

    res.json({
      status: 0,
      data: timeArr,
    });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

// Получить количество всех пользователей. Посчитать прирост за неделю в %
router.get("/userscount", async (req, res, next) => {
  try {
    const allUsers = await User.getUsers();

    const lastWeekUsers = await User.getUsers({
      date: {
        $gt: Date.now() - 6048000000,
      },
    });

    res.json({
      status: 0,
      users: {
        all: allUsers.length,
        last:
          allUsers.length !== 0
            ? (lastWeekUsers.length * 100) / allUsers.length
            : 0,
      },
    });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

// Получить количество всех продуктов. Посчитать прирост за неделю в %
router.get("/productscount", async (req, res, next) => {
  try {
    const allProducts = await Product.getProducts();
    const lastProducts = await Product.getProducts(null, {
      date: {
        $gt: Date.now() - 6048000000,
      },
    });

    res.json({
      status: 0,
      products: {
        all: allProducts.length,
        last:
          allProducts.length !== 0
            ? (lastProducts.length * 100) / allProducts.length
            : 0,
      },
    });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

// Получить количество всех заказов. Посчитать прирост за неделю в %
router.get("/orderscount", async (req, res, next) => {
  try {
    const allOrders = await Order.getOrders();
    const lastOrders = await Order.getOrders({
      creationDate: {
        $gt: Date.now() - 6048000000,
      },
    });

    res.json({
      status: 0,
      orders: {
        all: allOrders.length,
        last:
          allOrders.length !== 0
            ? (lastOrders.length * 100) / allOrders.length
            : 0,
      },
    });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

// Получить всю прибыль с выполненных заказов. Посчитать прирост прибыли за неделю
router.get("/totalcash", async (req, res, next) => {
  try {
    const allComplitedOrders = await Order.getOrders({ status: "completed" });

    const allTotalCash = allComplitedOrders.reduce(
      (previusValue, currentValue) => {
        return previusValue + (currentValue.price - currentValue.deliveryPrice);
      },
      0
    );

    const lastComplitedOrders = await Order.getOrders({
      status: "completed",
      creationDate: {
        $gt: Date.now() - 6048000000,
      },
    });

    const lastTotalCash = lastComplitedOrders.reduce(
      (previusValue, currentValue) => {
        return previusValue + (currentValue.price - currentValue.deliveryPrice);
      },
      0
    );

    res.json({
      status: 0,
      cash: {
        all: allTotalCash,
        last: allTotalCash !== 0 ? (lastTotalCash * 100) / allTotalCash : 0,
      },
    });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

// Получить статистику по платформам
router.get("/platform", async (req, res, next) => {
  try {
    // Здесь будут все платформы с количеством заходов в каждую
    const platforms = {};

    // Получаем все сессии из базы
    const sessions = await Session.getSessions();
    // Перебираем сессии и считаем все платформы
    sessions.forEach((session) => {
      if (platforms.hasOwnProperty(session.platform)) {
        platforms[session.platform] += 1;
      } else {
        platforms[session.platform] = 1;
      }
    });

    // Сумма всех заходов на всех платформах
    const sum = Object.values(platforms).reduce((prev, next) => prev + next, 0);

    // Здесь будут все платформы с процентами по заходам
    const details = {};

    for (const key in platforms) {
      details[key] = +((platforms[key] * 100) / sum).toFixed(1);
    }

    res.json({
      status: 0,
      platformStatistic: {
        global: {
          Desktop: 30,
          Mobile: 70,
        },
        details,
      },
    });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

// Получить сессии для таблицы
router.get("/sessions/:page", async (req, res, next) => {
  try {
    const { page } = req.params;

    const sessions = await Session.getSessions();

    const sessionsOnPage = pagination(sessions, page, 4);

    res.json({
      status: 0,
      sessions: sessionsOnPage.map((item) => JSON.parse(item.session)),
      totalCount: sessions.length,
    });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

module.exports = router;
