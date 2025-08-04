const Product = require("../models/productsSchema");

const addProduct = async (req, res) => {
    const data = req.body;

    try {
        const newProduct = await Product.create(data)

        return res.status(200).json(newProduct);
    } catch (error) {
        return res.status(500).json({ message: "Error adding product", error: error.message });
    }
}

module.exports = {
    addProduct
};