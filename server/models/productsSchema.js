const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const productSchema = new Schema(
  {
    name: { type: String, required: true },
    modelNumber: { type: String, required: true },
    barcode: { type: Number, required: true, unique: true },
    stocks: { type: Number, required: true },
    isDeleted: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
