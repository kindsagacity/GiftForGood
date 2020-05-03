let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let crypto = require('crypto');

let CustomerSchema = new Schema({
    id: String,
    first_name: String,
    last_name: String,
    address: String,
    company_name: String,
    apartment: String,
    city: String,
    state: String,
    zip_code: String,
    email: String,
    phone: String
});

module.exports = mongoose.model('tbl_customer', CustomerSchema);
