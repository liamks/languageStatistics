var fs = require('fs'),
    q = require('q'),
    csv = require('csv'),
    program = require('commander'),
    redis = require('redis').createClient(),
    TOP_LIMIT = 250, // max tokens of interest
    top1000Tokens = fs.readFileSync('top1000Tokens.csv', 'UTF-8');


program.option('-o, --output <s>', 'Processed data output')
  .parse(process.argv);

PROCESSED_DATA_FILE_NAME = program.output;

function transformData(){
  var tokenIndex = {}, rawResults, processed = [];

  function createHeader(){
    var output = [
      'project',
      'path',
      'file',
      'extension',
      'shebang',
      'total_tokens'
    ];

    for (var i = 0; i < TOP_LIMIT; i++) {
      output.push('t' + i);
    };

    return output.join(',') + '\n';
  };


 function createZeroedArray(){
    var out = [];

    for (var i = 0; i < TOP_LIMIT; i++) {
        out.push(0);
    };

    return out;
  }

  function escape(str){
    return '"' + str + '"';
  };

  function createFileArray(){
    var deferred = q.defer(),
        tokenCount,
        tokenTotal,
        tokens,
        token,
        tokenI,
        output,
        row;


    for (var i = 0; i < rawResults.length; i++) {
      row = JSON.parse(rawResults[i]);
      tokenCount = row[6]
      tokenTotal = row[5];
      tokens = Object.keys(tokenCount);
      output = createZeroedArray();

      for (var j = 0; j < tokens.length; j++) {
        token = tokens[j];
        tokenI = tokenIndex[token];

        if(tokenI !== undefined){
          output[tokenI] = tokenCount[token]/tokenTotal;
        }
      };

      row.pop();
      Array.prototype.push.apply(row, output);
      processed.push(row.join(','));
    };

    processed = processed.join('\n');
    deferred.resolve();
    return deferred.promise;
  }


  function writeToFile(){
    var deferred = q.defer();

      fs.writeFile(PROCESSED_DATA_FILE_NAME, processed, {flag: 'a'}, function(err){
        if(err){
          console.log('error appending data to file');
          console.log(err);
        }
        deferred.resolve();
      });


    return deferred.promise;
  }

  function openFile(){
    var deferred = q.defer();

    fs.writeFile(PROCESSED_DATA_FILE_NAME, createHeader(), function(){
      deferred.resolve();
    });

    return deferred.promise;
  }


  function createTokenIndex(){
    var list = top1000Tokens.trim(),
        all = [],
        deferred = q.defer();

    csv().from.string(list).to.array(function(data){

      all = data.map(function(pair){
        return pair[0];
      });
      all = all.splice(0, TOP_LIMIT);

      for (var i = 0; i < all.length; i++) {
        tokenIndex[all[i]] = i;
      };

      deferred.resolve();
    });

    return deferred.promise;
  }

  function fetchDataFromRedis(){
    var deferred = q.defer();

    redis.lrange('fileTokenCount', 0, -1, function(err, results){
      rawResults = results;
      deferred.resolve();
    });


    return deferred.promise;
  }

  function start(){
    openFile()
      .then(openFile)
      .then(createTokenIndex)
      .then(fetchDataFromRedis)
      .then(createFileArray)
      .then(writeToFile)
      .then(function(){
        redis.end();
        console.log('complete.');
      },
      function(err){
        console.log(err);
      });
  }

  start();
}

transformData();

