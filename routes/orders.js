const express = require("express");
const orderSearchProps = require("../config/config").orderSearchProps;
const router = express.Router();

const Product = require("../models/product-model");
const Order = require("../models/order-model");
const pagination = require("../utlis/pagination");

router.post("/", async (req, res) => {
  const order = req.body;
  console.log(order);

  const ans = await Order.addOrder(order);

  res.json({ status: 0 });
});

router.put("/changeStatus", async (req, res) => {
  const { id, status } = req.body;

  const ans = await Order.changeStatus(id, status).catch((err) => {
    res.json({ status: 1, message: err.message });
    return;
  });

  if (!ans) {
    res.json({ status: 1, message: "Ошибка: Заказ не найден в базе" });
    return;
  }

  res.json({ status: 0 });
});

router.put("/:id", async (req, res) => {
  const order = req.body;
  const { id } = req.params;

  const ans = await Order.updateOrder(id, order).catch((err) => {
    res.json({ status: 1, message: err.message });
    return;
  });

  if (!ans) return;

  res.json({ status: 0 });
});

router.get("/", async (req, res) => {
  const {
    page = 1,
    status = "all",
    sort = "creationDate",
    dir = -1,
    search = "",
  } = req.query;
  const аllOrders = await Order.getOrders();
  const newOrders = аllOrders.filter((order) => order.status === "new");
  const processOrders = аllOrders.filter((order) => order.status === "process");
  const warningOrders = аllOrders.filter((order) => order.status === "warning");
  const successOrders = аllOrders.filter((order) => order.status === "success");
  const complitedOrders = аllOrders.filter(
    (order) => order.status === "complited"
  );
  const deletedOrders = аllOrders.filter((order) => order.status === "deleted");

  let filter;
  if (status === "all" && status !== "deleted") {
    filter = { status: { $ne: "deleted" } };
  } else if (status !== "all" && status !== "deleted") {
    filter = { status: { $ne: "deleted", $eq: status } };
  } else {
    filter = { status };
  }

  const searchProps = {
    $or: [
      ...orderSearchProps.map((prop) => ({
        [prop]: { $regex: search, $options: "i" },
      })),
    ],
  };
  const orders = await Order.getOrders(filter, { [sort]: +dir }, searchProps);
  const ordersOnPage = pagination(orders, page, 10);

  res.json({
    status: 0,
    total: orders.length,
    orders: ordersOnPage,
    counts: {
      total: аllOrders.filter((item) => item.status !== "deleted").length,
      new: newOrders.length,
      process: processOrders.length,
      warning: warningOrders.length,
      success: successOrders.length,
      complited: complitedOrders.length,
      deleted: deletedOrders.length,
    },
  });
});

router.get("/getedit/:id", async (req, res) => {
  const { id } = req.params;

  const ans = await Order.getOrderById(id).catch((err) => {
    res.json({ status: 1, message: err.message });
    return;
  });

  if (!ans) {
    res.json({ status: 1, message: "Заказ не найден" });
  }

  res.json({ status: 0, order: ans });
});

module.exports = router;
