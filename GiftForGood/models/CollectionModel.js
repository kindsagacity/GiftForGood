let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let CollectionSchema = new Schema({
    id: String,
    title: String
});

module.exports = mongoose.model('tbl_collection', CollectionSchema);
