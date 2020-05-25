# Send SMS #

A small Homey app to send text messages via a choice of over 80 SMS providers.

In this age of IoT there is still a need to send messages by SMS. This small app
supports about 80 SMS providers. These are paid SMS services where you need an account.

46elks, AspSMS, BulkSMS, Clickatell, CM Direct, Free Mobile (fr), Messagebird, TargetSMS,
TextBelt, Twilio, SendInBlue, Spryng.

DellMont: This includes more than 60 voipservices like Voipbuster, Freecall,
          Cheapvoip, etc.

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

Version changelog: [changelog.txt]

[forum]: https://community.athom.com/t/3025
[pp-donate-link]: https://www.paypal.me/gruijter
[pp-donate-image]: https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif
[changelog.txt]: https://github.com/gruijter/com.gruijter.sms/blob/master/changelog.txt
