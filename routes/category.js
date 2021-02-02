const express = require("express");
const router = express.Router();

const Category = require("../models/cat-model");
const Product = require("../models/product-model");

router.post("/", async (req, res, next) => {
  const { title } = req.body;

  const exist = await Category.findCat(title).catch((err) => {
    next(err.message);
  });

  if (!!exist) {
    next("Ошибка: Уже существует");
    return;
  }

  const ans = await Category.addCat(title).catch((err) => {
    next(err.message);
  });

  if (!ans) {
    next("Ошибка: Не удалось добавить");
    return;
  }

  res.json({ status: 0 });
});

router.get("/", async (req, res) => {
  const ans = await Category.getAll().catch((err) => {
    res.json({ status: 1, message: err.message });
    return;
  });
  if (!ans) return;

  await Promise.all(
    ans.map((cat) => Product.getProducts(null, { category: cat.title }))
  ).then((values) => {
    for (let i = 0; i < values.length; i++) ans[i].count = values[i].length;
  });

  res.json({ status: 0, categories: ans });
});

router.delete("/:number", async (req, res) => {
  const { number } = req.params;

  const ans = await Category.delete(+number).catch((err) => {
    res.json({ status: 1, message: err.message });
    return;
  });
  if (!ans) return;

  res.json({ status: 0 });
});

router.put("/up/:number", async (req, res) => {
  const { number } = req.params;

  const ans = await Category.moveUp(+number).catch((err) => {
    res.json({ status: 1, message: err.message });
    return;
  });
  if (!ans) return;

  res.json({ status: 0 });
});

router.put("/down/:number", async (req, res) => {
  const { number } = req.params;

  const ans = await Category.moveDown(+number).catch((err) => {
    res.json({ status: 1, message: err.message });
    return;
  });
  if (!ans) return;

  res.json({ status: 0 });
});

module.exports = router;
