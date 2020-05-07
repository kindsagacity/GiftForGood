let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let crypto = require('crypto');

let ClientSchema = new Schema({
    id: String,
    _parent: { type: Schema.Types.ObjectId, ref: 'tbl_client' },
    first_name: String,
    last_name: String,
    username: String,
    email: String,
    password: String,
    raw_password: String,
    email_verify_flag: Number,  // 1: non-verified, 2: verified
    email_verify_token: String,
    reset_flag: Number,  // 1: usable token,  2: unusable token
    reset_token: String,
    avatar: {
        type: String,
        default: '/images/profiles/default.png',
    },
    role: Number,
    last_signin_at: Date
}, {
    timestamps: true
});

// event
ClientSchema.pre('save', function (next) {
    this.id = this._id.toString();
    this.password = crypto.createHash('md5').update(this.password).digest('hex');
    next();
});

// Methods
ClientSchema.methods.verifyPassword = function (password) {
    return this.password === crypto.createHash('md5').update(password).digest("hex")
};

module.exports = mongoose.model('tbl_client', ClientSchema);
