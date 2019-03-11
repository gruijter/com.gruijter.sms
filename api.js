const Homey = require('homey');

module.exports = [
	{
		description: 'Test sending an SMS from frontend',
		method: 'POST',
		path: '/runTest/',
		fn: async function fn(args, callback) {
			const result = await Homey.app.testSMS(args.body);
			if (result instanceof Error) {
				callback(result);
				return;
			}
			callback(null, result);
		},
	},
	{
		description: 'Show loglines',
		method: 'GET',
		path: '/getlogs/',
		requires_authorization: true,
		role: 'owner',
		fn: function fn(args, callback) {
			const result = Homey.app.getLogs();
			callback(null, result);
		},
	},
	{
		description: 'Delete logs',
		method: 'GET',
		path: '/deletelogs/',
		requires_authorization: true,
		role: 'owner',
		fn: function fn(args, callback) {
			const result = Homey.app.deleteLogs();
			callback(null, result);
		},
	},
];
