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
			Homey.log('the message was sent',error, result);
			Homey.manager('api').realtime('testing_ready', { error : error, result : result }); // send result back to settings html
		});
	} else {Homey.log("settings have changed")}
})

function send (service, number, msg, callback) {
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
		default:												//provider is a dellMont brand
			dellMont (service, number, msg, function (err, result){
				Homey.log(err, result);
				callback (err, result)
			});
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
