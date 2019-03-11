/*
Copyright 2016 - 2019, Robin de Gruijter (gruijter@hotmail.com)

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

class SendSMSApp extends Homey.App {

	onInit() {
		this.log('Send SMS app is running!');
		this.logger = new Logger('log', 200);
		// register some listeners
		process.on('unhandledRejection', (error) => {
			this.error('unhandledRejection! ', error);
		});
		process.on('uncaughtException', (error) => {
			this.error('uncaughtException! ', error);
		});
		Homey
			.on('unload', () => {
				this.log('app unload called');
				// save logs to persistant storage
				this.logger.saveLogs();
			})
			.on('memwarn', () => {
				this.log('memwarn!');
			});
		// ==============FLOW CARD STUFF======================================
		const sendSMS = new Homey.FlowCardAction('send_sms');
		sendSMS
			.register()
			.registerRunListener(async (args) => {
				const service = Homey.ManagerSettings.get('settings');
				const result = await this.sendSMS(service, args.number, args.msg);
				return Promise.resolve(result);
			});
	}

	//  stuff for frontend API
	deleteLogs() {
		return this.logger.deleteLogs();
	}

	getLogs() {
		return this.logger.logArray;
	}

	async testSMS(service) {
		this.log('sending test SMS from settings page');
		try {
			const result = await this.sendSMS(service, service.toTest, service.testMessage);
			return result;
		} catch (error) {
			return error;
		}
	}

	// sms functions and services
	async sendSMS(service, number, msg) {
		// this.log('sending SMS initiated');
		try {
			this.log(`${service.provider.replace('https://', '')} to ${number}: ${msg}`);
			let result = null;
			switch (service.provider) {
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
				default:	// provider is a dellMont brand
					result = await this.dellMont(service, number, msg);
			}
			this.log(result);
			return Promise.resolve(result);
		} catch (error) {
			this.log(error);
			return Promise.reject(error);
		}
	}

	async _46Elks(service, number, msg) {
		// this.log('24Elks sending SMS to', number);
		try {
			const headers = {
				'Content-Type': 'application/json',
				'Cache-Control': 'no-cache',
			};
			const options = {
				hostname: 'api.46elks.com',
				path: '/a1/SMS',
				headers,
				auth: `${service.username}:${service.password}`,
				method: 'POST',
			};
			const postData = {
				from: service.from,
				to: number,
				message: msg,
			};
			const result = await this._makeHttpsRequest(options, JSON.stringify(postData));
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
				'Content-Type': 'application/x-www-form-urlencoded',
				'Cache-Control': 'no-cache',
			};
			const options = {
				hostname: 'bulksms.vsms.net', // 'bulksms.2way.co.za',
				// port: 5567,
				path: '/eapi/submission/send_sms/2/2.0',
				headers,
				method: 'POST',
			};
			const postData = {
				username: service.username,
				password: service.password,
				message: msg,
				msisdn: number,
				// sender: service.from,
			};
			const result = await this._makeHttpsRequest(options, qs.stringify(postData));
			if (result.statusCode !== 200) {
				throw Error(`${result.statusCode}: ${result.body}`);
			}
			if (result.body[0] !== '0') {
				throw Error(result.body);
			}
			return Promise.resolve(result.body);
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
				key: service.api_id,
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
				api_id: service.api_id,
				to: number,
				text: msg,
				from: service.from,
			};
			const headers = {
				'Content-Length': 0,
			};
			const options = {
				hostname: service.url.replace('https://', ''),
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
				handle: service.api_id,
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
				hostname: service.url.replace('http://', ''),
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

	// smsGatewayMe(service, number, msg) {
	// 	// this.log('smsGateway sending SMS to', number);
	// 	return new Promise(async (resolve, reject) => {
	// 		try {
	// 			const postData = [
	// 				{
	// 					phone_number: number,
	// 					message: msg,
	// 					device_id: service.from,
	// 				},
	// 			];
	// 			const headers = {
	// 				'Content-Type': 'application/json',
	// 				Authorization: service.api_id,
	// 				'Cache-Control': 'no-cache',
	// 			};
	// 			const options = {
	// 				hostname: 'smsgateway.me',
	// 				path: '/api/v4/message/send',
	// 				headers,
	// 				method: 'POST',
	// 			};
	// 			const result = await this._makeHttpsRequest(options, JSON.stringify(postData));
	// 			if ((result.statusCode !== 200)) {
	// 				// this.error(result.statusCode, result.body);
	// 				return reject(Error(`error: ${result.statusCode} ${result.body.substr(0, 100)}`));
	// 			}
	// 			const smsGatewayResponse = JSON.parse(result.body);
	// 			// this.log(util.inspect(smsGatewayResponse, { depth: null }));
	// 			if (smsGatewayResponse.status) { // === 'fail') {
	// 				return reject(Error(`error: ${smsGatewayResponse.message}`));
	// 			}
	// 			return resolve(smsGatewayResponse[0].status);
	// 		} catch (error) {
	// 			// this.error(error);
	// 			return reject(error);
	// 		}
	// 	});
	// }

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
				hostname: service.url.replace('https://', ''),
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
			const accountSid = service.api_id;
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
				producttoken: service.api_id,
				body: msg,
				to: number,
				username: service.username,
				from: service.from,
			};
			const headers = {
				'Content-Length': 0,
			};
			const options = {
				hostname: service.url.replace('https://', ''),
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
				UserName: service.api_id,
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

	_makeHttpsRequest(options, postData) {
		return new Promise((resolve, reject) => {
			const req = https.request(options, (res) => {
				let resBody = '';
				res.on('data', (chunk) => {
					resBody += chunk;
				});
				res.on('end', () => {
					res.body = resBody;
					return resolve(res); // resolve the request
				});
			});
			req.on('error', (e) => {
				this.log(e);
				reject(e);
			});
			req.setTimeout(50000, () => {
				req.abort();
				reject(Error('Connection timeout'));
			});
			req.write(postData);
			req.end();
		});
	}

	_makeHttpRequest(options, postData) {
		return new Promise((resolve, reject) => {
			const req = http.request(options, (res) => {
				let resBody = '';
				res.on('data', (chunk) => {
					resBody += chunk;
				});
				res.on('end', () => {
					res.body = resBody;
					return resolve(res); // resolve the request
				});
			});
			req.on('error', (e) => {
				this.log(e);
				reject(e);
			});
			req.setTimeout(50000, () => {
				req.abort();
				reject(Error('Connection timeout'));
			});
			req.write(postData);
			req.end();
		});
	}

}

module.exports = SendSMSApp;
