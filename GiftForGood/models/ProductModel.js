let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let ProductSchema = new Schema({
    // _collection: { type: Schema.Types.ObjectId, ref: 'tbl_collection' },
    Title: String,
    "Image Src": String,
    "Variant Price": Number,
    "Body (HTML)": String,
    "SEO Description": String,
    "Option1 Name" : String,
    "Option1 Value" : String,
    "Option2 Name" : String,
    "Option2 Value" : String,
    "Option3 Name" : String,
    "Option3 Value" : String,
    "Google Shopping / Custom Label 0": String,
    "Google Shopping / Custom Label 1": String,
    "Google Shopping / Custom Label 3": String,
});

module.exports = mongoose.model('tbl_product', ProductSchema);

