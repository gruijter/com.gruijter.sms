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

// URLSearchParams percent-encodes '+' as '%2B', which breaks international
// phone numbers passed as e.g. '+31641041106'. Use this whenever a phone
// number (or any '+'-bearing value) ends up in a query string or form body.
function toQueryString(params) {
  return new URLSearchParams(params).toString().replace(/%2B/gi, '+');
}

// Shared native-fetch HTTP request helper for all SMS provider adapters.
// Returns { statusCode, body } (body as text) regardless of http(s) scheme.
async function httpRequest(url, {
  method = 'GET', headers, body, timeout = 40000,
} = {}) {
  const signal = AbortSignal.timeout(timeout);
  const response = await fetch(url, {
    method, headers, body, signal,
  });
  const text = await response.text();
  return { statusCode: response.status, body: text };
}

module.exports = { httpRequest, toQueryString };
