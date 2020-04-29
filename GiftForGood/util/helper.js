
module.exports = {
	json2Base64: function (json_obj) {
		let buffer = new Buffer(JSON.stringify(json_obj));
		return buffer.toString('base64');
	},
	base642Json: function (base64_encoded) {
		const base64_decoded = Buffer.from(base64_encoded, 'base64');
		return JSON.parse(base64_decoded.toString('utf-8'));
	},
	base64_decode: function (base64_encoded) {
		const base64_decoded = Buffer.from(base64_encoded, 'base64');
		return base64_decoded.toString('utf-8');
	},

	genRandom: function (length) {
		let result           = '';
		let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let charactersLength = characters.length;
		for ( let i = 0; i < length; i++ ) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		result += Date.now();
		return result;
	}
};
