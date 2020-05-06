let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let CollectionSchema = new Schema({
    _client: { type: Schema.Types.ObjectId, ref: 'tbl_client' },
    title: String,
    _products: [{ type: Schema.Types.ObjectId, ref: 'tbl_product' }]
}, {
    timestamps: true
});

module.exports = mongoose.model('tbl_collection', CollectionSchema);
