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

const getProducts = async (req, res) => {
    try {
        const products = await Product.find({isDeleted: false});
        return res.status(200).json(products);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching products", error: error.message });
    }
}

const updateProduct = async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
        await Product.findByIdAndUpdate(id, data);
        return res.status(200).json({ message: "Product updated successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Error updating product", error: error.message });
    }
}

const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await Product.findByIdAndUpdate(id, { isDeleted: true });
        return res.status(200).json({ message: "Product deleted successfully" });
    }catch(error){
        return res.status(500).json({ message: "Error deleting product", error: error.message });
    }
}

module.exports = {
    addProduct,
    getProducts,
    updateProduct,
    deleteProduct
};