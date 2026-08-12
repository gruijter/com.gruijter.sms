/*
Copyright 2016 - 2026, Robin de Gruijter (gruijter@hotmail.com)

This file is part of com.gruijter.sms.

com.gruijter.sms is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

com.gruijter.sms is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with com.gruijter.sms.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

const Homey = require('homey');

const Logger = require('./lib/captureLogs');
const { resolveProvider, getCatalog } = require('./lib/providers');

class App extends Homey.App {

  onInit() {
    if (!this.logger) this.logger = new Logger({ name: 'log', length: 200, homey: this.homey });
    this.log('Send SMS app is running!');

    process.on('unhandledRejection', (error) => {
      this.error('unhandledRejection! ', error.message);
    });
    process.on('uncaughtException', (error) => {
      this.error('uncaughtException! ', error);
    });

    this.homey
      .on('unload', () => {
        this.log('app unload called');
        this.logger.saveLogs().catch(this.error);
      })
      .on('memwarn', () => {
        this.log('memwarn!');
      });

    this.registerFlowListeners();
  }

  // stuff for frontend API
  deleteLogs() {
    return this.logger.deleteLogs();
  }

  getLogs() {
    return this.logger.logArray;
  }

  testSMS(service) {
    this.log('sending test SMS from settings page');
    return this.sendSMS(service, service.toTest, service.testMessage);
  }

  getProviders() {
    return getCatalog(this.homey.__.bind(this.homey));
  }

  // ==============FLOW CARD STUFF======================================
  registerFlowListeners() {
    const sendSMS = this.homey.flow.getActionCard('send_sms');
    sendSMS.registerRunListener((args) => {
      const service = this.homey.settings.get('settings');
      return this.sendSMS(service, args.number, args.msg);
    });
  }

  // dispatch to the configured provider's adapter (see lib/providers.js)
  async sendSMS(service, number, msg) {
    try {
      this.log(`${service.provider.replace('https://', '').replace('http://', '')} to ${number}: ${msg}`);
      const send = resolveProvider(service.provider);
      const result = await send(service, number, msg);
      this.log(result);
      return result;
    } catch (error) {
      this.error(error.message);
      throw error;
    }
  }

}

module.exports = App;
