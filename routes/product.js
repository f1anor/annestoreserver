const express = require("express");
const router = express.Router();
const productSearchProps = require("../config/config").productSearchProps;
const pagination = require("../utlis/pagination");

const multer = require("multer");
const upload = multer();
const multerConfig = require("../config/multer");
const formatNumber = require("../utlis/utils");

const {
  removeFilesFromFolder,
  saveConvertedImg,
  mkDir,
  removeDir,
} = require("../libs/fileporvider");

const saveFile = require("../libs/fileporvider").saveFile;

const Product = require("../models/product-model");
const ArchiveProduct = require("../models/archive-product-model");
const Order = require("../models/order-model");

router.post(
  "/preloadimg/:name",
  upload.single("myImage"),
  async (req, res, next) => {
    const { name } = req.params;
    const fileParams = {
      filename: `tmp_${name}`,
      path: `${multerConfig.tmpImgs}/productsImg`,
    };

    // const remove = await removeFilesFromFolder(fileParams.path).catch((err) => {
    //   res.json({ status: 0, errorMsg: err.message });
    //   return;
    // });
    // if (!remove) return;

    const file = await saveFile(req, fileParams).catch((err) => {
      next(err.message);
      return;
    });

    res.json({ status: 0, file });
  }
);

router.post("/", async (req, res, next) => {
  const product = req.body;
  console.log(product);

  const ans = await Product.addProduct(product).catch((err) => {
    return next(err.message);
  });

  const getParams = (img, index) => {
    console.log(img);
    return {
      initPath: `${__dirname}/../public/${img.preloadImg}`,
      finalPath: `${__dirname}/../public/assets/products/${ans._id.toString()}`,
      output: `assets/products/${ans._id}`,
      smallFileName: `${index}_Small.jpg`,
      mediumFileName: `${index}_Medium.jpg`,
      largeFileName: `${index}_Large.jpg`,
      zoom: img.zoom || 1,
      x: img.x || 0,
      y: img.y || 0,
      width: img.width,
      height: img.height,
    };
  };

  await mkDir(
    `${__dirname}/../public/assets/products/${ans._id.toString()}`
  ).catch((err) => {
    Product.deleteProducts([ans._id]);
    return next(err.message);
  });

  await Promise.all(
    product.imgs.map((item, index) => saveConvertedImg(getParams(item, index)))
  )
    .then((values) => {
      Product.saveImgs(ans, values);
    })
    .catch((err) => {
      Product.deleteProducts([ans._id]);
      removeDir(`${__dirname}/../public/assets/products/${ans._id}`);
      next(err.message);
    });

  res.json({ status: 0, success: 1 });
});

router.get("/archive", async (req, res) => {
  const message = [];
  const { page, pagesize = 10, sort, dir, filter, search = "" } = req.query;

  const searchProps = {
    $or: [
      ...productSearchProps.map((prop) => ({
        [prop]: { $regex: search, $options: "i" },
      })),
    ],
  };

  const products = await ArchiveProduct.getProducts(
    { [sort]: +dir },
    JSON.parse(filter || "{}"),
    searchProps
  ).catch((err) => {
    message.push(err.message);
    return;
  });

  const productsOnPage = pagination(products, page, pagesize);

  if (message.length > 0) {
    res.json({
      status: 1,
      message: message[0],
    });
    return;
  }

  res.json({
    status: 0,
    products: productsOnPage,
    totalCount: products.length,
  });
});

router.get("/", async (req, res) => {
  const message = [];
  const { page, size = 1, sort, dir, filter, search = "" } = req.query;

  console.log(size);

  const searchProps = {
    $or: [
      ...productSearchProps.map((prop) => ({
        [prop]: { $regex: search, $options: "i" },
      })),
    ],
  };

  const products = await Product.getProducts(
    { [sort]: +dir },
    JSON.parse(filter || "{}"),
    searchProps
  ).catch((err) => {
    message.push(err.message);
    return;
  });
  const productsOnPage = pagination(products, page, size);

  if (message.length > 0) {
    res.json({
      status: 1,
      message: message[0],
    });
    return;
  }

  res.json({
    status: 0,
    products: productsOnPage,
    totalCount: products.length,
  });
});

router.post("/delete", async (req, res, next) => {
  const { selected = [] } = req.body;

  if (selected.length === 0) next("Ошибка: Продукт не выбран");

  const folders = await Promise.all(
    selected.map((id) => ArchiveProduct.getImgFolder(id))
  ).catch((err) => {
    next(err.message);
  });

  console.log(5555, folders);

  await Promise.all(folders.map((path) => removeDir(path)))
    .then((values) => console.log(values))
    .catch((err) => {
      next(err.message);
      return;
    });

  const ans = await ArchiveProduct.deleteProducts(selected).catch((err) =>
    next(err.message)
  );

  const success = ans.deletedCount === selected.length;
  if (!success) {
    next("Ошибка: Не все удалось удалить!");
  }

  res.json({ status: 0, success });
});

router.post("/toarchive", async (req, res) => {
  const message = [];

  const { selected } = req.body;

  if (selected.length === 0) {
    message.push("Ошибка: Продукт не выбран");
  }

  const ordersArr = await Order.findByProducts(selected);
  if (ordersArr.length > 0) {
    const orders = ordersArr.map((order) => ` ${formatNumber(order.id, 4)}`);
    message.push(`Ошибка удаления: Товар присутствует в заказах:${orders}`);
  }

  let products;
  if (message.length === 0) {
    products = await Product.getProductsByIds(selected).catch((err) => {
      message.push(err.message);
      return;
    });
  }

  if (!products || products.length === 0) {
    message.push("Ошибка: Товары не найдены в базе");
  }

  let moved;
  if (message.length === 0) {
    moved = await ArchiveProduct.saveProducts(products).catch((err) => {
      message.push(err.message);
      return;
    });
  }

  if (!moved || moved.length === 0) {
    message.push("Ошибка: Не удалось переместить в архив");
  }

  let removed;
  if (message.length === 0) {
    removed = await Product.deleteProducts(selected).catch((err) => {
      message.push(err.message);
      return;
    });
  }

  if (!removed) {
    message.push("Ошибка: Операция завешена с ошибкой");
  }

  if (message.length > 0) {
    res.json({ status: 1, message: message[0] });
    return;
  }

  res.json({ status: 0 });
});

router.post("/restore", async (req, res) => {
  const message = [];

  const { selected } = req.body;

  console.log(selected);

  if (selected.length === 0) {
    message.push("Ошибка: Продукт не выбран");
  }

  let products;
  if (message.length === 0) {
    products = await ArchiveProduct.getProductsByIds(selected).catch((err) => {
      message.push(err.message);
      return;
    });
  }

  if (message.length === 0 && products.length === 0) {
    message.push("Ошибка: Товары не найдены в базе");
  }

  let moved;
  if (message.length === 0) {
    moved = await Product.restoreProducts(products).catch((err) => {
      message.push(err.message);
      return;
    });
  }

  if (!moved || moved.length === 0) {
    message.push("Ошибка: Не удалось переместить в архив");
  }

  let removed;
  if (message.length === 0) {
    removed = await ArchiveProduct.deleteProducts(selected).catch((err) => {
      message.push(err.message);
      return;
    });
  }

  if (!removed) {
    message.push("Ошибка: Операция завешена с ошибкой");
  }

  if (message.length > 0) {
    res.json({ status: 1, message: message[0] });
    return;
  }

  res.json({ status: 0 });
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

router.put("/status", async (req, res, next) => {
  console.log(req.body);
  const { id, status } = req.body;

  await Product.toggleStatus(id, status).catch((err) => {
    return next(err.message);
  });

  res.json({ status: 0 });
});

module.exports = router;
