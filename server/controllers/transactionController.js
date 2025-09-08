const Transaction = require("../models/transactionSchema");

const addTransaction = async (req, res) => {
  const data = req.body;
  try {
    const newTransaction = await Transaction.create(data);
    return res.status(200).json(newTransaction);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error adding transaction", error: error.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("product")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(transactions);
  } catch (error) {
    console.error("Transaction fetch error:", error);
    return res.status(500).json({
      message: "Error getting transactions",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Hidden route for testing purposes
const deleteTransaction = async (req, res) => {
  const { id } = req.params;
  try {
    const transaction = await Transaction.findByIdAndDelete(id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    return res
      .status(200)
      .json({ message: "Transaction deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting transaction", error: error.message });
  }
};

module.exports = {
  addTransaction,
  getTransactions,

  deleteTransaction, // Hidden route for testing purposes
};
