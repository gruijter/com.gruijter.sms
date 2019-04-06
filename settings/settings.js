/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
let selectedProviderUrl = '';

// disable fields that are not relevant for selected provider
function providerSelected() {
	selectedProviderUrl = $('#provider').val();
	$('#testResult').prop('disabled', true);
	$('#testResult').val('');
	$('#api_id').prop('disabled', true);
	$('#username').prop('disabled', true);
	$('#password').prop('disabled', true);
	$('#from').prop('disabled', true);

	switch ($('#provider').val()) {
		case 'https://www.messagebird.com':	// provider is Messagebird
			$('#api_id').prop('disabled', false);
			$('#username').val('');
			$('#password').val('');
			$('#from').prop('disabled', false);
			break;
		case 'https://46elks.com':	// provider is 46Elks
			$('#api_id').val('');
			$('#username').prop('disabled', false);
			$('#password').prop('disabled', false);
			$('#from').prop('disabled', false);
			break;
		case 'https://textbelt.com/':	// provider is textbelt
			$('#api_id').prop('disabled', false);
			$('#username').val('');
			$('#password').val('');
			$('#from').val('');
			break;
		case 'https://www.bulksms.com':	// provider is bulksms
			$('#api_id').val('');
			$('#username').prop('disabled', false);
			$('#password').prop('disabled', false);
			$('#from').val('');
			break;
		case 'https://api.clickatell.com':	// provider is clickatell
			selectedProviderUrl = 'https://www.clickatell.com';
			$('#api_id').prop('disabled', false);
			$('#username').prop('disabled', false);
			$('#password').prop('disabled', false);
			$('#from').prop('disabled', false);
			break;
		case 'http://www.targetsms.nl':	// provider is targetsms
			$('#api_id').prop('disabled', false);
			$('#username').prop('disabled', false);
			$('#password').prop('disabled', false);
			$('#from').prop('disabled', false);
			break;
		case 'https://api.spryngsms.com':	// provider is Spryng
			selectedProviderUrl = 'http://www.spryng.nl';
			$('#api_id').val('');
			$('#username').prop('disabled', false);
			$('#password').prop('disabled', false);
			$('#from').prop('disabled', false);
			break;
		case 'https://api.twilio.com':	// provider is Twilio
			selectedProviderUrl = 'https://www.twilio.com';
			$('#api_id').prop('disabled', false);
			$('#username').val('');
			$('#password').prop('disabled', false);
			$('#from').prop('disabled', false);
			break;
		case 'https://sgw01.cm.nl':	// provider is cm.nl
			selectedProviderUrl = 'https://www.cm.nl';
			$('#api_id').prop('disabled', false);
			$('#username').prop('disabled', false);
			$('#password').val('');
			$('#from').prop('disabled', false);
			break;
		case 'https://json.aspsms.com':	// provider is aspSMS
			selectedProviderUrl = 'https://www.aspsms.com';
			$('#api_id').prop('disabled', false);
			$('#username').val('');
			$('#password').prop('disabled', false);
			$('#from').prop('disabled', false);
			break;
		default:	// provider is a dellMont brand
			$('#api_id').val('');
			$('#username').prop('disabled', false);
			$('#password').prop('disabled', false);
			$('#from').prop('disabled', false);
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
		}
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
	Homey.api('POST', 'runTest/', testData, (err, result) => {
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

function displayLogs(lines) {
	$('#loglines').html(lines);
}

function updateLogs() {
	try {
		Homey.api('GET', 'getlogs/', null, (err, result) => {
			if (!err) {
				let lines = '';
				for (let i = (result.length - 1); i >= 0; i -= 1) {
					lines += `${result[i]}<br />`;
				}
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

function showTab(tab) {
	$('.tab').removeClass('tab-active');
	$('.tab').addClass('tab-inactive');
	$(`#tabb${tab}`).removeClass('tab-inactive');
	$(`#tabb${tab}`).addClass('active');
	$('.panel').hide();
	$(`#tab${tab}`).show();
	updateLogs();
	loadSettings();
}

function onHomeyReady(homeyReady) {
	Homey = homeyReady;
	showTab(1);
	Homey.ready();
}
