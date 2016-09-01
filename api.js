

module.exports = [

  {
    // validate account for use with settings page
    description: 'Validate settings',
    method: 'GET',
    path:	'/validate',
    requires_authorization: true,
    role: 'owner',
    fn: function (callback, args) {
      var service = args.query;
      Homey.log("api validation entered");
      Homey.log(args);
      Homey.log(service);

      Homey.app.send(service, service.toTest, service.testMessage, function (err, result){
      	//Homey.log(err, result);
        callback (err, result);
      });
    }
  }


]

/*        //To call the api (e.g. in settings html:)
          Homey.api('GET', '/validate?' + $.param(saveData), function(err, result) {
            //console.log(err, result);
            document.getElementById('testresult').innerHTML = result;
            if (!err){
              setTimeout(function () {
                Homey.set('settings', saveData, function (error, settings) {
                  if (error) {return console.error(error)}
                });  //also works without function, so why the callback?
              }, 2000) // and why the timeout?
            }
          })
*/
