const mongoose = require("../libs/mongoose");

const CategorySchema = mongoose.Schema({
  title: {
    type: String,
    require: true,
  },
  number: {
    type: Number,
    require: true,
  },
  count: {
    type: Number,
    default: 0,
  },
  type: {
    type: Number,
    default: 0,
  },
  sizeTable: {
    type: Array,
    default: [],
  },
  date: {
    type: String,
    require: true,
  },
});

const Category = (module.exports = mongoose.model("Category", CategorySchema));

module.exports.addCat = async (cat) => {
  console.info(cat);
  const last = await Category.findOne().sort({ number: -1 });
  const newCat = new Category({
    title: cat.title,
    type: cat.type,
    sizeTable: cat.sizeTable,
    number: !!last ? last.number + 1 : 1,
    date: Date.now(),
  });

  return await newCat.save();
};

module.exports.getAll = async (title) => {
  return await Category.find({
    title: { $regex: `.*${title}.*`, $options: "i" },
  }).sort({
    number: 1,
  });
};

module.exports.findCat = async (title) => {
  return await Category.findOne({ title });
};

module.exports.delete = async (number) => {
  await Category.deleteMany({ number });
  return await Category.updateMany(
    { number: { $gte: number } },
    { $inc: { number: -1 } }
  );
};

module.exports.moveUp = async (number) => {
  const cat = await Category.findOne({ number });
  const tmp = await Category.updateOne(
    { number: number - 1 },
    { $inc: { number: 1 } }
  );

  cat.number = cat.number - 1;
  return await cat.save();
};

module.exports.moveDown = async (number) => {
  const cat = await Category.findOne({ number });
  const tmp = await Category.updateOne(
    { number: number + 1 },
    { $inc: { number: -1 } }
  );

  cat.number = cat.number + 1;
  return await cat.save();
};

module.exports.getCatById = async (id) => {
  console.info(id);
  return await Category.findById(id);
};

module.exports.getCatByNum = async (num) => {
  return await Category.findOne({ number: +num });
};

// Сохранить изменения в измененной категории
module.exports.editCategory = async (category, values) => {
  category.title = values.title;
  category.sizeTable = values.sizeTable;
  category.type = values.type;
  return await category.save();
};

// Поменять позицию категории в списке
module.exports.setPositions = async (start, finish) => {
  // Отдельно сохраняем ту категорию которую перемещаем
  const startCat = await Category.findOne({ number: +start });

  if (+start > +finish) {
    await Category.updateMany(
      { number: { $lt: +start, $gte: +finish } },
      { $inc: { number: +1 } }
    );
  } else {
    await Category.updateMany(
      { number: { $gt: +start, $lte: +finish } },
      { $inc: { number: -1 } }
    );
  }

  // Меняем номер у заранее сохраненного элемента
  startCat.number = +finish;
  await startCat.save();
};
