const express = require("express");
const router = express.Router();

const Category = require("../models/cat-model");
const Product = require("../models/product-model");

router.post("/", async (req, res, next) => {
  try {
    const cat = req.body;
    if (!cat.title)
      throw new Error(JSON.stringify({ title: "Необходимо уникальное имя" }));

    const exist = await Category.findCat(cat.title).catch((err) => {
      next(err.message);
    });

    if (!!exist)
      throw new Error(
        JSON.stringify({ title: "Категория с данным именем уже существует" })
      );

    const ans = await Category.addCat(cat);

    if (!ans) {
      throw new Error("Ошибка: Не удалось добавить");
    }

    res.json({ status: 0 });
  } catch (err) {
    next(err.message);
    return;
  }
});

//Готово - Предзагрузить категорию для редактирования
router.get("/fetchedit/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const ans = await Category.getCatById(id);

    if (!ans) throw new Error("Ошибка: Категории не существует");

    res.json({ status: 0, cat: ans });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

//Готово - Получить все категории
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

//Готово - Удалить категорию
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

//Переместить выбранную категорию на единицу выше
router.put("/up/:number", async (req, res) => {
  const { number } = req.params;

  const ans = await Category.moveUp(+number).catch((err) => {
    res.json({ status: 1, message: err.message });
    return;
  });
  if (!ans) return;

  res.json({ status: 0 });
});

//Пеоемесьтьб выбранную категорию на единцу ниже
router.put("/down/:number", async (req, res) => {
  const { number } = req.params;

  const ans = await Category.moveDown(+number).catch((err) => {
    res.json({ status: 1, message: err.message });
    return;
  });
  if (!ans) return;

  res.json({ status: 0 });
});

// TODO: Доделать обновление категории в продуктах
router.put("/edit/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const cat = req.body;

    const exist = await Category.findCat(cat.name);
    if (!!exist)
      throw new Error(
        JSON.stringify({ title: "Категория с данным именем уже существует" })
      );

    const ans = await Category.getCatById(id);
    if (!ans)
      throw new Error(
        JSON.stringify({ title: "Исходная категория не найдена" })
      );

    // FIXME: Сделать так чтобы данные категории также менялись и в продуктах
    // await Product.renameCategory(cat.title, name);
    await Category.editCategory(ans, cat);

    res.json({ status: 0 });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

// Поменять позицию категории в списке
router.put("/setposition/:start/:finish", async (req, res, next) => {
  try {
    const { start, finish } = req.params;

    await Category.setPositions(start, finish);

    res.json({ status: 0 });
  } catch (err) {
    console.info(err);
    return next(err.message);
  }
});

module.exports = router;
