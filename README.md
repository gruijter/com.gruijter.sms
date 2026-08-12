# Send SMS #

A small Homey app to send text messages via a choice of over 90 SMS providers.

In this age of IoT there is still a need to send messages by SMS. After setting up the SMS-service provider you want to use, you have the possibility to send messages via an action flow card.

## Supported providers ##

### Use your own SIM: httpSMS ###

Install the httpSMS app on an old Android phone and use the credits of your own SIM card. See the [httpSMS docs][httpsms-docs] for installation and setup.

> **⚠️ Risk:** not on the Play Store, so this means sideloading an APK - only use the official app/links from httpsms.com, and use a spare device, since it needs SMS permissions.

### Paid providers ###

These need an account (and usually credit) with the provider itself. 46elks, Africa's Talking, AspSMS, BulkSMS, Burst SMS, Cheapconnect.net (nl), Clickatell, ClickSend, Clockwork SMS, CM Direct, Free Mobile (fr), Gatewayapi, Messagebird, Plivo, SendInBlue, Seven, SpryngSMS, TargetSMS, Telnyx, Textbelt, TextMagic, Twilio and Vonage.

### DellMont ###

More than 60 white-label VoIP/SMS resellers running on the same DellMont platform, including: 12VoIP, Actionvoip, BrowserCalls, BudgetVoip, BudgetVoipCall, Call2India, CallEasy, CallingCardBuster, CallingCredit, CallPirates, CheapBuzzer, CheapVoip, CheapVoipCall, CosmoVoip, DialCheap, DialNow, DiscountCalling, DiscountVoip, EasyVoip, FreeCall, FreeVoipDeal, Frynga, GlobalFreecall, HotVoip, Internetcalls, InterVoip, Jumblo, JustVoip, Low-Rate Voip, MegaVoip, MexicoBarato, NairaCalls, Netappel, Nonoh, PanggilanMalaysia, PennyConnect, PinoyDialer, PoivY, PowerVoip, RebVoice, Rynga, SIPDiscount, SmartVoip, SMS Discount, SMSLISTO, StuntCalls, SuperVoip, Telbo, VoiceTrading, VoipaLot, Voipblast, VoipBlazer, VoipBuster, VoipbusterPro, VoipCaptain, VoipCheap, VoipChief, VoipDiscount, VoipGain, VoipJumper, VoipMove, VoipRaider, VoipSmash, VoipStunt, VoipWise, VoipYo, VoipZoom and WebCallDirect. These are also paid services, so you need an account and credit to use them.

### Known limitations: ###
TargetSMS uses an API that sends the message requests as clear text unsecure over the internet. The other SMS providers use the secured https method. You can only set/use one SMS provider at the same time. Depending on the provider some numbers might not be reachable.

##### Donate: #####

If you like the app you can show your appreciation by posting it in the [forum], and if you really like it you can buy me a beer. Feature requests can be placed on the forum.

[![Paypal donate][pp-donate-image]][pp-donate-link]


===============================================================================

Version changelog: [changelog.txt]

[forum]: https://community.athom.com/t/3025
[pp-donate-link]: https://www.paypal.me/gruijter
[pp-donate-image]: https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif
[changelog.txt]: https://github.com/gruijter/com.gruijter.sms/blob/master/changelog.txt
[httpSMS]: https://httpsms.com
[httpsms-docs]: https://docs.httpsms.com
