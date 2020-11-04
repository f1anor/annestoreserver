const express = require("express");
const router = express.Router();

const Category = require("../models/cat-model");
const Product = require("../models/product-model");

// router.get("/set", (req, res) => {
//   const key = "key";
//   const value = "value";
//   const age = 1000 * 60 * 60 * 24 * 30;
//   res.cookie(key, value, {
//     maxAge: age,
//     path: "/",
//     // sameSite: "Lax",
//   });

//   // res.set("Access-Control-Allow-Origin", req.headers.origin);
//   // res.set("Access-Control-Allow-Credentials", "true");
//   // res.set(
//   //   "Access-Control-Allow-Headers",
//   //   "Origin, X-Requested-With, Content-Type, Accept"
//   // );
//   res.send({ message: "set cookie successs" });
// });

router.post("/", async (req, res) => {
  const { title } = req.body;
  console.log(title);

  const ans = await Category.addCat(title).catch((err) => {
    res.json({ status: 1, message: err.message });
    return;
  });

  if (!ans) return;

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
