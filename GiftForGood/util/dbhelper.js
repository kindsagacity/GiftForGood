
let config = require('../config')();
let UserModel = require('../models/UserModel');

module.exports = {
	initialize: async function () {
		let dev_user = await UserModel.findOne({email: 'dev@dev.com'});
		if (!dev_user) {
			let dev_item = new UserModel({
				username: config.dev_info.name,
				email: config.dev_info.email,
				password: config.dev_info.password,
				online_state: false,
				email_verify_flag: 2,
				phone_verify_flag: 2,
				reset_flag: 2,
				role: 0,
			});
			await dev_item.save();
		}

		let admin = await UserModel.findOne({email: 'admin@admin.com'});
		if (!admin) {
			let admin_item = new UserModel({
				username: config.admin_info.name,
				email: config.admin_info.email,
				password: config.admin_info.password,
				online_state: false,
				email_verify_flag: 2,
				phone_verify_flag: 2,
				reset_flag: 2,
				role: 1,
			});
			await admin_item.save();
		}

		let user = await UserModel.findOne({email: 'user@user.com'});
		if (!user) {
			let user_item = new UserModel({
				username: config.user_info.name,
				email: config.user_info.email,
				password: config.user_info.password,
				online_state: false,
				email_verify_flag: 2,
				phone_verify_flag: 2,
				reset_flag: 2,
				role: 2,
			});
			await user_item.save();
		}
	}
};
