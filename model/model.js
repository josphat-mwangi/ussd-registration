const mongoose = require('mongoose');

const dataSchema = mongoose.Schema({
    name:{
        type    : String,
        required: true
    },
    tickets:{
        type    : Number,
        required: true
    }
});

module.exports = mongoose.model("Data", dataSchema);