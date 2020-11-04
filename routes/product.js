const express = require("express");
const router = express.Router();
const pagination = require("../utlis/pagination");

const multer = require("multer");
const upload = multer();
const multerConfig = require("../config/multer");

const {
  removeFilesFromFolder,
  saveConvertedImg,
  mkDir,
  removeDir,
} = require("../libs/fileporvider");

const saveFile = require("../libs/fileporvider").saveFile;

const Product = require("../models/product-model");

router.post("/preloadimg/:name", upload.single("myImage"), async (req, res) => {
  const { name } = req.params;
  const fileParams = {
    filename: `tmp_${name}`,
    path: `${multerConfig.tmpImgs}/${name}`,
  };

  const remove = await removeFilesFromFolder(fileParams.path).catch((err) => {
    res.json({ status: 0, errorMsg: err.message });
    return;
  });
  if (!remove) return;

  const file = await saveFile(req, fileParams).catch((err) => {
    res.json({ status: 0, errorMsg: err.message });
    return;
  });

  res.json({ status: 0, file });
});

router.post("/", async (req, res) => {
  const product = req.body;
  console.log(product);
  const ans = await Product.addProduct(product);

  const getParams = (img) => {
    return {
      initPath: `${__dirname}/../public/${product[img].preloadedImg}`,
      finalPath: `${__dirname}/../public/assets/products/${ans._id}`,
      output: `assets/products/${ans._id}`,
      smallFileName: `${img}Small.jpg`,
      largeFileName: `${img}Large.jpg`,
      zoom: product[img].zoom || 1,
      x: product[img].x || 0,
      y: product[img].y || 0,
      width: product[img].width,
      height: product[img].height,
    };
  };

  const getNullImg = () => {
    return {
      small: null,
      large: null,
    };
  };

  await mkDir(`${__dirname}/../public/assets/products/${ans._id}`);

  await Promise.all([
    !!product.img1 ? saveConvertedImg(getParams("img1")) : getNullImg(),
    !!product.img2 ? saveConvertedImg(getParams("img2")) : getNullImg(),
    !!product.img3 ? saveConvertedImg(getParams("img3")) : getNullImg(),
  ]).then((values) => Product.saveImgs(ans, values));

  res.json({ status: 0, success: 1 });
});

router.get("/", async (req, res) => {
  const { page, pagesize = 10, sort, dir, filter } = req.query;

  const products = await Product.getProducts(
    { [sort]: +dir },
    JSON.parse(filter || "{}")
  );
  const productsOnPage = pagination(products, page, pagesize);

  res.json({
    status: 0,
    products: productsOnPage,
    totalCount: products.length,
  });
});

router.post("/delete", async (req, res) => {
  const { selected } = req.body;

  await Promise.all(
    selected.map((id) => removeDir(`${multerConfig.assets}${id}`))
  )
    .then((values) => console.log(values))
    .catch((err) => console.log(err.message));
  console.log(12312);

  const ans = await Product.deleteProducts(selected);

  const success = ans.deletedCount === selected.length;
  if (!success) res.json({ status: 1, message: "Not all deleted" });

  res.json({ status: 0, success });
});

router.get("/update/:article", async (req, res) => {
  const { article } = req.params;

  const product = await Product.getByArticle(article);

  res.json({ status: 0, product });
});

router.get("/:art", async (req, res) => {
  const { art } = req.params;

  const product = await Product.getByArticle(art);
  console.log(product);

  res.json({ status: 0, product });
});

module.exports = router;
