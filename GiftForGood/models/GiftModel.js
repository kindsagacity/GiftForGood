let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let GiftSchema = new Schema({
    _products: [{ type: Schema.Types.ObjectId, ref: 'tbl_product' }],
    _sender: { type: Schema.Types.ObjectId, ref: 'tbl_client' },
    _chosen: { type: Schema.Types.ObjectId, ref: 'tbl_product' },
    rec_first_name: String,
    rec_last_name: String,
    rec_company_name: String,
    rec_email: String,
    rec_phone: String,
    rec_address: String,
    rec_apartment: String,
    rec_city: String,
    rec_state: String,
    rec_zip_code: String,
    step: String,
    email_message: String,
    email_video: String,
    email_logo: String,
    email_banner: String,
    thank_note: String
});

module.exports = mongoose.model('tbl_gift', GiftSchema);

