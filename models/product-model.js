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

const ProductSchema = mongoose.Schema({
  time: {
    type: Date,
    require: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  amount: {
    type: Number,
    default: 0,
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
  category: [],
  size: [String],
  gender: {
    type: String,
    require: false,
  },
  imgs: [ImgsSchema],
  structure: [StructureSchema],
  comments: [CommentsSchema],
});

ProductSchema.plugin(autoIncrement.plugin, "number");
const Product = (module.exports = mongoose.model("Product", ProductSchema));

module.exports.addProduct = async (product) => {
  console.log(product);
  const newProduct = new Product({
    time: Date.now(),
    amount: product.amount,
    active: product.active,
    title: product.title,
    description: JSON.stringify(product.content),
    price: product.price,
    category: product.category,
    size: product.size,
    color: product.color,
    gender: product.gender,
    structure: product.structure,
  });

  return newProduct.save();
};

module.exports.saveImgs = async (product, imgsArr, folder) => {
  product.imgs = imgsArr;

  return await product.save();
};

module.exports.getProducts = async (sort, filter, search) => {
  return await Product.find({
    ...filter,
    ...search,
  }).sort(sort);
};

module.exports.deleteProducts = async (selected) => {
  return await Product.deleteMany({ _id: selected });
};

module.exports.getProductsByIds = async (ids) => {
  return await Product.find({ _id: ids });
};

module.exports.getProductById = async (id) => {
  return await Product.findById(id);
};

module.exports.getByArticle = async (article) => {
  return await Product.findOne({ article });
};

module.exports.restoreProducts = async (products) => {
  const tmp = products.map((product) => {
    return product.toObject();
  });

  tmp.forEach((product) => {
    delete product._id;
  });

  const restoredProducts = tmp.map((product) => new Product(product));

  return await Promise.all(
    restoredProducts.map((resProduct) => resProduct.save())
  );
};

module.exports.toggleStatus = async (id, status) => {
  const prod = await Product.findById(id);
  prod.active = status;
  console.log(prod);
  return await prod.save();
};
