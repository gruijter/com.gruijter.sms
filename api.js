module.exports = {
	// retrieve logs
	async getLogs({ homey }) {
		const result = await homey.app.getLogs();
		return result;
	},
	// delete logs
	async deleteLogs({ homey }) {
		const result = await homey.app.deleteLogs();
		return result;
	},
	// send test SMS from frontend
	async testSMS({ homey, body }) {
		const result = await homey.app.testSMS(body);
		return result;
	},
};
