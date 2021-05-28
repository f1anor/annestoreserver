const express = require("express");
const router = express.Router();
const productSearchProps = require("../config/config").productSearchProps;
const pagination = require("../utlis/pagination");

const multer = require("multer");
const upload = multer();
const multerConfig = require("../config/multer");
const formatNumber = require("../utlis/utils");
const getProductImgConvertParams =
  require("../utlis/utils").getProductImgConvertParams;

const {
  moveImgs,
  removeFilesFromFolder,
  saveConvertedImg,
  mkDir,
  removeDir,
} = require("../libs/fileporvider");

const saveFile = require("../libs/fileporvider").saveFile;

const Product = require("../models/product-model");
const ArchiveProduct = require("../models/archive-product-model");
const Order = require("../models/order-model");

router.get("/check/:article", async (req, res, next) => {
  try {
    const { article } = req.params;

    if (!article) throw new Error("Ошибка: Данные не получены");

    const product = await Product.getProductById(article);
    if (!product)
      throw new Error(JSON.stringify({ article: "Продукт не найден" }));

    res.json({ status: 0 });
  } catch (err) {
    return next(err.message);
  }
});

//Предзагрузить изображения
router.post(
  "/preloadimg/:name",
  upload.single("myImage"),
  async (req, res, next) => {
    try {
      const { name } = req.params;
      const fileParams = {
        filename: `tmp_${name}`,
        path: `${multerConfig.core}${multerConfig.tmpImgs}`,
      };

      const file = await saveFile(req, fileParams);

      res.json({ status: 0, file });
    } catch (err) {
      console.log(err);
      next(err.message);
    }
  }
);

//Добавить продукт
router.post("/", async (req, res, next) => {
  try {
    const product = req.body;

    if (!product) throw new Error("Ошибка: Данные не получены");

    const ans = await Product.addProduct(product);

    await mkDir(
      `${__dirname}/../public/assets/products/${ans._id.toString()}`
    ).catch((err) => {
      Product.deleteProducts([ans._id]);
      throw err;
    });

    await Promise.all(
      product.imgs.map((item, index) =>
        saveConvertedImg(getProductImgConvertParams(item, index, ans._id))
      )
    )
      .then((values) => {
        Product.saveImgs(ans, values);
      })
      .catch((err) => {
        Product.deleteProducts([ans._id]);
        removeDir(`${__dirname}/../public/assets/products/${ans._id}`);
        throw err;
      });

    res.json({ status: 0, success: 1 });
  } catch (err) {
    console.log(err);
    return next(err.message);
  }
});

//Получить все продукы кроме архива
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

//Получить все продукты из архива
router.get("/archive", async (req, res) => {
  const message = [];
  const { page, size = 1, sort, dir, filter, search = "" } = req.query;

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

//Удалить продукты из архива
router.post("/delete", async (req, res, next) => {
  const { selected = [] } = req.body;

  if (selected.length === 0) next("Ошибка: Продукт не выбран");

  const folders = await Promise.all(
    selected.map((id) => ArchiveProduct.getImgFolder(id))
  ).catch((err) => {
    next(err.message);
  });

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

//Готово - переместить продукты в архив
router.post("/toarchive", async (req, res, next) => {
  try {
    const { selected } = req.body;

    if (selected.length === 0) {
      throw new Error("Ошибка: Продукт не выбран");
    }

    const ordersArr = await Order.findByProducts(selected);

    if (ordersArr.length > 0) {
      const orders = ordersArr.map((order) => ` ${formatNumber(order.id, 4)}`);
      throw new Error(
        `Ошибка удаления: Товар присутствует в заказах:${orders}`
      );
    }
    const products = await Product.getProductsByIds(selected);

    if (!products || products.length !== selected.length) {
      throw new Error("Ошибка: Товары не найдены в базе");
    }

    const moved = await ArchiveProduct.saveProducts(products);

    if (!!moved && moved.length !== selected.length) {
      await ArchiveProduct.deleteProducts(moved.map((item) => item._id));
      throw new Error(
        "Ошибка: Не все продукты удалось переместить. Операция отменена"
      );
    } else if (!moved || (!!moved && moved.length === 0)) {
      throw new Error("Ошибка: Не удалось переместить продукты");
    }

    //Перебрасываем изображения из папки в папку. Общий обработчик ошибки при котором отменяетя вся операция.

    for (let item of moved) {
      try {
        if (!item.imgs) return;
        await mkDir(
          `${multerConfig.core}${multerConfig.assetsArchive}${item._id}`
        );
        const imgs = await Promise.all(
          item.imgs.map((img, index) =>
            moveImgs(img, multerConfig.assetsArchive, item._id, index)
          )
        );

        await ArchiveProduct.saveImgs(item, imgs);
      } catch (err) {
        ArchiveProduct.deleteProduct(item._id).catch((err) =>
          console.log(err.message)
        );
        throw err;
      }
    }

    //Удаляем старые изображения и их папку
    await Promise.all(
      selected.map((item) =>
        removeDir(`${multerConfig.core}${multerConfig.assets}${item}`)
      )
    );

    //Удаляем старые продукты
    await Product.deleteProducts(selected);

    res.json({ status: 0 });
  } catch (err) {
    console.log(err);
    return next(err.message);
  }
});

//Готово - вернуть продукты из архива
router.post("/restore", async (req, res) => {
  try {
    const { selected } = req.body;

    if (selected.length === 0) {
      throw new Error("Ошибка: Продукт не выбран");
    }

    const products = await ArchiveProduct.getProductsByIds(selected);

    if (!products || products.length !== selected.length) {
      throw new Error("Ошибка: Товары не найдены в базе");
    }

    const moved = await Product.restoreProducts(products);

    if (!!moved && moved.length !== selected.length) {
      await Product.deleteProducts(moved.map((item) => item._id));
      throw new Error(
        "Ошибка: Не все продукты удалось переместить. Операция отменена"
      );
    } else if (!moved || (!!moved && moved.length === 0)) {
      throw new Error("Ошибка: Не удалось переместить продукты");
    }

    //Перебрасываем изображения из папки в папку. Общий обработчик ошибки при котором отменяетя вся операция.
    for (let item of moved) {
      try {
        if (!item.imgs) return;
        await mkDir(`${multerConfig.core}${multerConfig.assets}${item._id}`);

        const imgs = await Promise.all(
          item.imgs.map((img, index) =>
            moveImgs(img, multerConfig.assets, item._id, index)
          )
        );
        // const imgs = await moveImgs(item.imgs, multerConfig.assets, "products");
        await Product.saveImgs(item, imgs);
      } catch (err) {
        Product.deleteProduct(item._id).catch((err) => console.log(err));
        throw err;
      }
    }

    await Promise.all(
      selected.map((item) =>
        removeDir(`${multerConfig.core}${multerConfig.assetsArchive}${item}`)
      )
    );

    await ArchiveProduct.deleteProducts(selected);

    res.json({ status: 0 });
  } catch (err) {
    console.log(err);
    return next(err.message);
  }
});

//Готово - предзагрузить для редактирования
router.get("/update/:id", async (req, res, next) => {
  try {
    const remove = await removeFilesFromFolder(
      `${multerConfig.core}${multerConfig.tmpImgs}`
    );
    if (!remove) throw new Error("Ошибка: Ошибка очистки временной папки");

    const { id } = req.params;
    if (!id) throw new Error("Ошибка: Отсутствует индентификатор продукта");

    let product = await Product.getProductById(id);
    if (!product)
      throw new Error("Ошибка: Продукт с таким ID не найден в базе");

    const imgs = [];

    for (const item of product.imgs) {
      try {
        const movedImgs = {};

        const movedFiles = await moveImgs(
          item,
          multerConfig.tmpImgs,
          null,
          item._id
        );

        imgs.push(movedFiles);
      } catch (err) {
        console.log("ERROR", err.message);
        throw err;
      }
    }

    product = product.toObject();

    res.json({ status: 0, product: { ...product, imgs: imgs } });
  } catch (err) {
    console.log(err);
    return next(err.message);
  }
});

//Готово - вернуть один продукт по ID
router.get("/:art", async (req, res, next) => {
  try {
    const { art } = req.params;
    const product = await Product.getProductById(+art);
    if (!product)
      throw new Error(JSON.stringify({ name: "Продукт не найден" }));
    res.json({ status: 0, product });
  } catch (err) {
    return next(JSON.stringify({ name: err.message }));
  }
});

//Поменять статус продукта
router.put("/status", async (req, res, next) => {
  console.log(req.body);
  const { id, status } = req.body;

  await Product.toggleStatus(id, status).catch((err) => {
    return next(err.message);
  });

  res.json({ status: 0 });
});

//Готово - сохранение изменений в продукте
router.post("/edit", async (req, res, next) => {
  try {
    const { fields, id } = req.body;
    if (!fields) throw new Error("Ошибка: Данные не получены");

    const product = await Product.editProduct(id, fields);
    if (!product) throw new Error("Ошибка: Не удалось сохранить изменения");

    //Переносим изображения

    await removeFilesFromFolder(
      `${multerConfig.core}${multerConfig.assets}/${id}`
    );

    const { imgs } = fields;
    const movedImgs = [];

    let counter = 0;
    for (let img of imgs) {
      try {
        if (!img.noedit) {
          const movedImg = await saveConvertedImg(
            getProductImgConvertParams(img, counter, id)
          );
          movedImgs.push(movedImg);
        } else if (!!img.noedit) {
          const files = img.imgs;

          const movedFiles = await moveImgs(
            files,
            multerConfig.assets,
            id,
            counter
          );

          movedImgs.push(movedFiles);
        }
        counter = counter + 1;
      } catch (err) {
        console.log("Ошибка при переносе", err);
        throw err;
      }
    }
    await Product.saveImgs(product, movedImgs);

    res.json({ status: 0 });
  } catch (err) {
    console.log(err);
    return next(err.message);
  }
});

module.exports = router;
