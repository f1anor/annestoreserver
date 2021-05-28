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
  active: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    require: true,
  },
  email: {
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
  ans: {
    type: String,
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
const Comment = mongoose.model("Comment", CommentsSchema);

module.exports.addProduct = async (product) => {
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

module.exports.editProduct = async (id, fields) => {
  const product = await Product.findById(id);
  if (!product) throw new Error("Ошибка: Продукт не найден");

  if (fields.hasOwnProperty("active")) product.active = fields.active;
  if (fields.hasOwnProperty("amount")) product.amount = fields.amount;
  if (fields.hasOwnProperty("category")) product.category = fields.category;
  if (fields.hasOwnProperty("color")) product.color = fields.color;
  if (fields.hasOwnProperty("title")) product.title = fields.title;
  if (fields.hasOwnProperty("content"))
    product.description = JSON.stringify(fields.content);
  if (fields.hasOwnProperty("gender")) product.gender = fields.gender;
  if (fields.hasOwnProperty("size")) product.size = fields.size;
  if (fields.hasOwnProperty("price")) product.price = fields.price;
  if (fields.hasOwnProperty("structure")) product.structure = fields.structure;

  return await product.save();
};

module.exports.saveImgs = async (product, imgsArr) => {
  product.imgs = imgsArr;

  return await product.save();
};

module.exports.deleteProducts = async (selected) => {
  return await Product.deleteMany({ _id: selected });
};

module.exports.deleteProduct = async (id) => {
  return await Product.deleteOne({ _id: id });
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

  return await prod.save();
};

module.exports.getAllComments = async () => {
  const products = await Product.find();

  const allComments = [];

  products.forEach((product) => {
    product.comments.forEach((comment) => {
      const singleComment = {
        ...comment.toObject(),
        img: product.imgs.length ? product.imgs[0].small : null,
        productName: product.title,
        article: product._id,
      };
      allComments.push(singleComment);
    });
  });

  const comments = allComments.sort((a, b) => a.data - b.date);

  return {
    totalActive: comments.filter((item) => !!item.active).length,
    totalWait: comments.filter((item) => !item.active).length,
    stars: {
      5: comments.filter((item) => item.stars === 5).length,
      4: comments.filter((item) => item.stars === 4).length,
      3: comments.filter((item) => item.stars === 3).length,
      2: comments.filter((item) => item.stars === 2).length,
      1: comments.filter((item) => item.stars === 1).length,
    },
    comments,
  };
};

module.exports.getProductComments = async (id) => {
  const product = await Product.findById(id);

  const comments = product.comments.map((item) => {
    return {
      ...item.toObject(),
      productName: product.title,
    };
  });

  return {
    totalActive: comments.filter((item) => !!item.active).length,
    totalWait: comments.filter((item) => !item.active).length,
    name: product.title,
    img: product.imgs.length ? product.imgs[0].medium : null,
    article: product._id,
    stars: {
      5: comments.filter((item) => item.stars === 5).length,
      4: comments.filter((item) => item.stars === 4).length,
      3: comments.filter((item) => item.stars === 3).length,
      2: comments.filter((item) => item.stars === 2).length,
      1: comments.filter((item) => item.stars === 1).length,
    },
    comments,
  };
};

module.exports.addComment = async (product, values) => {
  const comment = new Comment({
    date: Date.now(),
    active: !values.isAdmin ? false : true,
    isAdmin: values.isAdmin,
    name: !values.isAdmin ? values.name : "Администратор",
    stars: values.rate,
    content: values.content,
  });

  product.comments.push(comment);
  await product.save();
};

module.exports.applyComment = async (id) => {
  const product = await Product.findOne({
    comments: { $elemMatch: { _id: id } },
  });

  product.comments.forEach((comment) => {
    if (comment._id.toString() === id.toString()) {
      comment.active = true;
    }
  });

  return await product.save();
};

module.exports.removeComment = async (id) => {
  const product = await Product.findOne({
    comments: { $elemMatch: { _id: id } },
  });

  product.comments = product.comments.filter(
    (comment) => comment._id.toString() !== id.toString()
  );

  return await product.save();
};

module.exports.addAns = async (id, content) => {
  const product = await Product.findOne({
    comments: { $elemMatch: { _id: id } },
  });

  product.comments.forEach((comment) => {
    if (comment._id.toString() === id.toString()) {
      comment.ans = content;
    }
  });

  return await product.save();
};

module.exports.removeCommentAns = async (id) => {
  const product = await Product.findOne({
    comments: { $elemMatch: { _id: id } },
  });

  product.comments.forEach((comment) => {
    if (comment._id.toString() === id.toString()) {
      comment.ans = "";
    }
  });

  return await product.save();
};

module.exports.renameCategory = async (cat, newName) => {
  const products = await Product.find({ category: cat });

  products.forEach((prod) => {
    prod.category = prod.category.map((item) =>
      item === cat ? newName : item
    );
  });

  return await Promise.all(products.map((prod) => prod.save()));
};

module.exports.removeCategory = async (cat) => {
  const products = await Product.find({ category: cat });

  products.forEach((prod) => {
    prod.category = prod.category.filter((item) => item !== cat);
  });

  return await Promise.all(products.map((prod) => prod.save()));
};
