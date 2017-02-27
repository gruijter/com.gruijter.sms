"use strict";

const util = require('util');
const request = require('request');
const parseString = require('xml2js').parseString;
let settings;

module.exports.send = send;
module.exports.init = init;

function init() {
	Homey.log("app.js init started")
	settings=Homey.manager('settings').get('settings');
}

// Fired when action card is triggered
Homey.manager('flow').on('action.send_sms', function( callback, args ){
		settings=Homey.manager('settings').get('settings');
		send(settings, args.number, args.msg, function (error, result){
			Homey.log('message flow executed '+result);
		})
		callback( null, true ); // we've fired successfully
});

// Fired when a setting has been changed
Homey.manager('settings').on( 'set', function(changedKey){
	//Homey.log(changedKey);
	if (changedKey === 'testing'){		// save button is pressed, testing can start
		Homey.log('test event received in app.js');
		let testService=Homey.manager('settings').get('testing');
		Homey.log(testService);
		send (testService, testService.toTest, testService.testMessage, function(error, result){
			Homey.log('send test completed',error, result);
			Homey.manager('api').realtime('testing_ready', { error : error, result : result }); // send result back to settings html
		});
	} else {Homey.log("settings have changed")}
})

function send (service, number, msg, callback) {
	if (service!=undefined){
		if (service.provider!=undefined){
		  switch (service.provider.substr(0, 20)) {
				case 'http://textbelt.com/':		//provider is textbelt
					textBelt (service, number, msg, function (err, result){
						let message;
						let error = err || !result.success;
//						Homey.log('error: ',err, error, result);
						if (error) {message = result.message}
						else {message = result.success};
						callback (error, message);
					});
					break;
				case 'https://api.clickate':		//provider is clickatell
					clickatell (service, number, msg, function (err, result){
						Homey.log(err, result);
						callback (err, result)
					});
					break;
				case 'http://www.targetsms':		//provider is targetsms
					targetSms (service, number, msg, function (err, result){
						Homey.log(err, result);
						callback (err, result)
					});
					break;
				case 'https://smsgateway.m':		//provider is smsgateway.me
					smsGatewayMe (service, number, msg, function (err, result){
						Homey.log(err, result);
						callback (err, result)
					});
					break;
				case 'https://api.spryngsm':		//provider is Spryng
					spryngSms (service, number, msg, function (err, result){
						Homey.log(err, result);
						callback (err, result)
					});
						break;
				case 'https://api.twilio.c':		//provider is Twilio
					twilio (service, number, msg, function (err, result){
						Homey.log(err, result);
						callback (err, result)
					});
						break;
				case 'https://sgw01.cm.nl':			//provider is cm.nl
					cm (service, number, msg, function (err, result){
						Homey.log(err, result);
						callback (err, result)
					});
						break;
				default:												//provider is a dellMont brand
					dellMont (service, number, msg, function (err, result){
						Homey.log(err, result);
						callback (err, result)
					});
				}
			}
		}
}

function dellMont(service, number, msg, callback) {
  Homey.log('DellMont sending SMS to', number);
	let url = service.url+'/myaccount/sendsms.php?username='+service.username+'&password='
						+service.password+'&from='+service.from+'&to='+number+'&text='+msg;
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    //Homey.log(body);
			parseString(body, function (err, result) {
        //Homey.log(result); // check if xml/json data exists
        if (!err && result != undefined) {
          if (result.SmsResponse != undefined) {
						Homey.log(util.inspect(result));
            //Homey.log(result.SmsResponse.resultstring[0]);
            callback((result.SmsResponse.result[0]=='0'), result.SmsResponse.resultstring[0]+' '+result.SmsResponse.description[0]);
            return
          } else Homey.log("no valid SmsResponse");
        } else {
					Homey.log('No valid response from server: '+err);
        	callback(err, null)
				}
      })
	  } else {
      callback(error, body);
      Homey.log("error from server:"+error)
    }
	})
}

function clickatell(service, number, msg, callback) {
  Homey.log('Clickatell sending SMS to', number);
	let url = service.url+'/http/sendmsg?user='+service.username+'&password='
						+service.password+'&api_id='+service.api_id+'&to='+number+'&text='+msg+'&from='+service.from;
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    Homey.log(body);
			let err = false;
			if (body.substr(0, 4) != 'ID: ') {
				err = true;
			};
			callback(err, body);
	  } else {
      callback(error, body);
      Homey.log("error from server:"+error)
    }
	})
}

function textBelt(service, number, msg, callback) {
  Homey.log('TextBelt sending SMS to', number);
	let body = "number="
						 +number
						 +"&message="
						 +msg;
	let options = {
		headers: {'content-type' : 'application/x-www-form-urlencoded'},
		url: service.url,
		body: body
	};
	request.post(options, function(err, resp, body){

		if (err) {
			callback(err, null);
		}
		else if (resp) {
			try {
				let payload = JSON.parse(body);
				callback(null, payload)
			}
			catch(e) {
				let payload = {message : 'Textbelt service down?' };
				callback(true, payload);
			}
		}
		else {
			let payload = {message : 'an unknown error occurred' };
			callback(true, payload);
		}
	})
}

function targetSms(service, number, msg, callback) {
  Homey.log('TargetSMS sending SMS to', number);
	let url = service.url+'/service/sendsms?username='+service.username+'&handle='+service.api_id+'&aff='
						+service.password+'&soort=sms&originator='+service.from+'&to='+number+'&message='+msg;
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    Homey.log(body);
			let err = false;
			if (body.substr(0, 5) != '45000') {
					switch (body.substr(0, 5)) {
					case '45001':
						body='Recipient incorrect (check the to-field)';
					break;
					case '45002':
						body = 'Message to long, absent or contains illegal characters';
					break;
					case '45003':
						body='Destination is blocked by smsinfofilter';
					break;
					case '45004':
						body = 'Destination is blocked by STOP message';
					break;
					case '45005':
						body='Last MO message is expired';
					break;
					case '45011':
						body = 'Incorrect or no affiliate ID (check Password/id)';
					break;
					case '45012':
						body='Incorrect originator';
					break;
					case '45019':
						body = 'Not allowed to send Normal SMS';
					break;
					case '45020':
						body='Message and URL combined are too long';
					break;
					case '45021':
						body = 'No URL given (check url)';
					break;
					case '45025':
						body='Incorrect filetype for recipient list';
					break;
					case '45045':
						body = 'Server down, please try again later';
					break;
					case '50010':
						body='No SMS credits or credit has expired';
					break;
					default:
						body = 'Unkown error '+body.substr(0, 30);
					};
				err = true;
			};
			callback(err, body);
	  } else {
      callback(error, body);
      Homey.log("error from server:"+error)
    }
	})
}


function smsGatewayMe(service, number, msg, callback) {
	let options = {
		headers: {'content-type' : 'application/json'},
		url: service.url+'/api/v3/messages/send',
		json: {
		 email		: service.username,
		 password	: service.password,
		 device		: service.from,
		 number		: number,
		 message	: msg
		 }
	};
	request.post(options, function(err, resp, body){
		Homey.log (body);
//		Homey.log(util.inspect(body.result.success[0]));
		if (!err) {								// error in website
			if (body.success==false) {
					if(body.errors!=undefined){
						callback('error', JSON.stringify(body.errors));
						return;
					}
				};
			if (body.result.success[0]!=undefined){
				if (body.result.success[0].error==''){			// success
//					Homey.log("succes sending the message:"+util.inspect(body.result.success[0]));
					callback(null, body.result.success[0].status);
					return;
				} else {			// error sending message
//					Homey.log("error sending message:"+util.inspect(body.result.success[0]));
					callback('error', JSON.stringify(body.result.success[0].error));
					return;
				};
			};
			if (body.result.fails[0]!=undefined){ // error sending message
//				Homey.log("error sending message:"+util.inspect(body.result.fails[0]));
				callback('error', JSON.stringify(body.result.fails[0].errors));
				return;
			}
			//unknown error
//			Homey.log("error sending message:" + "unknown");
			callback('error', 'unknown');
		} else {
			callback(err, JSON.stringify(body));
			Homey.log("error from server:"+err)
		 }
	})
}


function spryngSms(service, number, msg, callback) {
  Homey.log('spryngSMS sending SMS to', number);
	let url = service.url+'/api/send.php?USERNAME='+service.username+'&PASSWORD='+service.password
						+'&SENDER='+service.from.replace("+", "")+'&DESTINATION='+number.replace("+", "")+'&BODY='+msg;
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    Homey.log(body);
			let err = false;
			if (body.substr(0, 3) != '1') {
					switch (body.substr(0, 5)) {
					case '100':
						body='Missende parameter';
					break;
					case '101':
						body = 'Gebruikersnaam te lang';
					break;
					case '102':
						body='Gebruikersnaam te kort';
					break;
					case '103':
						body = 'Wachtwoord te kort';
					break;
					case '104':
						body='Wachtwoord te lang';
					break;
					case '105':
						body = 'Bestemming te kort, gebruik test nummer formaat vb: 31641041106';
					break;
					case '106':
						body='Bestemming te lang, gebruik test nummer formaat vb: 31641041106';
					break;
					case '107':
						body = 'Afzender te lang, gebruik van nummer formaat vb: 0031641041106';
					break;
					case '108':
						body='Afzender te kort, gebruik van nummer formaat vb: 0031641041106';
					break;
					case '109':
						body = 'Inhoud te lang';
					break;
					case '110':
						body='Inhoud te kort';
					break;
					case '200':
						body = 'Veiligheidsfout';
					break;
					case '201':
						body='Onbekende route';
					break;
					case '202':
						body='Route toegang overtreding';
					break;
					case '203':
						body = 'Onvoldoende credits';
					break;
					case '800':
						body='Technische fout';
					break;
					default:
						body = 'Unkown error '+body.substr(0, 30);
					};
				err = true;
			};
			callback(err, body);
	  } else {
      callback(error, body);
      Homey.log("error from server:"+error)
    }
	})
}

function twilio(service, number, msg, callback) {

	let accountSid = service.api_id;
	let authToken = service.password;
	//require the Twilio module and create a REST client
	let client = require('twilio')(accountSid, authToken);

	client.messages.create({
	 to: number,
	 from: service.from,
	 body: msg,
	}, function(err, message) {
		Homey.log(err);
	 	Homey.log(message);

		if (!err) {
	    Homey.log(message);
			callback(null, message.status);
	  } else {
      callback(true, err.message);
      Homey.log("error from server:"+err)
    }
	});
}


function cm(service, number, msg, callback) {
  Homey.log('CM sending SMS to', number);
	let url = service.url+'/gateway.ashx?producttoken='+service.api_id+'&body='+msg+'&to='+number.replace("+", "00")+'&from='+service.from ;
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    Homey.log(body);
			let err = false;
			if (body != '') {
				err = true;
			};
			callback(err, body);
	  } else {
      callback(error, body);
      Homey.log("error from server:"+error)
    }
	})
}


// ***************https://www.cm.nl/************************************* //
/*

HTTP GET
We also maintain a gateway interface that can be addressed using a HTTP GET method.
This call is limited in its features and only supports the basic parameters (FROM, TO, BODY and REFERENCE),
options such as concatenation (multipart), unicode, and hybrid messaging are not supported.
We advise to use our HTTP POST call if possible.
https://sgw01.cm.nl/gateway.ashx?producttoken=00000000-0000-0000-0000-000000000000&body=Example+message+text&to=00447911123456&from=SenderName&reference=your_reference

Parameter
Description

PRODUCTTOKEN
Required. This is the product token that was sent to you by email. Example: 00000000-0000-0000-0000-000000000000'

MSG
Required. The msg-tag signals the start of a message and should comprise of at least a from, to and body-tag. One HTTP-call can support up to 1000 msg elements.

FROM
Required. This is the sender name. The maximum length is 11 alphanumerical characters or 16 digits. Example: 'CM Telecom'

TO
Required. This is the destination mobile number. Restrictions: this value should be in international format. A single mobile number per request. Example: '00447911123456'

BODY
Required. This is the message text. Restrictions: the maximum length is 160 characters.

REFERENCE
Here you can include your message reference. This information will be returned in a status report so you can match the message and it's status.
It should be included in the XML when posting. Restrictions: 1 - 32 alphanumeric characters and reference will not work for demo accounts.

*/



// ***************twilio.com************************************* //

/*
HTTP POST to Messages

To send a new outgoing message, make an HTTP POST to your Messages list resource URI:

https://{AccountSid}:{AuthToken}@api.twilio.com/2010-04-01/Accounts

/2010-04-01/Accounts/{AccountSid}/Messages

accountSid 'ACe8c22f1ab67a5351050345c0284b64c5'; //testaccount
authToken  'your_auth_token';

To		The destination phone number. Format with a '+' and country code e.g., +16175551212 (E.164 format).
From 	A Twilio phone number
Body	The text of the message you want to send, limited to 1600 characters.

Error codes:
30001	Queue overflow	You tried to send too many messages too quickly and your message queue overflowed. Try sending your message again after waiting some time.
30002	Account suspended	Your account was suspended between the time of message send and delivery. Please contact Twilio.
30003	Unreachable destination handset	The destination handset you are trying to reach is switched off or otherwise unavailable.
30004	Message blocked	The destination number you are trying to reach is blocked from receiving this message (e.g. due to blacklisting).
30005	Unknown destination handset	The destination number you are trying to reach is unknown and may no longer exist.
30006	Landline or unreachable carrier	The destination number is unable to receive this message. Potential reasons could include trying to reach a landline or, in the case of short codes, an unreachable carrier.
30007	Carrier violation	Your message was flagged as objectionable by the carrier. In order to protect their subscribers, many carriers have implemented content or spam filtering. Learn more about carrier filtering
30008	Unknown error	The error does not fit into any of the above categories.
30009	Missing segment	One or more segments associated with your multi-part inbound message was not received.
30010	Message price exceeds max price.	The price of your message exceeds the max price parameter.

*/

// ***************spryng.com************************************* //
/*
Koppelen aan de gateway
Om een bericht te verzenden kan er een HTTP GET of HTTP POST call uitgevoerd worden naar het volgende adres: " https://api.spryngsms.com/api/send.php "

Parameter
USERNAME	Gekozen door gebruiker bij aanmelding op http://www.spryng.nl
PASSWORD	Gekozen door gebruiker bij aanmelding op http://www.spryng.nl
REFERENCE	Unieke referentie voor delivery reports
DESTINATION	Nummer(s) bestemming
SENDER	Afzender van het bericht
BODY	Inhoud van de SMS
SERVICE	Referentie tag die toegevoegd kan worden om tussen eindgebruikers te differentiëren
ROUTE	Om de Spryng Business, Spryng Economy route of een speciale route te gebruiken
ALLOWLONG	Als u Long SMS wenst te versturen

Username
Gekozen door gebruikers bij aanmelding op http://www.spryng.nl
Optie
Vereist	ja
Type	Alfanumeriek, Case gevoelig
Min lengte	2
Max lengte	32
Min waarde	<na>
Max waarde	<na>
Waardes	<na>
Default waarde	<none>
Voorbeeld	USERNAME=username

Password
Gekozen door gebruikers bij aanmelding op http://www.spryng.nl
Optie
Vereist	ja
Type	Alfanumeriek, Case gevoelig
Min lengte	6
Max lengte	32
Min waarde	<na>
Max waarde	<na>
Waardes	<na>
Default waarde	<none>
Voorbeeld	PASSWORD=password
References
Optie
Vereist	Alleen wanneer u delivery reports wenst te ontvangen
Type	Alfanumeriek
Min lengte	1
Max lengte	256
Waardes	<na>
Default waarde	<none>
Voorbeeld	REFERENCE=abc123
Opmerkingen	Moet uniek zijn

Destination
Nummer(s) bestemming
Optie
Vereist	ja
Type	MSISDN-numeriek (internationaal format zonder “00” of
“+”)
Min lengte	1 MSISDN
Max lengte	1.000 MSISDN
Min waarde	<na>
Max waarde	<na>
Waardes	<na>
Default waarde	<none>
Voorbeeld	DESTINATION=31641041106,31612345678
Opmerkingen	Meer details over foutafhandeling zie “Return Values” onderaan de pagina

Sender
Afzender van het bericht
Optie
Vereist	ja
Type	Numeriek of Alfanumeriek
Min lengte	1
Max lengte	14 voor numeriek of 11 voor alfanumeriek
Min waarde	<na>
Max waarde	<na>
Waardes	<na>
Default waarde	<none>
Voorbeeld	SENDER=0031641041106
Opmerkingen	Meer details over foutafhandeling zie “Return Values” onderaan de pagina

Body
Inhoud van de SMS
Optie
Vereist	ja
Type	GSM 7-bit alfabet voor tekstberichten
Min lengte	1
Max lengte	160 karakters voor tekst bericht (default : ALLOWLONG=0) 612 karakters (ALLOWLONG=1)
Wanneer u Long SMS gebruikt, zal het systeem het bericht automatisch verdelen in 153 karakters per sms.
Min waarde	<na>
Max waarde	<na>
Waardes	<na>
Default waarde	<none>
Voorbeeld	BODY=This%20is%20a%20test%20SMS
Opmerkingen	Meer details over karakters zie “Field types” onderaan de pagina

Service
Referentie tag kan gebruikt worden om een filter in statistieken te creëren.
Optie
Vereist	nee
Type	Alfanumeriek
Min lengte	1
Max lengte	10
Min waarde	<na>
Max waarde	<na>
Waardes	<na>
Default waarde	<none>
Voorbeeld	SERVICE=Client1

Route
Om de Spryng Business, Spryng Economy of Specific User route te selecteren.
Optie
Vereist	ja
Type	Vooraf gedefinieerd
Min lengte	<na>
Max lengte	<na>
Min waarde	<na>
Max waarde	<na>
Waardes	BUSINESS, ECONOMY, 0-9 (Specific User route)
Default waarde	BUSINESS
Voorbeeld	ROUTE=BUSINESS

Allowlong
Als u Long SMS wenst te versturen
Optie
Vereist	Alleen als u Long SMS wenst te versturen
Type	Vooraf gedefinieerd
Min lengte	<na>
Max lengte	<na>
Min waarde	<na>
Max waarde	<na>
Waardes	0,1
Default waardes	0
Voorbeeld	ALLOWLONG=1
Opmerkingen	Wanneer u Long SMS gebruikt, zal het systeem het bericht automatisch verdelen in 153 karakters per sms.

Return Values
Return Waarde
1	Succesvol ontvangen
100	Missende parameter
101	Gebruikersnaam te lang
102	Gebruikersnaam te kort
103	Wachtwoord te kort
104	Wachtwoord te lang
105	Bestemming te kort
106	Bestemming te lang
107	Afzender te lang
108	Afzender te kort
109	Inhoud te lang
110	Inhoud te kort
200	Veiligheidsfout
201	Onbekende route
202	Route toegang overtreding
203	Onvoldoende credits
800	Technische fout
*/

// ***************smsgateway.me************************************* //
/*
function sendMessageToNumber($to, $message, $device, $options=[]) {
		$query = array_merge(['number'=>$to, 'message'=>$message, 'device' => $device], $options);
		return $this->makeRequest('/api/v3/messages/send','POST',$query);
}

# Send message to number
The most popular use of SMS Gateway API is sending messages. You can use our service to programmatically send a message through your Android phone.

API Reference

API Endpoint
URL:	http://smsgateway.me/api/v3/messages/send
Method:	POST

Request Parameters
Parameter						Required						Description
email								YES									Your username for the site
password						YES									Your password for the site
device							YES									The ID of device you wish to send the message from
number							YES									The number to send the message to
message							YES									The content of the message to be sent
send_at							NO									Time to send the message in Unix Time format
expires_at					NO									Time to give up trying to send the message at in Unix Time format

Success Response
Status Code:	200 OK
Content Type:	application/json
Output format:	See Example

Failed Response
Status Code:	200 OK
Content Type:	application/json
Output format:	See Example

{
"success": true,
"result": {
	"success": [
		{
		"id": "308",
		"device_id": "4",
		"message": "hello world!",
		"status": "pending",
		"send_at": "1414624856",
		"queued_at": "0",
		"sent_at": "0",
		"delivered_at": "0",
		"expires_at": "1414634856",
		"canceled_at": "0",
		"failed_at": "0",
		"received_at": "0",
		"error": "None",
		"created_at": "1414624856",
		"contact": {
			"id": "14",
			"name": "Phyllis Turner",
			"number": "+447791064713"
			}
		}
		],
	"fails": [
	]
	}
}

{
"success": true,
"result": {
	"success": [
	],
	"fails": [
		"number": "+44771232343"
		"message": "hello world!",
		"device": 1
		"errors": {
			"device": ["The selected device is invalid"],
			}
		]
	}
}

*/

// ***************TEXTBELT************************************* //
  /*  Send a text message to the provided
  		phone number.
  		Message limit details on http://textbelt.com
  		Internal errors will be provided in first param
  		of callback.
  		Params:
  			number: phone number to send to
  			msg: text message which will be sent
  			callback(err, result): callback to be called
  */



// ***************DellMont (Voipbuster, Freecall, Cheapvoip, etc)************************************* //

/*
see list and tariffs: https://www.voipkredi.com/page.php?page=betamax-dellmont
or: http://progx.ch/home-voip-prixbetamax-3-1-1.html
or: http://www.voipconnect.com/about

https://www.voipbuster.com/myaccount/sendsms.php?username=xxxxxxxxxx&password=xxxxxxxxxx&from=xxxxxxxxxx&to=xxxxxxxxxx&text=xxxxxxxxxx
https://www.freecall.com/myaccount/sendsms.php?username=xxxxxxxxxx&password=xxxxxxxxxx&from=xxxxxxxxxx&to=xxxxxxxxxx&text=xxxxxxxxxx
https://www.cheapvoip.com/myaccount/sendsms.php?username=xxxxxxxxxx&password=xxxxxxxxxx&from=xxxxxxxxxx&to=xxxxxxxxxx&text=xxxxxxxxxx
Explanation of the variables:
	username: your username
	password: your password
	from: your username or your verified phone number. Always use international format for the number starting with +, for instance +491701234567
	to: the number you wish to send the sms to. Always use international format starting with +, for instance +491701234567
	text: the message you want to send

https://www.freecall.com/myaccount/sendsms.php?username=gruijter&password=ljcgmiypq&from=+31612862971&to=+31612862971&text="hello world'
*/



// ***************clickatell************************************* //
/*
http://www.domoticz.com/wiki/SMS_Notifications

API Key: is the ID that was assigned to your (http) api
User ID: the same that use use to login into Clickatell's webpage.
Password: the same that use use to login into Clickatell's webpage.
From: enter your own phone number. The one that you authenticated as a valid sender id for your account. If you fail to register any sender id with Clickatell, your message will still be delivered, but with a default sender id.
To: one or more mobile numbers can be entered, separated by a comma. You can either use an international format (with the + sign), or a local number if you set up your clickatell account to automatically convert mobile numbers to International format. A message will be sent out to each of the numbers listed here. Example: +316123456789,6421876543.

Now click on the "Test" button and see what happens.
If no sms message arrives, try to debug the problem by manually sending an sms message via your browser. Use the link:

https://api.clickatell.com/http/sendmsg?user=xxxxxx&password=xxxxxxxx&api_id=xxxxxx&to=15XXXXXXX&text=test&from=13XXXXXXXXX

A successful submission should yield: "ID: (some number)". In case of an error, it will be displayed.
*/


//**************general sms service info**************************//
/*
http://www.gratostel.com/sms.html



*/

// ***************TargetSMS************************************* //
/*
To send Normal SMS messages, your server must call the following URL with HTTP GET:

http://www.targetsms.nl/service/sendsms

The following variables apply:
Variable 			Description 							Format 						Mandatory 			Example
username 			TargetSMS username 				Alphanumerical 		Yes 						test
handle 				TargetSMS handle 					Alphanumerical 		Yes 						d6861a8 f669 7a28342
aff 					TargetSMS customer ID 		Alphanumerical 		Yes							12345
soort					SMS type: sms,WAP push		'sms', 'push',		Yes							push
							or flash 									’flash’
originator 		Number to use as sender 	Alphanumerical 		Yes/No** 				31612345678
filetype 			Type of recipients list 	Numerical 				No
to 						Recipients phonenumber		Alphanumerical 		Yes 						31611112222
							or URL to recipients list
message 			Message to send 					Alphanumerical 		Yes 						Hello world
deliverydate Time to sent 							Numerical 				No 							3112072359
url 					URL of the WAP push				Alphanumerical 		Yes/No* 				http://www.test.nl
							message
pushexpires 	Expiring of the push			 Numerical 				Yes/No* 				7
							message

* : These are mandatory when sending WAP push messages.
**: Omitted when sending WAP push messages.

Explanation:
- username: The username of your TargetSMS account;
- handle: Hash ID that belongs to your TargetSMS account. This is not your TargetSMS login password. You can find it on www.targetsms.nl/handle (after log in)
- aff: Your TargetSMS affiliate ID;
- soort: Use 'sms' for a standard text message or 'push' for a WAP push or ‘flash’ for a flash message
- originator: the value to use as sender. This may be either a phonenumber or a short text. Please note:
		o This value is omitted when sending a WAP push message, there is no 'sender'field for WAP push messages;
		o When using a textstring as originator, the maximum length is 11 characters. Do not use other characters than A-Z, a-z and 0-9. E.g. no diacritical characters.
		o When using a phonenumber as originator, the maximum length is 16 characters. A '+' will be placed before the phonenumber automatically.
- filetype: This field is optional. When you want to send a large batch or more than 1000 messages, you can fill in an URL instead of a list with phonenumbers for the 'to' field. The phonenumbers will be downloaded from that URL. In filetype you need to specify the format of the file with phonenumbers:
	o Use 1 when the recipients are separated by semi-colons;
	o Use 2 for comma-separated;
	o Use 3 when the phonenumbers are separated by newlines (CRLF, \r\n)
- to: Phonenumber of the recipient with country-prefix, without dashes. For example: 31612345678. You can specify up to 1000 recipients in the to field, separate them with commas. When filetype is filled in, an URL to the list with recipients is expected.
- message: text of the message to send. A normal text message cannot be longer than 160 characters. You can use the following characters: a-z, A-Z, 0-9, +%#()*+,/:;<=>?_£¥§ÄÅÜäèéìñòöùü=”€’  note: The € sign is encoded as %80 and counts for 2 characters
- deliverydate: when the SMS message should not be sent instantly, the date and time of sending can be specified in the following format: DDMMYYHHMM.
- url: URL to send in the WAP push message. The length of the messagetext and URL combined may be no more than 80 characters. This applies only to WAP push messages.
- pushexpires: the number of days that the WAP push message will remain valid after receipt by the end-user. Note that the SMS gateway will send this field as a date to the end-user. If the end-user has a wrong date/time setting, the WAP push link will not work.

Example:
http://www.targetsms.nl/service/sendsms?username=test&handle=d6861a8 f669 f67a28&aff=12345&soort=push&originator=31612345678&to=31611112222&message=Hello +World&deliverydate=3112072359&url=http%3A%2F%2Fwww.test.nl&pushexpires=7

Response:
When the message has been sent, the response will be:  45000

Errors:
If not OK, one of the following error-codes will be returned:

45001 Recipient incorrect (check the 'to'-field)
45002 Message to long, absent or contains illegal characters
45003 Destination is blocked by smsinfofilter
45004 Destination is blocked by STOP message
45005 Last MO message is expired
45011 Incorrect or no affiliate ID (check 'aff')
45012 Incorrect originator
45019 Not allowed to send Normal SMS
45020 Message and URL combined are too long
45021 No URL given (check 'url')
45022 Deliverydate must be numerical and have 10 digits
45023 Deliverydate is in the past
45024 Non-numerical value given for pushexpires
45025 Incorrect filetype for recipient list
45045 Server down, please try again later
50010 No SMS credits or credit has expired

*/
