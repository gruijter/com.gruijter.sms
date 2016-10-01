

module.exports = [

  {

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
