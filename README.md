# Send SMS #

Homey app to send text messages over SMS.

In this age of IoT there is still a need to send messages by SMS. This small app
supports a large number of SMS providers:

smsGate: use your own android phone as SMS gateway. (note: from-number=deviceID)

AspSMS, Clickatell, CM Direct, TargetSMS, Twilio and Spryng:
          These are paid SMS services where you need an account

TextBelt: Unfortunately the free sending of SMS is not working anymore. You now
          need to buy credit to use it.

DellMont: This includes more than 60 voipservices like Voipbuster, Freecall,
          Cheapvoip, etc. These are paid services, so you need an account and
          credit to use it. Also for these providers some numbers might not be
          reachable.

After setting up the SMS-service provider you want to use, you have the
possibility to send messages via an action flow card.

### Known limitations: ###
TargetSMS uses an API that sends the message requests as clear text unsecure
over the internet. The other SMS providers use the secured https method.
You can only set/use one SMS provider at the same time.

##### Donate: #####

If you like the app you can show your appreciation by posting it in the [forum],
and if you really like it you can buy me a beer. Feature requests can be placed on
the forum.

[![Paypal donate][pp-donate-image]][pp-donate-link]


===============================================================================

Version changelog
```
v2.0.0  2018.04.02 Rewrite to sdk2. Less memory usage (removed xml2js and request).
        Added AspSMS and DellMont SMS services. Added logger.
v1.0.3  2017.04.08 Request updated to 2.81.0
v1.0.2  2017.02.27 added CM Direct. Usability improvements. Minor bug fixes
v1.0.1  2017.01.14 added SpryngSMS and Twilio
v1.0.0  2016.12.05 Xml2js updated to 0.4.17. Request updated to 2.79.0. Minor
        code changes.
v0.0.6  2016.11.08 Fix crash undefined provider
v0.0.5  2016.10.01 Compatibility to fw 0.10.1. added www icon
v0.0.4  2016.09.08 Added targetsms and smsGate.me as SMS service. Added website
        link in settings. Fix crash undefined provider.
v0.0.3  2016.09.04 Fixed broken DellMont. Testbutton added
v0.0.2  2016.09.02 Added Clickatell and VoiceTrading as SMS service
v0.0.1  2016.09.01 Initial release
```

[forum]: https://forum.athom.com/discussion/1906
[pp-donate-link]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=ZKU3U2V3P2YJ2
[pp-donate-image]: https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif
