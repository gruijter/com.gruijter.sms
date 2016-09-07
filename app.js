"use strict";

var util = require('util');
var request = require('request');
var parseString = require('xml2js').parseString;
var settings;

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
		var testService=Homey.manager('settings').get('testing');
		Homey.log(testService);
		send (testService, testService.toTest, testService.testMessage, function(error, result){
			Homey.log('send test completed',error, result);
			Homey.manager('api').realtime('testing_ready', { error : error, result : result }); // send result back to settings html
		});
	} else {Homey.log("settings have changed")}
})

function send (service, number, msg, callback) {
	if (service.provider!=undefined){
	  switch (service.provider.substr(0, 20)) {
			case 'http://textbelt.com/':		//provider is textbelt
				textBelt (service, number, msg, function (err, result){
					var error = err || !result.success;
					Homey.log('error: ',err, error, result);
					if (error) {var message = result.message}
					else {var message = result.success};
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
			default:												//provider is a dellMont brand
				dellMont (service, number, msg, function (err, result){
					Homey.log(err, result);
					callback (err, result)
				});
			}
		}
}

function dellMont(service, number, msg, callback) {
  Homey.log('DellMont sending SMS to', number);
	var url = service.url+'/myaccount/sendsms.php?username='+service.username+'&password='
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
	var url = service.url+'/http/sendmsg?user='+service.username+'&password='
						+service.password+'&api_id='+service.api_id+'&to='+number+'&text='+msg+'&from='+service.from;
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    Homey.log(body);
			var err = false;
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
	var body = "number="
						 +number
						 +"&message="
						 +msg;
	var options = {
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
				var payload = JSON.parse(body);
				callback(null, payload)
			}
			catch(e) {
				callback(e, null)
			}
		}
		else {
			callback(new Error('an unknown error occurred'), null);
		}
	})
}

function targetSms(service, number, msg, callback) {
  Homey.log('TargetSMS sending SMS to', number);
	var url = service.url+'/service/sendsms?username='+service.username+'&handle='+service.api_id+'&aff='
						+service.password+'&soort=sms&originator='+service.from+'&to='+number+'&message='+msg;
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    Homey.log(body);
			var err = false;
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
