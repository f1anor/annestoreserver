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
});

const Category = (module.exports = mongoose.model("Category", CategorySchema));

module.exports.addCat = async (title) => {
  const last = await Category.findOne().sort({ number: -1 });
  const newCat = new Category({
    title,
    number: !!last ? last.number + 1 : 1,
  });

  return await newCat.save();
};

module.exports.getAll = async () => {
  return await Category.find().sort({ number: 1 });
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
