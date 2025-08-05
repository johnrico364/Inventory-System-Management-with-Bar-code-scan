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
            .sort({ createdAt: -1 }); // Sort by newest first
        return res.status(200).json(transactions);
    } catch (error) {
        return res
        .status(500)
        .json({ message: "Error getting transactions", error: error.message });
    }
}

module.exports = {
    addTransaction,
    getTransactions
}