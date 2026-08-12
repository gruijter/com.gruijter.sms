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

const { httpRequest, toQueryString } = require('./request');

// Node's http(s) `auth: 'user:pass'` option sends Basic auth; fetch has no
// equivalent shorthand, so this reproduces it as an explicit header.
function basicAuthHeader(user, pass) {
  return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
}

// https://account.cheapconnect.net/API/v1/sms/SendSMS
async function cheapconnect(service, number, msg) {
  const postData = {
    apikey: service.api_id, from: service.from, to: number, msg,
  };
  const result = await httpRequest('https://account.cheapconnect.net/API/v1/sms/SendSMS', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: toQueryString(postData),
  });
  if (result.statusCode !== 200 && result.statusCode !== 201) throw new Error(`${result.statusCode}: ${result.body}`);
  if (!result.body.includes('success')) throw new Error(result.body);
  return result.body;
}

// https://gatewayapi.com/rest/mtsms
async function gatewayapi(service, number, msg) {
  const query = {
    token: service.api_id, sender: service.from, 'recipients.0.msisdn': number, message: msg,
  };
  const result = await httpRequest(`https://gatewayapi.com/rest/mtsms?${toQueryString(query)}`);
  if (result.statusCode !== 200) throw new Error(`${result.statusCode}: ${result.body.slice(0, 250)}`);
  const response = JSON.parse(result.body);
  if (!response.ids) throw new Error(JSON.stringify(response));
  return JSON.stringify(response);
}

// https://smsapi.free-mobile.fr/sendmsg
async function freeMobile(service, number, msg) {
  const query = {
    user: service.username, pass: service.password, to: number, msg,
  };
  const result = await httpRequest(`https://smsapi.free-mobile.fr/sendmsg?${toQueryString(query)}`);
  if (result.statusCode !== 200 && result.statusCode !== 201) throw new Error(`error: ${result.statusCode} ${result.body.slice(0, 250)}`);
  return result.body;
}

// https://api.sendinblue.com/v3/transactionalSMS/sms
async function sendinblue(service, number, msg) {
  const postData = {
    type: 'transactional', sender: service.from, recipient: number, content: msg,
  };
  const result = await httpRequest('https://api.sendinblue.com/v3/transactionalSMS/sms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', accept: 'application/json', 'api-key': service.api_id },
    body: JSON.stringify(postData),
  });
  if (result.statusCode !== 200 && result.statusCode !== 201) throw new Error(`${result.statusCode}: ${result.body.slice(0, 250)}`);
  const response = JSON.parse(result.body);
  if (!response.messageId) throw new Error(JSON.stringify(response));
  return JSON.stringify(response);
}

// https://rest.messagebird.com/messages
async function messagebird(service, number, msg) {
  const postData = { originator: service.from, recipients: [number], body: msg };
  const result = await httpRequest('https://rest.messagebird.com/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: basicAuthHeader('AccessKey', service.api_id),
    },
    body: JSON.stringify(postData),
  });
  if (result.statusCode !== 200 && result.statusCode !== 201) throw new Error(`${result.statusCode}: ${result.body.slice(0, 250)}`);
  const status = JSON.parse(result.body);
  const item = status.recipients && status.recipients.items && status.recipients.items[0];
  if (!status.id || !item || item.status !== 'sent') throw new Error(JSON.stringify(status));
  return JSON.stringify(status);
}

// https://api.46elks.com/a1/sms
async function _46Elks(service, number, msg) {
  const postData = toQueryString({ from: service.from, to: number, message: msg });
  const result = await httpRequest('https://api.46elks.com/a1/sms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuthHeader(service.username, service.password),
    },
    body: postData,
  });
  if (result.statusCode !== 200) throw new Error(`${result.statusCode}: ${result.body.slice(0, 250)}`);
  const status = JSON.parse(result.body);
  if (!status.status || status.status === 'failed') throw new Error(JSON.stringify(status));
  return JSON.stringify(status);
}

// https://api.bulksms.com/v1/messages
async function bulkSms(service, number, msg) {
  const postData = { body: msg, to: number };
  if (service.from && service.from.length > 0) postData.from = service.from;
  const result = await httpRequest('https://api.bulksms.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'auto-unicode': true,
      Authorization: basicAuthHeader(service.username, service.password),
    },
    body: JSON.stringify(postData),
  });
  if (result.statusCode !== 200 && result.statusCode !== 201) throw new Error(`${result.statusCode}: ${result.body}`);
  const body = JSON.parse(result.body);
  if (!body[0] || body[0].status.subtype) throw new Error(result.body);
  return JSON.stringify(body);
}

// https://textbelt.com/text
async function textBelt(service, number, msg) {
  const postData = { phone: number, message: msg, key: service.api_id };
  const result = await httpRequest('https://textbelt.com/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData),
  });
  if (result.statusCode !== 200) throw new Error(`${result.statusCode}: ${result.body}`);
  const status = JSON.parse(result.body);
  if (!status.success) throw new Error(JSON.stringify(status));
  return JSON.stringify(status);
}

// https://platform.clickatell.com/messages/http/send
async function clickatell(service, number, msg) {
  const query = { apiKey: service.api_id, to: number, content: msg };
  const result = await httpRequest(`https://platform.clickatell.com/messages/http/send?${toQueryString(query)}`);
  if (result.statusCode !== 200 && result.statusCode !== 202) throw new Error(`error: ${result.statusCode} ${result.body}`);
  if (!result.body.includes('"accepted":true')) throw new Error(result.body);
  return result.body;
}

const targetSmsErrors = {
  45001: 'Recipient incorrect (check the to-field)',
  45002: 'Message to long, absent or contains illegal characters',
  45003: 'Destination is blocked by smsinfofilter',
  45004: 'Destination is blocked by STOP message',
  45005: 'Last MO message is expired',
  45011: 'Incorrect or no affiliate ID (check Password/id)',
  45012: 'Incorrect originator',
  45019: 'Not allowed to send Normal SMS',
  45020: 'Message and URL combined are too long',
  45021: 'No URL given (check url)',
  45025: 'Incorrect filetype for recipient list',
  45045: 'Server down, please try again later',
  50010: 'No SMS credits or credit has expired',
};

// http://www.targetsms.nl/service/sendsms
async function targetSms(service, number, msg) {
  const query = {
    username: service.username,
    handle: service.api_id,
    aff: service.password,
    soort: 'sms',
    originator: service.from,
    to: number,
    message: msg,
  };
  const result = await httpRequest(`http://www.targetsms.nl/service/sendsms?${toQueryString(query)}`);
  if (result.statusCode !== 200) throw new Error(`error: ${result.statusCode} ${result.body.slice(0, 250)}`);
  const code = result.body.slice(0, 5);
  if (code !== '45000') throw new Error(targetSmsErrors[code] || `Unknown error ${result.body.slice(0, 250)}`);
  return result.body;
}

const spryngSmsErrors = {
  100: 'Missing parameter',
  101: 'Username too short',
  102: 'Username too long',
  103: 'Password too short',
  104: 'Password too long',
  105: 'Destination too short, use number format: 31641041106',
  106: 'Destination too long, use number format: 31641041106',
  107: 'Sender too short, use number format: 0031641041106',
  108: 'Sender too long, use number format: 0031641041106',
  109: 'Body too long',
  110: 'Body too short',
  200: 'Security error',
  201: 'Unknown route',
  202: 'Route access violation',
  203: 'Insufficient credits',
  800: 'Technical error',
};

// https://api.spryngsms.com/api/send.php
async function spryngSms(service, number, msg) {
  const query = {
    USERNAME: service.username,
    PASSWORD: service.password,
    SENDER: service.from,
    DESTINATION: number,
    BODY: msg,
  };
  const result = await httpRequest(`https://api.spryngsms.com/api/send.php?${toQueryString(query)}`);
  if (result.statusCode !== 200) throw new Error(`error: ${result.statusCode} ${result.body.slice(0, 250)}`);
  if (result.body.slice(0, 3) !== '1') {
    const code = result.body.slice(0, 5);
    throw new Error(spryngSmsErrors[code] || `Unknown error ${result.body.slice(0, 250)}`);
  }
  return result.body;
}

// https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages
async function twilio(service, number, msg) {
  const accountSid = service.api_id;
  const authToken = service.password;
  const postData = { To: number, From: service.from, Body: msg };
  const result = await httpRequest(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuthHeader(accountSid, authToken),
    },
    body: toQueryString(postData),
  });
  const status = /<Status>(.*)<\/Status>/.exec(result.body)[1];
  const message = /<Message>(.*)<\/Message>/.exec(result.body)[1];
  if (result.statusCode !== 201) throw new Error(`${result.statusCode}: ${message}`);
  if (status !== 'queued') throw new Error(message);
  return status;
}

// https://sgw01.cm.nl/gateway.ashx
async function cm(service, number, msg) {
  const query = {
    producttoken: service.api_id, body: msg, to: number, username: service.username, from: service.from,
  };
  const result = await httpRequest(`https://sgw01.cm.nl/gateway.ashx?${toQueryString(query)}`);
  if (result.statusCode !== 200 || result.body !== '') throw new Error(`error: ${result.statusCode}: ${result.body.slice(0, 250)}`);
  return result.body;
}

// https://json.aspsms.com/SendSimpleTextSMS
async function aspSms(service, number, msg) {
  const postData = {
    UserName: service.api_id,
    Password: service.password,
    Originator: service.from,
    Recipients: [number],
    MessageText: msg,
    ForceGSM7bit: false,
  };
  const result = await httpRequest('https://json.aspsms.com/SendSimpleTextSMS', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData),
  });
  if (result.statusCode !== 200) throw new Error(`${result.statusCode}: ${result.body.slice(0, 250)}`);
  const status = JSON.parse(result.body);
  if (status.StatusCode !== '1') throw new Error(JSON.stringify(status));
  return JSON.stringify(status);
}

// https://api.telnyx.com/v2/messages
async function telnyx(service, number, msg) {
  const postData = { from: service.from, to: number, text: msg };
  const result = await httpRequest('https://api.telnyx.com/v2/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${service.api_id}`,
    },
    body: JSON.stringify(postData),
  });
  if (result.statusCode !== 200) throw new Error(`${result.statusCode}: ${result.body.slice(0, 250)}`);
  const status = JSON.parse(result.body);
  const to = status.data && status.data.to && status.data.to[0];
  if (!to || to.status === 'failed') throw new Error(JSON.stringify(status));
  return JSON.stringify(status);
}

// https://api.africastalking.com/version1/messaging
async function africastalking(service, number, msg) {
  const postData = { username: service.username, to: number, message: msg };
  if (service.from) postData.from = service.from;
  const result = await httpRequest('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      apiKey: service.api_id,
    },
    body: toQueryString(postData),
  });
  if (result.statusCode !== 200 && result.statusCode !== 201) throw new Error(`${result.statusCode}: ${result.body.slice(0, 250)}`);
  const status = JSON.parse(result.body);
  const recipient = status.SMSMessageData && status.SMSMessageData.Recipients && status.SMSMessageData.Recipients[0];
  if (!recipient || recipient.status !== 'Success') throw new Error(JSON.stringify(status));
  return JSON.stringify(status);
}

// httpSMS relays through a user's own paired Android phone, not a hosted
// number pool - 'from' must exactly match that phone's own number.
// https://api.httpsms.com/v1/messages/send
async function httpsms(service, number, msg) {
  const postData = { from: service.from, to: number, content: msg };
  const result = await httpRequest('https://api.httpsms.com/v1/messages/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': service.api_id,
    },
    body: JSON.stringify(postData),
  });
  if (result.statusCode !== 200 && result.statusCode !== 201) throw new Error(`${result.statusCode}: ${result.body.slice(0, 250)}`);
  const status = JSON.parse(result.body);
  if (status.status !== 'success') throw new Error(JSON.stringify(status));
  return JSON.stringify(status);
}

// https://rest.textmagic.com/api/v2/messages
async function textmagic(service, number, msg) {
  const postData = { phones: number, text: msg };
  if (service.from) postData.from = service.from;
  const result = await httpRequest('https://rest.textmagic.com/api/v2/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-TM-Username': service.username,
      'X-TM-Key': service.password,
    },
    body: toQueryString(postData),
  });
  if (result.statusCode < 200 || result.statusCode >= 300) throw new Error(`${result.statusCode}: ${result.body.slice(0, 250)}`);
  return result.body;
}

// Clockwork SMS, part of the TextAnywhere family since 2021 (API unchanged).
// https://api.clockworksms.com/http/send.aspx
async function clockworksms(service, number, msg) {
  const query = { key: service.api_id, to: number, content: msg };
  if (service.from) query.from = service.from;
  const result = await httpRequest(`https://api.clockworksms.com/http/send.aspx?${toQueryString(query)}`);
  if (result.statusCode !== 200) throw new Error(`${result.statusCode}: ${result.body.slice(0, 250)}`);
  if (result.body.includes('Error') || !result.body.includes('ID:')) throw new Error(result.body.slice(0, 250));
  return result.body;
}

// Burst SMS, API still served from its original transmitsms.com domain.
// https://api.transmitsms.com/send-sms.json
async function burstSms(service, number, msg) {
  const postData = { to: number, message: msg };
  if (service.from) postData.from = service.from;
  const result = await httpRequest('https://api.transmitsms.com/send-sms.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuthHeader(service.api_id, service.password),
    },
    body: toQueryString(postData),
  });
  if (result.statusCode !== 200) throw new Error(`${result.statusCode}: ${result.body.slice(0, 250)}`);
  const status = JSON.parse(result.body);
  if (!status.error || status.error.code !== 'SUCCESS') throw new Error(JSON.stringify(status));
  return JSON.stringify(status);
}

// https://rest.clicksend.com/v3/sms/send
async function clicksend(service, number, msg) {
  const postData = {
    messages: [{
      source: 'homey', from: service.from, to: number, body: msg,
    }],
  };
  const result = await httpRequest('https://rest.clicksend.com/v3/sms/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: basicAuthHeader(service.username, service.password),
    },
    body: JSON.stringify(postData),
  });
  if (result.statusCode !== 200) throw new Error(`${result.statusCode}: ${result.body.slice(0, 250)}`);
  const status = JSON.parse(result.body);
  if (status.response_code !== 'SUCCESS') throw new Error(JSON.stringify(status));
  return JSON.stringify(status);
}

// https://rest.nexmo.com/sms/json (Vonage, formerly Nexmo)
async function vonage(service, number, msg) {
  const postData = {
    api_key: service.api_id, api_secret: service.password, from: service.from, to: number, text: msg,
  };
  const result = await httpRequest('https://rest.nexmo.com/sms/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: toQueryString(postData),
  });
  if (result.statusCode !== 200) throw new Error(`${result.statusCode}: ${result.body.slice(0, 250)}`);
  const status = JSON.parse(result.body);
  const message = status.messages && status.messages[0];
  if (!message || message.status !== '0') throw new Error(JSON.stringify(status));
  return JSON.stringify(status);
}

// https://api.plivo.com/v1/Account/{auth_id}/Message/
async function plivo(service, number, msg) {
  const postData = { src: service.from, dst: number, text: msg };
  const result = await httpRequest(`https://api.plivo.com/v1/Account/${service.api_id}/Message/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: basicAuthHeader(service.api_id, service.password),
    },
    body: JSON.stringify(postData),
  });
  if (result.statusCode !== 200 && result.statusCode !== 202) throw new Error(`${result.statusCode}: ${result.body.slice(0, 250)}`);
  const status = JSON.parse(result.body);
  if (!status.message || !status.message.includes('queued')) throw new Error(JSON.stringify(status));
  return JSON.stringify(status);
}

// sms77 rebranded to Seven (seven.io) in 2023. gateway.sms77.io still works
// (same backend, verified live), but gateway.seven.io is the current name.
// https://gateway.seven.io/api/sms
async function seven(service, number, msg) {
  const postData = {
    from: service.from, json: 1, text: msg, to: number,
  };
  const result = await httpRequest('https://gateway.seven.io/api/sms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      SentWith: 'Homey-SMS',
      'X-Api-Key': service.api_id,
    },
    body: JSON.stringify(postData),
  });
  if (result.statusCode !== 200) throw new Error(`${result.statusCode}: ${result.body.slice(0, 250)}`);
  const status = JSON.parse(result.body);
  if (status.success !== '100' && status.success !== '101') throw new Error(JSON.stringify(status));
  return JSON.stringify(status);
}

// Generic fallback for the ~78 white-label DellMont-platform brands
// (12VoIP, VoipBuster, VoipStunt, SMSDiscount, etc.) - same API, different host.
async function dellMont(service, number, msg) {
  const query = {
    username: service.username, password: service.password, from: service.from, to: number, text: msg,
  };
  const host = service.provider.replace('https://', '').replace('http://', '');
  const result = await httpRequest(`https://${host}/myaccount/sendsms.php?${toQueryString(query)}`);
  if (result.statusCode !== 200) throw new Error(`error: ${result.statusCode}: ${result.body.slice(0, 250)}`);
  const resultCode = /<result>(.*)<\/result>/.exec(result.body)[1];
  const description = /<description>(.*)<\/description>/.exec(result.body)[1];
  if (resultCode !== '1') throw new Error(description);
  return description;
}

// service.provider -> adapter + settings-page metadata (name, required
// fields, optional info page). Anything not listed here is a DellMont
// white-label brand and falls back to the generic dellMont adapter. This is
// the single source of truth for both dispatch (resolveProvider) and the
// settings page's provider list (getCatalog) - see api.js/getProviders.
// id is a stable, locale-key-safe identifier used to look up this
// provider's fieldLabels/hint text in locales/*.json under "providers.<id>"
// (see getCatalog below) - fieldLabels override the generic "Api ID"/
// "Username"/"Password" labels shown on the settings page for fields whose
// generic name would mislead the user about what to actually enter (see the
// adapter above for what each field is really used as). This was a
// recurring source of support issues, e.g. GitHub #18/#22 (Twilio: SID/
// token, not username/password). hint is an optional one-line setup note
// shown under the provider dropdown, for prerequisites a relabeled field
// alone can't convey. Neither is hardcoded here - both come from locale
// files so they're translated, not just the generic field names.
const providers = {
  'https://mobile.free.fr': {
    id: 'freeMobile', name: 'Free Mobile', fields: ['username', 'password', 'from'], send: freeMobile,
  },
  'https://www.messagebird.com': {
    id: 'messageBird', name: 'MessageBird', fields: ['api_id', 'from'], send: messagebird,
  },
  'https://46elks.com': {
    id: '46elks', name: '46Elks', fields: ['username', 'password', 'from'], send: _46Elks,
  },
  'https://textbelt.com/': {
    id: 'textbelt', name: 'Textbelt', fields: ['api_id'], send: textBelt,
  },
  'https://www.bulksms.com': {
    id: 'bulkSms', name: 'bulkSMS', fields: ['username', 'password', 'from'], send: bulkSms,
  },
  'https://cheapconnect.net': {
    id: 'cheapconnect', name: 'Cheapconnect.net', fields: ['api_id', 'from'], send: cheapconnect,
  },
  'https://api.clickatell.com': {
    id: 'clickatell',
    name: 'Clickatell',
    fields: ['api_id'],
    infoUrl: 'https://www.clickatell.com',
    send: clickatell,
  },
  'http://www.targetsms.nl': {
    id: 'targetSms', name: 'TargetSMS', fields: ['api_id', 'username', 'password', 'from'], send: targetSms,
  },
  'https://api.spryngsms.com': {
    id: 'spryngSms',
    name: 'SpryngSMS',
    fields: ['username', 'password', 'from'],
    infoUrl: 'http://www.spryng.nl',
    send: spryngSms,
  },
  'https://api.twilio.com': {
    id: 'twilio', name: 'Twilio', fields: ['api_id', 'password', 'from'], infoUrl: 'https://www.twilio.com', send: twilio,
  },
  'https://sgw01.cm.nl': {
    id: 'cm', name: 'CM Direct', fields: ['api_id', 'username', 'from'], infoUrl: 'https://www.cm.nl', send: cm,
  },
  'https://json.aspsms.com': {
    id: 'aspSms', name: 'aspSMS', fields: ['api_id', 'password', 'from'], infoUrl: 'https://www.aspsms.com', send: aspSms,
  },
  'https://www.sendinblue.com': {
    id: 'sendinblue', name: 'SendInBlue', fields: ['api_id', 'from'], send: sendinblue,
  },
  'https://gatewayapi.com': {
    id: 'gatewayapi', name: 'Gatewayapi', fields: ['api_id', 'from'], send: gatewayapi,
  },
  // dispatch key intentionally kept as the old sms77 URL for backward
  // compatibility with settings already saved by existing users
  'https://gateway.sms77.io': {
    id: 'seven', name: 'Seven', fields: ['api_id', 'from'], infoUrl: 'https://www.seven.io', send: seven,
  },
  'https://rest.clicksend.com': {
    id: 'clicksend',
    name: 'ClickSend',
    fields: ['username', 'password', 'from'],
    infoUrl: 'https://www.clicksend.com',
    send: clicksend,
  },
  'https://rest.nexmo.com': {
    id: 'vonage',
    name: 'Vonage',
    fields: ['api_id', 'password', 'from'],
    infoUrl: 'https://www.vonage.com',
    send: vonage,
  },
  'https://api.plivo.com': {
    id: 'plivo', name: 'Plivo', fields: ['api_id', 'password', 'from'], infoUrl: 'https://www.plivo.com', send: plivo,
  },
  'https://rest.textmagic.com': {
    id: 'textmagic',
    name: 'TextMagic',
    fields: ['username', 'password', 'from'],
    infoUrl: 'https://www.textmagic.com',
    send: textmagic,
  },
  'https://api.clockworksms.com': {
    id: 'clockworksms',
    name: 'Clockwork SMS',
    fields: ['api_id', 'from'],
    infoUrl: 'https://www.textanywhere.com',
    send: clockworksms,
  },
  'https://api.transmitsms.com': {
    id: 'burstSms',
    name: 'Burst SMS',
    fields: ['api_id', 'password', 'from'],
    infoUrl: 'https://burstsms.com',
    send: burstSms,
  },
  'https://telnyx.com': {
    id: 'telnyx', name: 'Telnyx', fields: ['api_id', 'from'], infoUrl: 'https://telnyx.com', send: telnyx,
  },
  'https://africastalking.com': {
    id: 'africasTalking',
    name: "Africa's Talking",
    fields: ['username', 'api_id', 'from'],
    infoUrl: 'https://africastalking.com',
    send: africastalking,
  },
  'https://httpsms.com': {
    id: 'httpsms', name: 'httpSMS', fields: ['api_id', 'from'], infoUrl: 'https://httpsms.com', send: httpsms,
  },
};

// The ~70 white-label brands running on the DellMont/Betamax/Finarea
// reseller platform (same generic dellMont adapter, different host).
// Verified live 2026-08-12: dropped 'Easycallback.com' and 'VoipR.com' (dead
// domains, no DNS), and updated 3 brands that moved TLD (their old .com is
// dead/parked): CallingCardBuster and DiscountVoip -> .co.uk, Nonoh -> .net.
const dellMontBrands = [
  { name: '12VoIP', url: 'https://www.12VoIP.com' },
  { name: 'Actionvoip', url: 'https://www.Actionvoip.com' },
  { name: 'BrowserCalls', url: 'https://www.BrowserCalls.com' },
  { name: 'BudgetVoip', url: 'https://www.BudgetVoip.com' },
  { name: 'BudgetVoipCall', url: 'https://www.BudgetVoipCall.com' },
  { name: 'Call2India', url: 'https://www.Call2India.com' },
  { name: 'CallEasy', url: 'https://www.CallEasy.com' },
  { name: 'CallingCardBuster', url: 'https://www.CallingCardBuster.co.uk' },
  { name: 'CallingCredit', url: 'https://www.CallingCredit.com' },
  { name: 'CallPirates', url: 'https://www.CallPirates.com' },
  { name: 'CheapBuzzer', url: 'https://www.CheapBuzzer.com' },
  { name: 'CheapVoip', url: 'https://www.CheapVoip.com' },
  { name: 'CheapVoipCall', url: 'https://www.CheapVoipCall.com' },
  { name: 'CosmoVoip', url: 'https://www.CosmoVoip.com' },
  { name: 'DialCheap', url: 'https://www.DialCheap.com' },
  { name: 'DialNow', url: 'https://www.DialNow.com' },
  { name: 'DiscountCalling', url: 'https://www.DiscountCalling.com' },
  { name: 'DiscountVoip', url: 'https://www.DiscountVoip.co.uk' },
  { name: 'EasyVoip', url: 'https://www.EasyVoip.com' },
  { name: 'FreeCall', url: 'https://www.FreeCall.com' },
  { name: 'FreeVoipDeal', url: 'https://www.FreeVoipDeal.com' },
  { name: 'Frynga', url: 'https://www.Frynga.com' },
  { name: 'GlobalFreecall', url: 'https://www.GlobalFreecall.com' },
  { name: 'HotVoip', url: 'https://www.HotVoip.com' },
  { name: 'Internetcalls', url: 'https://www.Internetcalls.com' },
  { name: 'InterVoip', url: 'https://www.InterVoip.com' },
  { name: 'Jumblo', url: 'https://www.Jumblo.com' },
  { name: 'JustVoip', url: 'https://www.JustVoip.com' },
  { name: 'Low-Rate Voip', url: 'https://www.LowRateVoip.com' },
  { name: 'MegaVoip', url: 'https://www.MegaVoip.com' },
  { name: 'MexicoBarato', url: 'https://www.MexicoBarato.com' },
  { name: 'NairaCalls', url: 'https://www.NairaCalls.com' },
  { name: 'Netappel', url: 'https://www.Netappel.com' },
  { name: 'Nonoh', url: 'https://www.Nonoh.net' },
  { name: 'PanggilanMalaysia', url: 'https://www.PanggilanMalaysia.com' },
  { name: 'PennyConnect', url: 'https://www.PennyConnect.com' },
  { name: 'PinoyDialer', url: 'https://www.PinoyDialer.com' },
  { name: 'PoivY', url: 'https://www.PoivY.com' },
  { name: 'PowerVoip', url: 'https://www.PowerVoip.com' },
  { name: 'RebVoice', url: 'https://www.RebVoice.com' },
  { name: 'Rynga', url: 'https://www.Rynga.com' },
  { name: 'SIPDiscount', url: 'https://www.SIPDiscount.com' },
  { name: 'SmartVoip', url: 'https://www.SmartVoip.com' },
  { name: 'SMS Discount', url: 'https://www.SMSDiscount.com' },
  { name: 'SMSLISTO', url: 'https://www.SMSLISTO.com' },
  { name: 'StuntCalls', url: 'https://www.StuntCalls.com' },
  { name: 'SuperVoip', url: 'https://www.SuperVoip.com' },
  { name: 'Telbo', url: 'https://www.Telbo.com' },
  { name: 'VoiceTrading', url: 'https://www.VoiceTrading.com' },
  { name: 'VoipaLot', url: 'https://www.VoipaLot.com' },
  { name: 'Voipblast', url: 'https://www.Voipblast.com' },
  { name: 'VoipBlazer', url: 'https://www.VoipBlazer.com' },
  { name: 'VoipBuster', url: 'https://www.VoipBuster.com' },
  { name: 'VoipbusterPro', url: 'https://www.VoipbusterPro.com' },
  { name: 'VoipCaptain', url: 'https://www.VoipCaptain.com' },
  { name: 'VoipCheap', url: 'https://www.VoipCheap.com' },
  { name: 'VoipChief', url: 'https://www.VoipChief.com' },
  { name: 'VoipDiscount', url: 'https://www.VoipDiscount.com' },
  { name: 'VoipGain', url: 'https://www.VoipGain.com' },
  { name: 'VoipJumper', url: 'https://www.VoipJumper.com' },
  { name: 'VoipMove', url: 'https://www.VoipMove.com' },
  { name: 'VoipRaider', url: 'https://www.VoipRaider.com' },
  { name: 'VoipSmash', url: 'https://www.VoipSmash.com' },
  { name: 'VoipStunt', url: 'https://www.VoipStunt.com' },
  { name: 'VoipWise', url: 'https://www.VoipWise.com' },
  { name: 'VoipYo', url: 'https://www.VoipYo.com' },
  { name: 'VoipZoom', url: 'https://www.VoipZoom.com' },
  { name: 'WebCallDirect', url: 'https://www.WebCallDirect.com' },
];

const defaultFields = ['username', 'password', 'from'];

function resolveProvider(providerUrl) {
  const provider = providers[providerUrl];
  return provider ? provider.send : dellMont;
}

// Settings-page provider list: named providers with their required fields,
// plus the DellMont white-label brands (which all use the default fields).
// translate: typically this.homey.__ from app.js, resolving "providers.<id>.
// fieldLabels.<field>" / "providers.<id>.hint" against locales/*.json. Falls
// back to no override (generic field labels, no hint) when a translate
// function isn't supplied or a key isn't translated - most i18n libraries,
// Homey's included, echo the key back unresolved rather than returning
// undefined, so that's treated as "not found" too.
function getCatalog(translate) {
  const t = (key) => {
    if (typeof translate !== 'function') return undefined;
    const value = translate(key);
    return value && value !== key ? value : undefined;
  };
  const named = Object.entries(providers)
    .map(([url, provider]) => {
      const fieldLabels = {};
      provider.fields.forEach((field) => {
        const label = t(`providers.${provider.id}.fieldLabels.${field}`);
        if (label) fieldLabels[field] = label;
      });
      return {
        url,
        name: provider.name,
        fields: provider.fields,
        fieldLabels: Object.keys(fieldLabels).length ? fieldLabels : undefined,
        hint: t(`providers.${provider.id}.hint`),
        infoUrl: provider.infoUrl,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const dellMont = [...dellMontBrands].sort((a, b) => a.name.localeCompare(b.name));
  return { named, dellMont, defaultFields };
}

module.exports = { resolveProvider, getCatalog };
