/*
Copyright 2016 - 2021, Robin de Gruijter (gruijter@hotmail.com)

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
const http = require('http');
const https = require('https');
const qs = require('querystring');
const Logger = require('./captureLogs.js');
// const util = require('util');

class App extends Homey.App {

	onInit() {
		process.env.LOG_LEVEL = 'info'; // info or debug
		if (!this.logger) this.logger = new Logger({ name: 'log', length: 200, homey: this.homey });
		this.log('Send SMS app is running!');
		// register some listeners
		process.on('unhandledRejection', (error) => {
			this.error('unhandledRejection! ', error.message);
		});
		process.on('uncaughtException', (error) => {
			this.error('uncaughtException! ', error);
		});
		this.homey
			.on('unload', async () => {
				this.log('app unload called');
				// save logs to persistant storage
				await this.logger.saveLogs();
			})
			.on('memwarn', () => {
				this.log('memwarn!');
			});
		this.registerFlowListeners();

	}

	//  stuff for frontend API
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

	// ==============FLOW CARD STUFF======================================
	registerFlowListeners() {
		// action cards
		const sendSMS = this.homey.flow.getActionCard('send_sms');
		sendSMS.registerRunListener(async (args) => {
			const service = this.homey.settings.get('settings');
			const result = await this.sendSMS(service, args.number, args.msg);
			return Promise.resolve(result);
		});
	}

	// sms functions and services
	async sendSMS(service, number, msg) {
		// this.log('sending SMS initiated');
		try {
			this.log(`${service.provider.replace('https://', '')} to ${number}: ${msg}`);
			let result = null;
			switch (service.provider) {
				case 'https://mobile.free.fr':	// provider is messagebird
					result = await this.freeMobile(service, number, msg);
					break;
				case 'https://www.messagebird.com':	// provider is messagebird
					result = await this.messagebird(service, number, msg);
					break;
				case 'https://46elks.com':	// provider is 46Elks
					result = await this._46Elks(service, number, msg);
					break;
				case 'https://textbelt.com/':	// provider is textbelt
					result = await this.textBelt(service, number, msg);
					break;
				case 'https://www.bulksms.com':	// provider is bulksms
					result = await this.bulkSms(service, number, msg);
					break;
				case 'https://api.clickatell.com':	// provider is clickatell
					result = await this.clickatell(service, number, msg);
					break;
				case 'http://www.targetsms.nl':	// provider is targetsms
					result = await this.targetSms(service, number, msg);
					break;
				case 'https://api.spryngsms.com':	// provider is Spryng
					result = await this.spryngSms(service, number, msg);
					break;
				case 'https://api.twilio.com':	// provider is Twilio
					result = await this.twilio(service, number, msg);
					break;
				case 'https://sgw01.cm.nl':	// provider is cm.nl
					result = await this.cm(service, number, msg);
					break;
				case 'https://json.aspsms.com':	// provider is aspSMS
					result = await this.aspSms(service, number, msg);
					break;
				case 'https://www.sendinblue.com':	// provider is sendinblue
					result = await this.sendinblue(service, number, msg);
					break;
				case 'https://gatewayapi.com':	// provider is gatewayapi
					result = await this.gatewayapi(service, number, msg);
					break;
				default:	// provider is a dellMont brand
					result = await this.dellMont(service, number, msg);
			}
			this.log(result);
			return Promise.resolve(result);
		} catch (error) {
			this.error(error.message);
			return Promise.reject(error);
		}
	}

	async gatewayapi(service, number, msg) {
		// this.log('gatewayapi sending SMS to', number);
		try {
			const headers = {
				'Cache-Control': 'no-cache',
			};
			const query = {
				token: service.apiid,
				sender: service.from,
				'recipients.0.msisdn': number,
				message: msg,
			};
			const options = {
				hostname: 'gatewayapi.com',
				path: `/rest/mtsms?${qs.stringify(query)}`,
				headers,
				method: 'GET',
			};
			const result = await this._makeHttpsRequest(options, '');
			if (result.statusCode !== 200) {
				throw Error(`${result.statusCode}: ${result.body.substr(0, 250)}`);
			}
			const response = JSON.parse(result.body);
			if (!response.ids) {
				throw Error(response);
			}
			return Promise.resolve(JSON.stringify(response));
		} catch (error) {
			return Promise.reject(error);
		}
	}

	async freeMobile(service, number, msg) {
		// console.log('freeMobile.fr sending SMS to', number);
		try {
			const query = {
				user: service.username,
				pass: service.password,
				to: number,
				msg,
			};
			const headers = {
				'Content-Length': 0,
			};
			const options = {
				hostname: 'smsapi.free-mobile.fr',
				path: `/sendmsg?${qs.stringify(query)}`,
				headers,
				method: 'GET',
			};
			const result = await this._makeHttpsRequest(options, '');
			if (result.statusCode !== 200 || result.statusCode !== 201) {
				throw Error(`error: ${result.statusCode} ${result.body.substr(0, 20)}`);
			}
			// if (result.body.substr(0, 4) !== 'ID: ') {
			// 	throw Error(result.body);
			// }
			return Promise.resolve(result.body);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	async sendinblue(service, number, msg) {
		// this.log('sendinblue sending SMS to', number);
		try {
			const headers = {
				'Content-Type': 'application/json',
				accept: 'application/json',
				'Cache-Control': 'no-cache',
				'api-key': service.apiid,
			};
			const options = {
				hostname: 'api.sendinblue.com',
				path: '/v3/transactionalSMS/sms',
				headers,
				method: 'POST',
			};
			const postData = {
				type: 'transactional',
				sender: service.from,
				recipient: number,
				content: msg,
			};
			const result = await this._makeHttpsRequest(options, JSON.stringify(postData));
			if (result.statusCode !== 200 && result.statusCode !== 201) {
				throw Error(`${result.statusCode}: ${result.body.substr(0, 250)}`);
			}
			const response = JSON.parse(result.body);
			if (!response.messageId) {
				throw Error(response);
			}
			return Promise.resolve(JSON.stringify(response));
		} catch (error) {
			return Promise.reject(error);
		}
	}

	async messagebird(service, number, msg) {
		// this.log('messagebird sending SMS to', number);
		try {
			const headers = {
				'Content-Type': 'application/json',
				'Cache-Control': 'no-cache',
			};
			const options = {
				hostname: 'rest.messagebird.com',
				path: '/messages',
				headers,
				auth: `AccessKey:${service.apiid}`,
				method: 'POST',
			};
			const postData = {
				originator: service.from,
				recipients: [number],
				body: msg,
			};
			const result = await this._makeHttpsRequest(options, JSON.stringify(postData));
			if (result.statusCode !== 200 && result.statusCode !== 201) {
				throw Error(`${result.statusCode}: ${result.body.substr(0, 250)}`);
			}
			const messagebirdStatus = JSON.parse(result.body);
			if (!messagebirdStatus.id || !messagebirdStatus.recipients || !messagebirdStatus.recipients.items
				|| !messagebirdStatus.recipients.items[0] || messagebirdStatus.recipients.items[0].status !== 'sent') {
				throw Error(messagebirdStatus);
			}
			return Promise.resolve(JSON.stringify(messagebirdStatus));
		} catch (error) {
			return Promise.reject(error);
		}
	}

	async _46Elks(service, number, msg) {
		// this.log('24Elks sending SMS to', number);
		try {
			const postData = qs.stringify({
				from: service.from,
				to: number,
				message: msg,
			});
			const headers = {
				'Content-Type': 'application/x-www-form-urlencoded', // 'application/json'
				'Cache-Control': 'no-cache',
				'Content-Length': Buffer.byteLength(postData),
				// Authorization: 'Basic ' + Buffer.from(service.username + ":" + service.password).toString('base64'),
			};
			const options = {
				hostname: 'api.46elks.com',
				path: '/a1/sms',
				headers,
				auth: `${service.username}:${service.password}`,
				method: 'POST',
			};
			const result = await this._makeHttpsRequest(options, postData);
			if (result.statusCode !== 200) {
				throw Error(`${result.statusCode}: ${result.body.substr(0, 250)}`);
			}
			const _46ElksStatus = JSON.parse(result.body);
			if (!_46ElksStatus.status || _46ElksStatus.status === 'failed') {
				throw Error(_46ElksStatus);
			}
			return Promise.resolve(JSON.stringify(_46ElksStatus));
		} catch (error) {
			return Promise.reject(error);
		}
	}

	async bulkSms(service, number, msg) {
		// this.log('bulkSMS sending SMS to', number);
		try {
			const headers = {
				'Content-Type': 'application/json', // deprecated: application/x-www-form-urlencoded',
				'Cache-Control': 'no-cache',
				'auto-unicode': true,
			};
			const options = {
				hostname: 'api.bulksms.com',
				path: '/v1/messages',
				headers,
				auth: `${service.username}:${service.password}`,
				method: 'POST',
			};
			const postData = {
				body: msg,
				to: number,
			};
			if (service.from && service.from.length > 0) postData.from = service.from;
			const result = await this._makeHttpsRequest(options, JSON.stringify(postData));
			if (result.statusCode !== 200 && result.statusCode !== 201) {
				throw Error(`${result.statusCode}: ${result.body}`);
			}
			const body = JSON.parse(result.body);
			if (!body[0] || body[0].status.subtype) {
				throw Error(result.body);
			}
			return Promise.resolve(body);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	async textBelt(service, number, msg) {
		// this.log('textBelt sending SMS to', number);
		try {
			const headers = {
				'Content-Type': 'application/json',
				'Cache-Control': 'no-cache',
			};
			const options = {
				hostname: 'textbelt.com',
				path: '/text',
				headers,
				method: 'POST',
			};
			const postData = {
				phone: number,
				message: msg,
				key: service.apiid,
			};
			const result = await this._makeHttpsRequest(options, JSON.stringify(postData));
			if (result.statusCode !== 200) {
				throw Error(`${result.statusCode}: ${result.body}`);
			}
			const textbeltStatus = JSON.parse(result.body);
			if (!textbeltStatus.success) {
				throw Error(JSON.stringify(textbeltStatus));
			}
			return Promise.resolve(JSON.stringify(textbeltStatus));
		} catch (error) {
			return Promise.reject(error);
		}
	}

	async clickatell(service, number, msg) {
		// this.log('clickatell sending SMS to', number);
		try {
			const query = {
				user: service.username,
				password: service.password,
				apiid: service.apiid,
				to: number,
				text: msg,
				from: service.from,
			};
			const headers = {
				'Content-Length': 0,
			};
			const options = {
				hostname: 'api.clickatell.com',
				path: `/http/sendmsg?${qs.stringify(query)}`,
				headers,
				method: 'GET',
			};
			const result = await this._makeHttpsRequest(options, '');
			if (result.statusCode !== 200) {
				throw Error(`error: ${result.statusCode} ${result.body.substr(0, 20)}`);
			}
			if (result.body.substr(0, 4) !== 'ID: ') {
				throw Error(result.body);
			}
			return Promise.resolve(result.body);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	async targetSms(service, number, msg) {
		// this.log('targetSms sending SMS to', number);
		try {
			const query = {
				username: service.username,
				handle: service.apiid,
				aff: service.password,
				soort: 'sms',
				originator: service.from,
				to: number,
				message: msg,
			};
			const headers = {
				'Content-Length': 0,
			};
			const options = {
				hostname: 'www.targetsms.nl',
				path: `/service/sendsms?${qs.stringify(query)}`,
				headers,
				method: 'GET',
			};
			const result = await this._makeHttpRequest(options, '');
			if (result.statusCode !== 200) {
				throw Error(`error: ${result.statusCode} ${result.body.substr(0, 20)}`);
			}
			if (result.body.substr(0, 5) !== '45000') {
				let err = '';
				switch (result.body.substr(0, 5)) {
					case '45001':
						err = 'Recipient incorrect (check the to-field)';
						break;
					case '45002':
						err = 'Message to long, absent or contains illegal characters';
						break;
					case '45003':
						err = 'Destination is blocked by smsinfofilter';
						break;
					case '45004':
						err = 'Destination is blocked by STOP message';
						break;
					case '45005':
						err = 'Last MO message is expired';
						break;
					case '45011':
						err = 'Incorrect or no affiliate ID (check Password/id)';
						break;
					case '45012':
						err = 'Incorrect originator';
						break;
					case '45019':
						err = 'Not allowed to send Normal SMS';
						break;
					case '45020':
						err = 'Message and URL combined are too long';
						break;
					case '45021':
						err = 'No URL given (check url)';
						break;
					case '45025':
						err = 'Incorrect filetype for recipient list';
						break;
					case '45045':
						err = 'Server down, please try again later';
						break;
					case '50010':
						err = 'No SMS credits or credit has expired';
						break;
					default:
						err = `Unkown error ${result.body.substr(0, 30)}`;
				}
				throw Error(err);
			}
			return Promise.resolve(result.body);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	async spryngSms(service, number, msg) {
		// this.log('spryngSms sending SMS to', number);
		try {
			const query = {
				USERNAME: service.username,
				PASSWORD: service.password,
				SENDER: service.from,
				DESTINATION: number,
				BODY: msg,
			};
			const headers = {
				'Content-Length': 0,
			};
			const options = {
				hostname: 'api.spryngsms.com',
				path: `/api/send.php?${qs.stringify(query)}`,
				headers,
				method: 'GET',
			};
			const result = await this._makeHttpsRequest(options, '');
			if (result.statusCode !== 200) {
				throw Error(`error: ${result.statusCode} ${result.body.substr(0, 20)}`);
			}
			if (result.body.substr(0, 3) !== '1') {
				let err = '';
				switch (result.body.substr(0, 5)) {
					case '100':
						err = 'Missing parameter';
						break;
					case '101':
						err = 'Username too short';
						break;
					case '102':
						err = 'Username too long';
						break;
					case '103':
						err = 'Password too short';
						break;
					case '104':
						err = '	Password too long';
						break;
					case '105':
						err = 'Destination too short, use number format: 31641041106';
						break;
					case '106':
						err = 'Destination too long, use number format: 31641041106';
						break;
					case '107':
						err = 'Sender too short, use number format: 0031641041106';
						break;
					case '108':
						err = 'Sender too long, use number format: 0031641041106';
						break;
					case '109':
						err = 'Body too long';
						break;
					case '110':
						err = 'Body too short';
						break;
					case '200':
						err = 'Security error';
						break;
					case '201':
						err = 'Unknown route';
						break;
					case '202':
						err = '	Route access violation';
						break;
					case '203':
						err = '	Insufficient credits';
						break;
					case '800':
						err = 'Technical error';
						break;
					default:
						err = `Unkown error ${result.body.substr(0, 30)}`;
				}
				throw Error(err);
			}
			return Promise.resolve(result.body);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	async twilio(service, number, msg) {
		// this.log('Twilio sending SMS to', number);
		try {
			const regexStatus = new RegExp(/<Status>(.*)<\/Status>/);
			const regexMessage = new RegExp(/<Message>(.*)<\/Message>/);
			const accountSid = service.apiid;
			const authToken = service.password;
			const headers = {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Cache-Control': 'no-cache',
			};
			const options = {
				hostname: 'api.twilio.com',
				path: `/2010-04-01/Accounts/${accountSid}/Messages`,
				headers,
				method: 'POST',
				auth: `${accountSid}:${authToken}`,
			};
			const postData = {
				To: number,
				From: service.from,
				Body: msg,
			};
			const result = await this._makeHttpsRequest(options, qs.stringify(postData));
			const twilioStatus = regexStatus.exec(result.body)[1];
			const twilioMessage = regexMessage.exec(result.body)[1];
			if (result.statusCode !== 201) {
				throw Error(`${result.statusCode}: ${twilioMessage}`);
			}
			if (twilioStatus !== 'queued') {
				throw Error(twilioMessage);
			}
			return Promise.resolve(twilioStatus);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	async cm(service, number, msg) {
		// this.log('cm sending SMS to', number);
		try {
			const query = {
				producttoken: service.apiid,
				body: msg,
				to: number,
				username: service.username,
				from: service.from,
			};
			const headers = {
				'Content-Length': 0,
			};
			const options = {
				hostname: 'sgw01.cm.nl',
				path: `/gateway.ashx?${qs.stringify(query)}`,
				headers,
				method: 'GET',
			};
			const result = await this._makeHttpsRequest(options, '');
			if ((result.statusCode !== 200) || (result.body !== '')) {
				throw Error(`error: ${result.statusCode}: ${result.body.substr(0, 20)}`);
			}
			return Promise.resolve(result.body);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	async aspSms(service, number, msg) {
		// this.log('aspSMS sending SMS to', number);
		try {
			const headers = {
				'Content-Type': 'application/json',
				'Cache-Control': 'no-cache',
			};
			const options = {
				hostname: 'json.aspsms.com',
				path: '/SendSimpleTextSMS',
				headers,
				method: 'POST',
			};
			const postData = {
				UserName: service.apiid,
				Password: service.password,
				Originator: service.from,
				Recipients: [number],
				MessageText: msg,
				ForceGSM7bit: false,
			};
			const result = await this._makeHttpsRequest(options, JSON.stringify(postData));
			if (result.statusCode !== 200) {
				throw Error(`${result.statusCode}: ${result.body.substr(0, 20)}`);
			}
			const aspSmsStatus = JSON.parse(result.body);
			if (aspSmsStatus.StatusCode !== '1') {
				throw Error(JSON.stringify(aspSmsStatus));
			}
			return Promise.resolve(JSON.stringify(aspSmsStatus));
		} catch (error) {
			return Promise.reject(error);
		}
	}

	async dellMont(service, number, msg) {
		// this.log('DellMont sending SMS to', number);
		try {
			const regexResult = new RegExp(/<result>(.*)<\/result>/);
			const regexDescription = new RegExp(/<description>(.*)<\/description>/);
			const query = {
				username: service.username,
				password: service.password,
				from: service.from,
				to: number,
				text: msg,
			};
			const headers = {
				'Content-Length': 0,
			};
			const options = {
				hostname: service.url.replace('https://', ''),
				path: `/myaccount/sendsms.php?${qs.stringify(query)}`,
				headers,
				method: 'GET',
			};
			const result = await this._makeHttpsRequest(options, '');
			if (result.statusCode !== 200) {
				throw Error(`error: ${result.statusCode}: ${result.body.substr(0, 20)}`);
			}
			const dellmontResult = regexResult.exec(result.body)[1];
			const dellmontDescription = regexDescription.exec(result.body)[1];
			if (dellmontResult !== '1') {
				throw Error(dellmontDescription);
			}
			return Promise.resolve(dellmontDescription);
		} catch (error) {
			return Promise.reject(error);
		}

	}

	_makeHttpsRequest(options, postData, timeout) {
		return new Promise((resolve, reject) => {
			const opts = options;
			opts.timeout = timeout || 40000;
			const req = https.request(opts, (res) => {
				let resBody = '';
				res.on('data', (chunk) => {
					resBody += chunk;
				});
				res.once('end', () => {
					if (!res.complete) {
						this.error('The connection was terminated while the message was still being sent');
						return reject(Error('The connection was terminated while the message was still being sent'));
					}
					res.body = resBody;
					return resolve(res); // resolve the request
				});
			});
			req.on('error', (e) => {
				req.destroy();
				this.error(e);
				return reject(e);
			});
			req.on('timeout', () => {
				req.destroy();
			});
			// req.write(postData);
			req.end(postData);
		});
	}

	_makeHttpRequest(options, postData, timeout) {
		return new Promise((resolve, reject) => {
			const opts = options;
			opts.timeout = timeout || 40000;
			const req = http.request(opts, (res) => {
				let resBody = '';
				res.on('data', (chunk) => {
					resBody += chunk;
				});
				res.once('end', () => {
					if (!res.complete) {
						this.error('The connection was terminated while the message was still being sent');
						return reject(Error('The connection was terminated while the message was still being sent'));
					}
					res.body = resBody;
					return resolve(res); // resolve the request
				});
			});
			req.on('error', (e) => {
				req.destroy();
				this.error(e);
				return reject(e);
			});
			req.on('timeout', () => {
				req.destroy();
			});
			// req.write(postData);
			req.end(postData);
		});
	}

}

module.exports = App;
