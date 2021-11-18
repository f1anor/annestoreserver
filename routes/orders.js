const express = require("express");
const orderSearchProps = require("../config/config").orderSearchProps;
const orderFilters = require("../config/config").orderFilters;
const router = express.Router();

const Order = require("../models/order-model");
const pagination = require("../utlis/pagination");
const compareOrdersFilters =
  require("../utlis/generateFilters").compareOrdersFilters;

// Получить последние заказы
router.get("/last", async (req, res, next) => {
  try {
    //TODO: проверить на сколько нужно именно новые заказы показывать
    // const orders = await Order.getOrders({ status: "new" });
    const orders = await Order.getOrders();
    // Количество возвращаемых заказов
    if (orders.length > 4) orders.length = 4;

    res.json({ status: 0, orders });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

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
    console.info(err);
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
    console.info(err);
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
    console.info(order);
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

// Получить заметки из заказа
router.get("/notes/:id/:position", async (req, res, next) => {
  try {
    const { id, position } = req.params;
    if (!id) throw new Error("ID заказа не найден");

    const order = await Order.getOrderById(id);

    if (!order) throw new Error("Ошибка: заказ с данным ID не найден в базе");

    const userNotes = [];
    const managerNotes = [];

    order.userNotes.forEach((note) => {
      userNotes.push({ ...note, type: "user" });
    });

    order.managerNotes.forEach((note) => {
      managerNotes.push({ ...note, type: "admin" });
    });

    let notes = [];

    switch (position) {
      case "1":
        notes = Object.assign(userNotes, managerNotes).sort(
          (a, b) => a.date - b.date
        );
        break;
      case "2":
        notes = userNotes || [];
        break;
      case "3":
        notes = managerNotes || [];
        break;
      default:
        break;
    }

    res.json({ status: 0, notes: notes });
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
    console.info(values);
    if (!id)
      throw new Error(JSON.stringify({ comment: "ID заказа не найден" }));

    await Order.addNoteToOrder(id, values);

    res.json({ status: 0 });
  } catch (err) {
    console.info(err);
    return next(JSON.stringify({ comment: err.message }));
  }
});

// Удалить заметку из заказа
router.put("/removenote/:id/:time", async (req, res, next) => {
  try {
    const { id, time } = req.params;

    if (!id || !time) throw new Error("Отсутствуют данные");

    await Order.removeNote(id, time);

    res.json({ status: 0 });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

module.exports = router;
