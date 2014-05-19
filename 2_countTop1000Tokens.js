var fs = require('fs'),
    q = require('q'),
    redis = require('redis').createClient();


function countTop1000Tokens(){
  var top1000, output = '';

  function getTop1000FromRedis(){
    var deferred = q.defer();

    redis.zrevrange('tokenCount', 0, 1000,  'WITHSCORES', function(err, results){
      if(err){
        console.log(err);
        deferred.reject();
      }else{
        top1000 = results;
        deferred.resolve();
      }
    });

    return deferred.promise;
  }
  function convertArrayToCSV(){
    var deferred = q.defer();

    for (var i = 0; i < top1000.length; i++) {

      if(i%2 === 0){
        output += '"' +  top1000[i] + '",';
      }else{
        output += top1000[i] + '\n';
      }
    };

    deferred.resolve();
    return deferred.promise;
  };

  function saveTop1000ToCSV(){
    var deferred = q.defer();
    
    fs.writeFile('top1000Tokens.csv', output, function(err){
      if(err){
        console.log(err);
        deferred.reject();
      }else{
         deferred.resolve();
      }
    })
   
    return deferred.promise;
  }

  function start(){
    getTop1000FromRedis()
      .then(convertArrayToCSV)
      .then(saveTop1000ToCSV)
      .then(function(){
        console.log('complete');
        redis.end();
      });
  }

  start();
}




countTop1000Tokens();









