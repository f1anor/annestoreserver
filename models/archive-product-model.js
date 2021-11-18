const mongoose = require("../libs/mongoose");
const autoIncrement = require("mongoose-auto-increment");

const ImgsSchema = mongoose.Schema({
  large: { type: String, default: null },
  medium: { type: String, default: null },
  small: { type: String, default: null },
});

const StructureSchema = mongoose.Schema({
  name: { type: String, require: true },
  value: { type: Number, require: true },
});

const CommentsSchema = mongoose.Schema({
  date: {
    type: String,
    require: true,
  },
  name: {
    type: String,
    require: true,
  },
  content: {
    type: String,
    require: true,
  },
  stars: {
    type: Number,
    require: false,
  },
});

const ArchiveProductSchema = mongoose.Schema({
  date: {
    type: Number,
    require: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  stars: {
    type: Number,
    default: 0,
  },
  starsCount: {
    type: Number,
    default: 0,
  },
  title: {
    type: String,
    require: true,
  },
  description: {
    type: String,
    require: true,
  },
  price: {
    type: Number,
    require: true,
  },
  color: {
    type: String,
    require: false,
  },
  size: [String],
  gender: {
    type: String,
    require: false,
  },
  imgs: [ImgsSchema],
  structure: [StructureSchema],
  comments: [CommentsSchema],
});

ArchiveProductSchema.plugin(autoIncrement.plugin, "number");
const ArchiveProduct = (module.exports = mongoose.model(
  "ArchiveProduct",
  ArchiveProductSchema
));

module.exports.saveProducts = async (products) => {
  const tmp = products.map((product) => {
    return product.toObject();
  });

  tmp.forEach((product) => {
    delete product._id;
    delete product.category;
  });

  const archivedProducts = tmp.map((product) => new ArchiveProduct(product));

  return await Promise.all(
    archivedProducts.map((archiveProduct) => archiveProduct.save())
  );
};

module.exports.saveImgs = async (product, imgs) => {
  product.imgs = imgs;
  return await product.save();
};

module.exports.getProducts = async (sort, filter, search) => {
  return await ArchiveProduct.find({
    ...filter,
    ...search,
  }).sort(sort);
};

module.exports.getProductsByIds = async (ids) => {
  return await ArchiveProduct.find({ _id: ids });
};

module.exports.deleteProducts = async (selected) => {
  return await ArchiveProduct.deleteMany({ _id: selected });
};

module.exports.deleteProduct = async (id) => {
  return await ArchiveProduct.deleteOne({ _id: id });
};

module.exports.getImgFolder = async (id) => {
  const product = await ArchiveProduct.findById(id);

  return product.imgs.folder;
};
