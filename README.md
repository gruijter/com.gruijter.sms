# Send SMS #

Homey app to send text messages over SMS.

In this age of IoT there is still a need to be able to send messages by SMS.
The app supports a large number of SMS providers:

TextBelt: Free sending of SMS for US, Canada, and International. You will have
          to try if it works for the numbers you want to reach...

smsGate: use your own android phone as SMS gateway. (note: from-number=deviceID)

Clickatell and TargetSMS: These are paid SMS services where you need an account

DellMont: This includes more than 60 voipservices like Voipbuster, Freecall,
          Cheapvoip, etc. These are paid services, so you need an account and
          credit to use it. Also for these providers some numbers might not be
          reachable.

After setting up the SMS-service provider you want to use, you have the
possibility to send messages via an action flow card.

### Known limitations: ###
TextBelt and TargetSMS use an API that sends the message requests as clear text
over the internet. The other SMS providers use 'https get' and are therefore
more secure.
You can only set/use one SMS provider at the same time.

##### Donate: #####

If you like the app you can show your appreciation by posting it in the [forum],
and if you really like it you can donate. Feature requests can also be placed on
the forum.

[![Paypal donate][pp-donate-image]][pp-donate-link]


===============================================================================

Version changelog
```
v0.0.4  2016.09.08 Added targetsms and smsGate.me as SMS service. Added website
        link in settings. Fix crash undefined provider.
v0.0.3  2016.09.04 Fixed broken DellMont. Testbutton added.
v0.0.2  2016.09.02 Added Clickatell and VoiceTrading as SMS service
v0.0.1  2016.09.01 Initial release
```

[forum]: https://forum.athom.com/discussion/1906
[pp-donate-link]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=ZKU3U2V3P2YJ2
[pp-donate-image]: https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif
