let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let crypto = require('crypto');

let CustomerSchema = new Schema({
    _client: { type: Schema.Types.ObjectId, ref: 'tbl_client' },
    avatar: String,
    first_name: String,
    last_name: String,
    email: String,
    address: String,
    phone: String,
    job: String,
    last_signin_at: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('tbl_customer', CustomerSchema);
