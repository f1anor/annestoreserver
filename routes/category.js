const express = require("express");
const router = express.Router();

const Category = require("../models/cat-model");
const Product = require("../models/product-model");

router.post("/", async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) throw new Error("Ошибка: Необходимо уникальное имя");

    const exist = await Category.findCat(name).catch((err) => {
      next(err.message);
    });

    if (!!exist)
      throw new Error(
        JSON.stringify({ name: "Категория с данным именем уже существует" })
      );

    const ans = await Category.addCat(name).catch((err) => {
      next(err.message);
    });

    if (!ans) {
      throw new Error("Ошибка: Не удалось добавить");
    }

    res.json({ status: 0 });
  } catch (err) {
    next(err.message);
    return;
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { search } = req.query;

    const ans = await Category.getAll(search || "");

    await Promise.all(
      ans.map((cat) => Product.getProducts(null, { category: cat.title }))
    ).then((values) => {
      for (let i = 0; i < values.length; i++) ans[i].count = values[i].length;
    });

    res.json({ status: 0, categories: ans });
  } catch (err) {
    return next(err.message);
  }
});

router.delete("/:number", async (req, res, next) => {
  try {
    const { number } = req.params;

    const cat = await Category.getCatByNum(number);
    if (!cat) throw new Error("Исходная категория не найдена");

    await Product.removeCategory(cat.title);

    await Category.delete(+number);

    res.json({ status: 0 });
  } catch (err) {
    next(err.message);
    return;
  }
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

router.put("/rename/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const exist = await Category.findCat(name);
    if (!!exist)
      throw new Error(
        JSON.stringify({ name: "Категория с данным именем уже существует" })
      );

    const cat = await Category.getCatById(id);
    if (!cat)
      throw new Error(
        JSON.stringify({ name: "Исходная категория не найдена" })
      );

    await Product.renameCategory(cat.title, name);
    await Category.rename(cat, name);

    res.json({ status: 0 });
  } catch (err) {
    next(err.message);
    return;
  }
});

module.exports = router;
