/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

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

let selectedProviderUrl = '';
let providerConfig = {}; // provider URL -> { fields, fieldLabels, infoUrl }, filled by loadProviders()
let defaultFields = ['username', 'password', 'from']; // used for DellMont brands
const defaultFieldLabels = {}; // field -> translated generic label text, captured once at startup

const allFields = ['api_id', 'username', 'password', 'from'];

function showInputFields(fields, fieldLabels) {
  allFields.forEach((field) => {
    document.getElementById(`${field}_group`).style.display = fields.includes(field) ? '' : 'none';
    const label = document.getElementById(`${field}_label`);
    label.textContent = (fieldLabels && fieldLabels[field]) || defaultFieldLabels[field];
  });
}

// show/hide fields relevant for the selected provider, relabel them where
// the generic label would be misleading (e.g. Twilio's "Api ID" field is
// really its Account SID), and show a setup hint for providers with a
// prerequisite a relabeled field can't convey (e.g. Free Mobile needing an
// account option activated first) - see lib/providers.js's fieldLabels/hint.
function providerSelected() {
  const providerUrl = document.getElementById('provider').value;
  const config = providerConfig[providerUrl] || { fields: defaultFields };
  selectedProviderUrl = config.infoUrl || providerUrl;
  const testResult = document.getElementById('testResult');
  testResult.disabled = true;
  testResult.value = '';
  showInputFields(config.fields, config.fieldLabels);

  const hintEl = document.getElementById('providerHint');
  hintEl.textContent = config.hint || '';
  hintEl.style.display = config.hint ? '' : 'none';
}

// fetch the provider list from the app (see lib/providers.js/getCatalog) and
// build the <select>, so the provider catalog only lives in one place
function loadProviders(done) {
  Homey.api('GET', 'getProviders', null, (err, catalog) => {
    if (err) {
      Homey.alert(err.message || String(err));
      done();
      return;
    }
    defaultFields = catalog.defaultFields;
    providerConfig = {};

    const select = document.getElementById('provider');
    select.innerHTML = '';

    const namedGroup = document.createElement('optgroup');
    namedGroup.label = Homey.__('settings.tab1.providersGroup');
    catalog.named.forEach((provider) => {
      providerConfig[provider.url] = {
        fields: provider.fields, fieldLabels: provider.fieldLabels, hint: provider.hint, infoUrl: provider.infoUrl,
      };
      const option = document.createElement('option');
      option.value = provider.url;
      option.textContent = provider.name;
      namedGroup.appendChild(option);
    });
    select.appendChild(namedGroup);

    const dellMontGroup = document.createElement('optgroup');
    dellMontGroup.label = Homey.__('settings.tab1.dellmontGroup');
    catalog.dellMont.forEach((brand) => {
      providerConfig[brand.url] = { fields: defaultFields };
      const option = document.createElement('option');
      option.value = brand.url;
      option.textContent = brand.name;
      dellMontGroup.appendChild(option);
    });
    select.appendChild(dellMontGroup);

    done();
  });
}

function loadSettings() {
  Homey.get('settings', (err, storedData) => {
    if (err) {
      Homey.alert(err.message || String(err));
      return;
    }
    if (!storedData) {
      showInputFields(defaultFields);
      return;
    }
    document.getElementById('provider').value = storedData.provider;
    document.getElementById('api_id').value = storedData.api_id || '';
    document.getElementById('username').value = storedData.username || '';
    document.getElementById('password').value = storedData.password || '';
    document.getElementById('from').value = storedData.from || '';
    document.getElementById('toTest').value = storedData.toTest || '';
    document.getElementById('testMessage').value = storedData.testMessage || '';
    providerSelected();
  });
}

function openUrl() {
  Homey.openURL(selectedProviderUrl);
}

function collectFormData() {
  const provider = document.getElementById('provider').value;
  return {
    provider,
    api_id: document.getElementById('api_id').value,
    username: document.getElementById('username').value,
    password: document.getElementById('password').value,
    from: document.getElementById('from').value,
    toTest: document.getElementById('toTest').value,
    testMessage: document.getElementById('testMessage').value,
    url: provider,
  };
}

function runTest() {
  document.getElementById('testResult').value = Homey.__('settings.tab1.testingNow');
  Homey.api('POST', 'testSMS', collectFormData(), (err, result) => {
    if (err) {
      document.getElementById('testResult').value = `${Homey.__('settings.tab1.error')}: ${err.message || err}`;
      return;
    }
    document.getElementById('testResult').value = Homey.__('settings.tab1.testOk', { result });
  });
}

function save() {
  document.getElementById('testResult').value = '';
  Homey.set('settings', collectFormData(), (err) => {
    if (err) {
      Homey.alert(err.message || String(err));
    } else {
      Homey.alert(Homey.__('settings.tab1.settingsSaved'));
    }
  });
}

// tab 2 stuff here
function displayLogs(lines) {
  document.getElementById('loglines').textContent = lines;
}

function updateLogs() {
  displayLogs('');
  Homey.api('GET', 'getlogs/', null, (err, result) => {
    if (err) {
      displayLogs(err.message || String(err));
      return;
    }
    displayLogs(result.slice().reverse().join('\n'));
  });
}

function deleteLogs() {
  Homey.confirm(Homey.__('settings.tab2.deleteWarning'), (err, result) => {
    if (err || !result) return;
    Homey.api('GET', 'deletelogs/', null, (deleteErr) => {
      if (deleteErr) {
        Homey.alert(deleteErr.message || String(deleteErr));
        return;
      }
      Homey.alert(Homey.__('settings.tab2.deleted'));
      updateLogs();
    });
  });
}

// generic stuff here
function showTab(tab) {
  if (tab === 2) updateLogs();
  document.getElementById('tabb1').className = tab === 1 ? 'homey-button-primary' : 'homey-button-secondary';
  document.getElementById('tabb2').className = tab === 2 ? 'homey-button-primary' : 'homey-button-secondary';
  document.getElementById('tab1').style.display = tab === 1 ? '' : 'none';
  document.getElementById('tab2').style.display = tab === 2 ? '' : 'none';
}

function onHomeyReady(homeyReady) {
  Homey = homeyReady;
  allFields.forEach((field) => {
    defaultFieldLabels[field] = document.getElementById(`${field}_label`).textContent;
  });
  loadProviders(() => {
    loadSettings();
    showTab(1);
    Homey.ready();
  });
}
