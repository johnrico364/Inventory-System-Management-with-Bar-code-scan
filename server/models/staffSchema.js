const mongoose = require('mongoose');

const Schema = mongoose.Schema

const staffSchema = new Schema(
    {
        name: { type: String, required: true },
        idAdmin: { type: Boolean, required: true },
    },
    {
        timestamps: true,
    }
);