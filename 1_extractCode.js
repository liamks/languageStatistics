var fs = require('fs'),
    glob = require('glob'),
    istextorbinary = require('istextorbinary'),
    csv = require('csv'),
    counter = require('./countTokens'),
    shebang = require('shebang'),
    program = require('commander'),
    path = require('path'),
    q = require('q'),
    filesPerSecond = 500,
    REDIS_TOTALS_KEY = 'tokenCount',
    REDIS_ALL_DATA_KEY = 'fileTokenCount',
    redis = require('redis').createClient();

program.option('-r, --repoDir <s>', 'Directory with repos')
       .parse(process.argv);



/*
  extract the contents of files that are not binary
  and place their contents into Redis.

  It is assumed that each folder in repoDir is a
  repository. The repo name will be extracted
  from a files path
*/


function extractDataFromAFile(repo, file, cb){
  var fileStats, fileData, fileShebang, tokenCount, tokenTotal, fileArray, dataArray;

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

  function stats(){
    var deferred = q.defer();

    fs.stat(file, function(err, fs){
      if(err || fs.isDirectory()){
        return deferred.reject();
      }

      fileStat = fs;
      deferred.resolve();
    });

    return deferred.promise;
  }

  function readFile(){
    var deferred = q.defer();

    fs.readFile(file, function(err, data){
      if(!data || (data && istextorbinary.isBinarySync(file, data))){
        deferred.reject(null);
        return deferred.promise;
      }
      fileData = data.toString('utf8');
      deferred.resolve();  
    });

    return deferred.promise;
  }


  function getSheBang(){
    var deferred = q.defer(),
        firstNCharacters = fileData.slice(0,300),
        firstLineMatch = firstNCharacters.match(/(.*)\n/);

    if(!firstLineMatch){
      fileShebang = '';
      deferred.resolve(null);
    }else{
      fileShebang = shebang(firstLineMatch[1]) || '';
      deferred.resolve();
    }

    return deferred.promise;
  }


  function countTokens(){
    var deferred = q.defer();

    tokenCount = counter.run(fileData);
    deferred.resolve();

    return deferred.promise;
  }

  function calculateTokenTotal(){
    var deferred = q.defer(),
        multi = redis.multi();

    tokenTotal = 0

    Object.keys(tokenCount).forEach(function(key){
      // save to redis to get top 1000 keys
      multi.zincrby(REDIS_TOTALS_KEY, tokenCount[key], key);
      tokenTotal += tokenCount[key];
    });

    multi.exec(function(){
      deferred.resolve();
    });
    
    return deferred.promise;
  }


  function createJSONObj(){
    var deferred = q.defer(),
        relativePath = file.match(new RegExp('/' + repo + '(.*)'))[1];
        words = Object.keys(tokenCount),
        output = [
          repo.match(/^([\w\.\-]*)-\w+$/)[1], // repos include branch name, get rid of that
          escape(relativePath.replace(path.basename(file), '')), // path to file in repo
          escape(path.basename(file)),
          escape(path.extname(file)),
          fileShebang,
          tokenTotal,
          tokenCount
        ];


      deferred.resolve(output);

      return deferred.promise;
  }

  function saveToRedis(data){
    var deferred = q.defer();

    redis.lpush(REDIS_ALL_DATA_KEY, JSON.stringify(data), function(){
      deferred.resolve();
    });

    return deferred.promise;
  }

  stats().then(readFile)
    .then(getSheBang)
    .then(countTokens)
    .then(calculateTokenTotal)
    .then(createJSONObj)
    .then(saveToRedis)
    .then(cb, function(e){
      if(e){
        console.log(e);
      }
      cb();
    });
}


function extractCode(repoDir){
  var repoDir = repoDir[repoDir.length - 1] === '/' ? repoDir : repoDir + '/';

  function error(msg){
    console.log(msg);
  }

  function extractTextFromFile(fileArray){
    var deferred = q.defer(),
        file = fileArray[1],
        repo = fileArray[0],
        str;

    extractDataFromAFile(repo, file, function(){
      deferred.resolve();
    });

    return deferred.promise;
  }


  function openFilesInRepo(files){
    var promises = [];

    files.forEach(function(file){
      promises.push(extractTextFromFile(file));
    });

    return q.all(promises);
  }


  function getFilesInRepos(repos){
      var deferred = q.defer(),
          repoFiles = [],
          path;

      repos.forEach(function(repo){
        path = repoDir + repo + '/**/*';
        glob.sync(path).forEach(function(file){
          repoFiles.push([repo, file]);
        });
      });
      deferred.resolve(repoFiles);
      return deferred.promise;
  }

  function getListOfRepos(){
    var deferred = q.defer();

    fs.readdir(repoDir, function(err, results){
      var folders = results.filter(function(folder){
        return fs.statSync(repoDir + folder).isDirectory();
      });

      if(err){
        deferred.reject(err);
      }else{
        deferred.resolve(folders);
      }
    });

    return deferred.promise;
  }
  
  function clearRedis(){
    var deferred = q.defer();

    deferred.resolve();
    // redis.del(REDIS_TOTALS_KEY, function(err){
    //   redis.del(REDIS_ALL_DATA_KEY, function(){
    //     deferred.resolve();
    //   });
    // });

    return deferred.promise;
  }

  function start(){
    var startTime = Date.now();
    
    clearRedis()
      .then(getListOfRepos, error)
      .then(getFilesInRepos, error)
      .then(openFilesInRepo, error)
      .then(function(){
        redis.end();
        console.log('Done: ' + (Date.now() - startTime)/1000);
      }, error);
  }

  start();
};



  
    extractCode(program.repoDir);
  


