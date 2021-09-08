/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
let selectedProviderUrl = '';

function showInputFields(fields) {
	const allInputFields = ['api_id', 'username', 'password', 'from'];
	// first hide all fields
	allInputFields.forEach((field) => {
		$(`#${field}_label`).removeAttr('style').hide();
		$(`#${field}`).removeAttr('style').hide();
	});
	// then show the required ones
	fields.forEach((field) => {
		$(`#${field}_label`).show();
		$(`#${field}`).show();
	});
}

// disable fields that are not relevant for selected provider
function providerSelected() {
	selectedProviderUrl = $('#provider').val();
	$('#testResult').prop('disabled', true);
	$('#testResult').val('');

	switch ($('#provider').val()) {
		case 'https://46elks.com':	// provider is 46Elks
			showInputFields(['username', 'password', 'from']);
			break;
		case 'https://json.aspsms.com':	// provider is aspSMS
			selectedProviderUrl = 'https://www.aspsms.com';
			showInputFields(['api_id', 'password', 'from']);
			break;
		case 'https://gateway.sms77.io':  // provider is sms77
			selectedProviderUrl = 'https://www.sms77.io';
			showInputFields(['api_id', 'from']);
			break;
		case 'https://www.bulksms.com':	// provider is bulksms
			showInputFields(['username', 'password', 'from']);
			break;
		case 'https://api.clickatell.com':	// provider is clickatell
			selectedProviderUrl = 'https://www.clickatell.com';
			showInputFields(['api_id', 'username', 'password', 'from']);
			break;
		case 'https://sgw01.cm.nl':	// provider is cm.nl
			selectedProviderUrl = 'https://www.cm.nl';
			showInputFields(['api_id', 'username', 'from']);
			break;
		case 'https://gatewayapi.com':	// provider is gatewayapi
			selectedProviderUrl = 'https://gatewayapi.com';
			showInputFields(['api_id', 'from']);
			break;
		case 'https://mobile.free.fr':	// provider is Free mobile
			showInputFields(['username', 'password', 'from']);
			break;
		case 'https://www.messagebird.com':	// provider is Messagebird
			showInputFields(['api_id', 'from']);
			break;
		case 'https://www.sendinblue.com':	// provider is sendInBlue
			showInputFields(['api_id', 'from']);
			break;
		case 'https://api.spryngsms.com':	// provider is Spryng
			selectedProviderUrl = 'http://www.spryng.nl';
			showInputFields(['username', 'password', 'from']);
			break;
		case 'http://www.targetsms.nl':	// provider is targetsms
			showInputFields(['api_id', 'username', 'password', 'from']);
			break;
		case 'https://textbelt.com/':	// provider is textbelt
			showInputFields(['api_id']);
			break;
		case 'https://api.twilio.com':	// provider is Twilio
			selectedProviderUrl = 'https://www.twilio.com';
			showInputFields(['api_id', 'password', 'from']);
			break;

		default:	// provider is a dellMont brand
			showInputFields(['username', 'password', 'from']);
	}
}

function loadSettings() {
	Homey.get('settings', (err, storedData) => {
		if (err) {
			Homey.alert(err);
			return;
		}
		if (storedData) {
			$('#provider').val(storedData.provider);
			$('#api_id').val(storedData.api_id);
			$('#username').val(storedData.username);
			$('#password').val(storedData.password);
			$('#from').val(storedData.from);
			$('#toTest').val(storedData.toTest);
			$('#testMessage').val(storedData.testMessage);
			providerSelected();
		} else showInputFields(['username', 'password', 'from']);
	});
}

function openUrl() {
	Homey.openURL(selectedProviderUrl);
}

function runTest() {
	$('#testResult').val(Homey.__('settings.tab1.testingNow'));
	const testData = {
		provider: $('#provider').val(),
		api_id: $('#api_id').val(),
		username: $('#username').val(),
		password: $('#password').val(),
		from: $('#from').val(),
		toTest: $('#toTest').val(),
		testMessage: $('#testMessage').val(),
		url: $('#provider').val(),
	};
	Homey.api('POST', 'testSMS', testData, (err, result) => {
		if (err) {
			$('#testResult').val(`Error: ${err}`);
			return;
		}
		$('#testResult').val(`${Homey.__('settings.tab1.testOk', { result })}`);
	});
}

function save() {
	$('#testResult').val('');
	const saveData = {
		provider: $('#provider').val(),
		api_id: $('#api_id').val(),
		username: $('#username').val(),
		password: $('#password').val(),
		from: $('#from').val(),
		toTest: $('#toTest').val(),
		testMessage: $('#testMessage').val(),
		url: $('#provider').val(),
	};
	Homey.set('settings', saveData, (error) => {
		if (error) {
			Homey.alert(error, 'error');
		} else {
			Homey.alert(Homey.__('settingsSaved'), 'info');
		}
	});
}

// tab 2 stuff here
function displayLogs(lines) {
	$('#loglines').html(lines);
}

function updateLogs() {
	try {
		displayLogs('');
		Homey.api('GET', 'getlogs/', null, (err, result) => {
			if (!err) {
				let lines = '';
				result
					.reverse()
					.forEach((line) => {
						lines += `${line}<br />`;
					});
				displayLogs(lines);
			} else {
				displayLogs(err);
			}
		});
	} catch (e) {
		displayLogs(e);
	}
}

function deleteLogs() {
	Homey.confirm(Homey.__('settings.tab2.deleteWarning'), 'warning', (error, result) => {
		if (result) {
			Homey.api('GET', 'deletelogs/', null, (err) => {
				if (err) {
					Homey.alert(err.message, 'error'); // [, String icon], Function callback )
				} else {
					Homey.alert(Homey.__('settings.tab2.deleted'), 'info');
					updateLogs();
				}
			});
		}
	});
}

// generic stuff here
function showTab(tab) {
	if (tab === 2) updateLogs();
	$('.tab').removeClass('tab-active');
	$('.tab').addClass('tab-inactive');
	$(`#tabb${tab}`).removeClass('tab-inactive');
	$(`#tabb${tab}`).addClass('active');
	$('.panel').hide();
	$(`#tab${tab}`).show();
}

function onHomeyReady(homeyReady) {
	Homey = homeyReady;
	loadSettings();
	showTab(1);
	Homey.ready();
}
