let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let UploadSchema = new Schema({
    id: String,
    user_id: { type: Schema.Types.ObjectId, ref: 'infected_users' },
    username: String,
    module_name: String,
    module_path: String,
    dependencies: String,        // Json array string of {module_name, module_path, module_type}
    processing_index: {
        type: Number,
        default: -1
    },
    upload_type: {          // Upload type: one - upload selected file only, all - upload selected file and all dependencies
        type: String,
        default: 'one'
    },
    failed_modules: String,
    status: {               // Upload status: 0 - waiting, 1 - uploading, 2 - uploaded, 3 - failed
        type: String,
        default: 0
    },
}, {
    timestamps: true
});

// event
UploadSchema.pre('save', function (next) {
    this.id = this._id.toString();
    next();
});

module.exports = mongoose.model('uploads', UploadSchema);
