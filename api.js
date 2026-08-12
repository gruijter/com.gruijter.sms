'use strict';

module.exports = {
  // retrieve logs
  async getLogs({ homey }) {
    return homey.app.getLogs();
  },
  // delete logs
  async deleteLogs({ homey }) {
    return homey.app.deleteLogs();
  },
  // send test SMS from frontend
  async testSMS({ homey, body }) {
    return homey.app.testSMS(body);
  },
  // provider list for the settings page
  async getProviders({ homey }) {
    return homey.app.getProviders();
  },
};
