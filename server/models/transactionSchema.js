const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const transactionSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    action: {
      type: String, 
      required: true,
      enum: ['Stock in', 'Stock out', 'Product Update']
    },
    previousStock: { type: Number, required: true },
    currentStock: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);
