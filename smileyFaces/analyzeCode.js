var fs = require('fs'),
    glob = require('glob'),
    q = require('q'),
    path = require('path'),
    istextorbinary = require('istextorbinary'),
    extractCStyleComments = require('./extractCStyleComments.js'),
    countSmileyFaces = require('./countSmileyFaces.js'),
    smileyFaces = countSmileyFaces(),
    numSmileyFaces = Object.keys(smileyFaces).length,
    smileyFaceIndex = {};

Object.keys(smileyFaces).sort().forEach(function(key, i){
  smileyFaceIndex[key] = i;
});


function analyzeFile(repo, file, cb){
  var separatedFile, count, fileStat, fileData;

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

  function extractComments(){
    var deferred = q.defer();

    separatedFile = extractCStyleComments({string : fileData});
    deferred.resolve();
    return deferred.promise;
  }


  function countSmiley(){
    var deferred = q.defer(),
        out = [],
        total = 0;

    for (var i = 0; i < numSmileyFaces; i++) {
      out.push(0);
    };

    count = countSmileyFaces(separatedFile.comments.join(' '));

    Object.keys(count).forEach(function(key){
      out[smileyFaceIndex[key]] = count[key];

      if(key.indexOf('(') === -1){
        total += count[key];
      }
    });

    count = out;
    count.unshift(total);
    deferred.resolve();
    return deferred.promise;
  }

  function createJSONObj(){
    var deferred = q.defer(),
        relativePath = file.match(new RegExp('/' + repo + '(.*)'))[1];
        output = [
          repo.match(/^([\w\.\-]*)-\w+$/)[1], // repos include branch name, get rid of that
          escape(relativePath.replace(path.basename(file), '')), // path to file in repo
          escape(path.basename(file)),
          escape(path.extname(file)),
          separatedFile.code.join('').length,
          separatedFile.comments.join('').length,
          separatedFile.comments.length
        ];    

      Array.prototype.push.apply(output, count);

      console.log(output);
      deferred.resolve();
      return deferred.promise;
  }

  function start(){

    stats()
      .then(readFile)
      .then(extractComments)
      .then(countSmiley)
      .then(createJSONObj)
      .then(function(){
        console.log(count);
        cb();
      });
  }

  start();
}


var file = '/Users/ldk/Dropbox/Projects/languageStatistics/testData/linuxSmall-master/fs/pnode.c';
analyzeFile('linuxSmall-master', file, function(){
  console.log('done');
})