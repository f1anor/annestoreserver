const express = require("express");
const Session = require("../models/session-model");
const Order = require("../models/order-model");
const pagination = require("../utlis/pagination");

const router = express.Router();

router.get("/", async (req, res) => {
  let { range = "week", time, page = 1 } = req.query;
  const pagesize = 10;

  const date = new Date(+time || Date.now());
  !!time && date.setDate(date.getDate() + 1);

  const now = date.getTime();

  const timeArr = [];
  let sessions;
  let orders;

  switch (range) {
    case "day": {
      date.setDate(date.getDate() - 1);
      const period = {
        min: now - (now - date.getTime()),
        max: now,
        firstHour: new Date(now - (now - date.getTime())).getHours(),
      };

      sessions = await Session.getSessions({
        date: { $gte: period.min, $lte: period.max },
      });
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

      sessions = await Session.getSessions({
        date: { $gte: period.min, $lte: period.max },
      });
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

        const day = date.toLocaleString("ru", { weekday: "long" });

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
    case "month": {
      date.setMonth(date.getMonth() - 1);
      const period = {
        min: date.getTime(),
        max: now,
      };

      sessions = await Session.getSessions({
        date: { $gte: period.min, $lte: period.max },
      });
      orders = await Order.getOrders({
        creationDate: { $gte: period.min, $lte: period.max },
      });

      let currentDate = new Date(+time || Date.now());
      let pastMonthLastDate = new Date(+time || Date.now());
      if (time) {
        date.setDate(date.getDate() - 1);
      }
      currentDate = currentDate.getDate();
      pastMonthLastDate.setDate(0);
      pastMonthLastDate = pastMonthLastDate.getDate();

      for (
        let i = 0;
        i <= currentDate + (pastMonthLastDate - currentDate);
        i++
      ) {
        if (!time) {
          date.setHours(0);
          date.setMinutes(0);
          date.setSeconds(0);
        }
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

        timeArr.push({ time: date.getDate(), visitors, makedOrders });
        date.setDate(date.getDate() + 1);
      }
      break;
    }
  }

  const sessionsOnPage = pagination(sessions, page, pagesize);

  res.json({
    status: 0,
    data: timeArr,
    sessionsOnPage,
    totalCount: sessions.length,
  });
});

module.exports = router;
