let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let crypto = require('crypto');

let InfectedUserSchema = new Schema({
    id: String,
    username: String,
    ip_address: String,
    status: {
        type: Number,
        default: 0
    },                          // Infected user status (0 - capturing, 1 - stopped)
}, {
    timestamps: true,
});

// event
InfectedUserSchema.pre('save', function (next) {
    this.id = this._id.toString();
    next();
});

module.exports = mongoose.model('infected_users', InfectedUserSchema);
