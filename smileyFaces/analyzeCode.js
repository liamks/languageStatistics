var fs = require('fs'),
    glob = require('glob'),
    q = require('q'),
    path = require('path'),
    program = require('commander'),
    istextorbinary = require('istextorbinary'),
    extractCStyleComments = require('./extractCStyleComments.js'),
    countSmileyFaces = require('./countSmileyFaces.js'),
    smileyFaces = countSmileyFaces(),
    numSmileyFaces = Object.keys(smileyFaces).length,
    smileyFaceIndex = {},
    outputPath;


program.option('-d, --repoDir <s>', 'directory with repositories')
       .option('-o, --output <s>', 'output dir')
       .parse(process.argv);

outputPath = path.join(program.output, 'smiley-faces.csv');


Object.keys(smileyFaces).sort().forEach(function(key, i){
  smileyFaceIndex[key] = i;
});


function createCSV(){
  var header = [
    'repo',
    'path',
    'file',
    'ext',
    'code_length',
    'comment_length',
    'number_of_comments',
    'total_smiley_faces',
  ];

  Array.prototype.push.apply(header, Object.keys(smileyFaces).sort());

  header = header.join(',') + '\n';

  fs.writeFileSync(outputPath, '');
}



function AnalyzeFile(repo, file){
  this.repo = repo;
  this.file = file;
}

AnalyzeFile.prototype.stats = function(){
    var deferred = q.defer();

    fs.stat(this.file, function(err, fs){
      if(err || fs.isDirectory()){
        return deferred.reject();
      }

      deferred.resolve();
    });

    return deferred.promise;
}


AnalyzeFile.prototype.readFile = function(){
  var deferred = q.defer();

  fs.readFile(this.file, function(err, data){
    if(!data || (data && istextorbinary.isBinarySync(this.file, data))){
      deferred.reject(null);
      return deferred.promise;
    }
    this.fileData = data.toString('utf8');
    deferred.resolve();  
  }.bind(this));

  return deferred.promise;
}


AnalyzeFile.prototype.extractComments = function(){
  var deferred = q.defer();

  this.separatedFile = extractCStyleComments({string : this.fileData});
  deferred.resolve();
  return deferred.promise;
}

AnalyzeFile.prototype.countSmiley = function(){
  var deferred = q.defer(),
      out = [],
      total = 0;
  
  for (var i = 0; i < numSmileyFaces; i++) {
    out.push(0);
  };

  this.count = countSmileyFaces(this.separatedFile.comments.join(' '));


  Object.keys(this.count).forEach(function(key){
 
    out[smileyFaceIndex[key]] = this.count[key];

    if(key.indexOf('(') === -1){
      total += this.count[key];
    }
  }.bind(this));

  this.count = out;
  this.count.unshift(total);

  deferred.resolve();
  return deferred.promise;
}


AnalyzeFile.prototype.createJSONObj = function(){
  var deferred = q.defer(),
      relativePath = this.file.match(new RegExp('/' + this.repo + '(.*)'))[1];
      output = [
        this.repo.match(/^([\w\.\-]*)-\w+$/)[1], // repos include branch name, get rid of that
        escape(relativePath.replace(path.basename(this.file), '')), // path to file in repo
        escape(path.basename(this.file)),
        escape(path.extname(this.file)),
        this.separatedFile.code.join('').length,
        this.separatedFile.comments.join('').length,
        this.separatedFile.comments.length
      ];    

    Array.prototype.push.apply(output, this.count);

    deferred.resolve(output);
    return deferred.promise;
}

AnalyzeFile.prototype.appendToCSV = function(output){
  var deferred = q.defer();

  fs.appendFile(outputPath, output.join(',') + '\n', function(err){
    if(err){
      deferred.reject();
    }else{
      deferred.resolve();
    }
  });
  return deferred.promise;
}


AnalyzeFile.prototype.start =  function(){
  return this.stats()
             .then(this.readFile.bind(this))
             .then(this.extractComments.bind(this))
             .then(this.countSmiley.bind(this))
             .then(this.createJSONObj.bind(this))
             .then(this.appendToCSV.bind(this));
}




function analyzeRepos(){

  function getListOfRepos(){
    var deferred = q.defer();

    fs.readdir(program.repoDir, function(err, results){

      var folders = results.filter(function(folder){
        return fs.statSync(program.repoDir + folder).isDirectory();
      });

      if(err){
        deferred.reject(err);
      }else{
        deferred.resolve(folders);
      }
    });

    return deferred.promise;
  }

  function getFilesInRepos(repos){
      var deferred = q.defer(),
          repoFiles = [],
          p,
          ext;
      
      repos.forEach(function(repo){
        p = path.join(program.repoDir, repo) + '/**/*';
        glob.sync(p).forEach(function(file){
          ext = path.extname(file);
          if(ext === '.c' || ext === '.js'){
            repoFiles.push({repo: repo, file: file});
          }
        });
      });

      console.log(repoFiles.length);
      deferred.resolve(repoFiles);
      return deferred.promise;
  }

  function openFilesInRepo(files){
    var promises = [];

    files.forEach(function(file){
      promises.push(new AnalyzeFile(file.repo, file.file).start());
    });

    return q.all(promises);
  }


  function start(){
    var startTime = Date.now();

    getListOfRepos()
      .then(getFilesInRepos)
      .then(openFilesInRepo)
      .then(function(){
        console.log('Done: ' + (Date.now() - startTime)/1000);
      },function(err){
        if(err){
          console.log(err);
        }
      });
  }

  start();
}

createCSV();
analyzeRepos();
