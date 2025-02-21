const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ✅ user вместо userId
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
      },
    ],
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ["pending", "completed", "cancelled"], default: "pending" },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, status: 1 }); // ✅ user вместо userId

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
