const express = require("express");
const orderSearchProps = require("../config/config").orderSearchProps;
const orderFilters = require("../config/config").orderFilters;
const router = express.Router();

const Order = require("../models/order-model");
const pagination = require("../utlis/pagination");
const compareOrdersFilters =
  require("../utlis/generateFilters").compareOrdersFilters;

// Получить заказы
router.get("/:status", async (req, res, next) => {
  try {
    const { status = "all" } = req.params;

    const {
      page = 1,
      sort = "creationDate",
      dir = -1,
      search = "",
      size,
      filter = "{}",
    } = req.query;

    // Проверяем фильтры. С целью отсеить мусор в URL и удалить неразрешенные
    const checkedFilters = compareOrdersFilters(
      orderFilters,
      JSON.parse(filter)
    );

    if (status !== "all") {
      checkedFilters.status = status;
    }

    console.log(checkedFilters);

    const searchProps = {
      $or: [
        ...orderSearchProps.map((prop) => ({
          [prop]: { $regex: search.trim(), $options: "i" },
        })),
      ],
    };

    const orders = await Order.getOrders(
      checkedFilters,
      { [sort]: +dir },
      searchProps
    );
    const ordersOnPage = pagination(orders, page, size);

    res.json({
      status: 0,
      total: orders.length,
      orders: ordersOnPage,
    });
  } catch (err) {
    console.log(err);
    return next(err.message);
  }
});

// Добавление заказа
router.post("/", async (req, res, next) => {
  try {
    const order = req.body;

    await Order.addOrder(order);

    res.json({ status: 0 });
  } catch (err) {
    return next(err.message);
  }
});

// Смена статуса. FIXME: Переделать. Обработка ошибок
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

// Редактирование заказа.
router.put("/:id", async (req, res, next) => {
  try {
    const order = req.body;
    const { id } = req.params;

    const ans = await Order.updateOrder(id, order);

    if (!ans) throw new Error("Ошибка: Не удалось сохранить изменения");

    res.json({ status: 0 });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

// Удаление заказа
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) throw new Error("Ошибка: отсутствует ID заказа");
    const deleted = await Order.removeOrder(id);
    if (deleted.deletedCount === 0)
      throw new Error("Ошибка: заказ с данным ID не найден");

    res.json({ status: 0 });
  } catch (err) {
    console.log(err);
    return next(err.message);
  }
});

// Получить один заказ
router.get("/single/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) throw new Error("Ошибка: отсутствует ID заказа");

    const order = await Order.getOrderById(id);

    if (!order) throw new Error("Ошибка: заказ с данным ID не найден в базе");

    res.json({ status: 0, order });
    console.log(order);
  } catch (err) {
    console.log(err);
    return next(err.message);
  }
});

router.get("/notes/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) throw new Error("ID заказа не найден");

    const order = await Order.getOrderById(id);

    if (!order) throw new Error("Ошибка: заказ с данным ID не найден в базе");

    res.json({ status: 0, notes: order.managerNotes });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

// Добавить заметку в заказ
router.post("/addnote/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const values = req.body;
    console.log(values);
    if (!id)
      throw new Error(JSON.stringify({ comment: "ID заказа не найден" }));

    await Order.addNoteToOrder(id, values);

    res.json({ status: 0 });
  } catch (err) {
    console.info(err);
    return next(JSON.stringify({ comment: err.message }));
  }
});

module.exports = router;
