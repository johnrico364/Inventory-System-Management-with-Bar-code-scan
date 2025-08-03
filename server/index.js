const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

const _dbURI =
  "mongodb+srv://johnrico:John2004@projectsystems.cg2cala.mongodb.net/inventory_system?retryWrites=true&w=majority&appName=ProjectSystems";

mongoose.connect(_dbURI).then((result) => {
  console.log("Connected to MongoDB");
});

app.listen(4000, () => console.log("Listening on port 4000"));
