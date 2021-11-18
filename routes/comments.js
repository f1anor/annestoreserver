const express = require("express");
const router = express.Router();
const pagination = require("../utlis/pagination");

const Product = require("../models/product-model");

router.get("/:id?", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, size = 10, type, stars } = req.query;

    let active;
    if (type === "published") active = true;
    if (type === "pending") active = false;

    let data = {};
    if (!id) {
      data = await Product.getAllComments();
      if (!data) throw new Error("Ошибка");
    } else {
      data = await Product.getProductComments(id);
      if (!data) throw new Error("Ошибка");
    }

    if (!!type)
      data.comments = data.comments.filter((item) => item.active === active);
    if (!!stars)
      data.comments = data.comments.filter((item) => item.stars === +stars);

    data.total = data.comments.length;
    data.comments = pagination(data.comments, +page, +size);

    res.json({ status: 0, data });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

router.post("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const values = req.body;
    console.info(values);
    const product = await Product.getProductById(id);
    if (!product) throw new Error("Ошибка: Продукт не найден");

    await Product.addComment(product, values);

    res.json({ status: 0 });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await Product.applyComment(id);

    res.json({ status: 0 });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await Product.removeComment(id);

    res.json({ status: 0 });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

router.delete("/ans/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) throw new Error("Ошибка: Отсутствует ID");

    await Product.removeCommentAns(id);

    res.json({ status: 0 });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

router.put("/ans/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const values = req.body;

    console.info(id, values);

    await Product.addAns(id, values.content);

    res.json({ status: 0 });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

module.exports = router;
