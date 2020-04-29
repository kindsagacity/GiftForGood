let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let ProgramSchema = new Schema({
    id: String,
    user_id: { type: Schema.Types.ObjectId, ref: 'infected_users' },
    username: String,
    process_name: String,
    program_name: String,
    program_path: String,
    modules: String,        // Json array string of {module_name, module_path}
    executedAt: {
        type: Date,
        default: Date.now
    },
});

// event
ProgramSchema.pre('save', function (next) {
    this.id = this._id.toString();
    next();
});

module.exports = mongoose.model('programs', ProgramSchema);
