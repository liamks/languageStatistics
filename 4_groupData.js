var start = Date.now();

var fs = require('fs'),
    csv = require('csv'),
    q = require('q'),
    program = require('commander'),
    repoInfo = require('./fetchRepos/repoInfo'),
    top1000Tokens = fs.readFileSync('./top1000Tokens.csv', 'utf8'),
    processedData,
    extension,
    langaugeTotals = {},
    FIRST_DATA_COLUMN = 6,
    tokensOfInterestIndex = 20,
    header;

program.option('-d, --data <s>', 'file with data')
       .option('-o, --output <s>', 'output dir')
       .parse(process.argv);

if(program.data){
 processedData = fs.readFileSync(program.data);
}else{
  console.log('specify data file');
  process.kill();
}


function createRepoExtensionMap(){
  var map = {};

  repoInfo.forEach(function(repo){
    map[repo.name] = repo.ext;
  });

  return map;
}

function createHeader(){
  var headerOut = [
        'repository',
        'num files'
      ],
      deferred = q.defer();

  csv().from.string(top1000Tokens).to.array(function(data){
    for (var i = 0; i < tokensOfInterestIndex; i++) {
      headerOut.push('\"' + data[i][0] + '\"');
    };

    header = headerOut.join(',');
    deferred.resolve();
  });

  return deferred.promise;
}


var reposExt = createRepoExtensionMap(),
    extensions = {
      '.php' : 'php',
      '.rb' : 'ruby',
      '.py' : 'python',
      '.js' : 'javascript',
      '.m' : 'objective-c',
      '.c' : 'c',
      '.hs' : 'haskell',
      '.xml' : 'xml',
      '.json' : 'json',
      '.html' : 'html',
      '.css' : 'css',
      '.clj' : 'clojure',
      '.java' : 'java',
      '.md' : 'markdown',
      '.go' : 'go',
      '.lua' : 'lua'
    };


function turnObjectArrayToCSV(obj, count, dest, name){
  var keys = Object.keys(obj),
      deferred = q.defer(),
      output = [header],
      vals;

  keys.forEach(function(key){
    vals = obj[key];
    vals.unshift(count[key]);
    vals.unshift(key);
    output.push(vals.join(','));
  });

  output = output.join('\n');

  fs.writeFile(dest + name, output, function(err){
    if(err){
      console.log('error saving to file: ' + name);
    }

    deferred.resolve();
  });

  return deferred.promise;
}

createHeader().then(function(){
  csv().from.string(processedData).to.array(function(data){
  var dataByLanguage = [],
      dataByRepo = {},
      extensionCount = {},
      repoCount = {},
      row,
      proj,
      ext,
      all =  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
      allCount = 0;

  // assume a header is present, so start at 1
  for (var i = 1; i < data.length; i++) {
    row = data[i];
    repo = row[0];    
    ext = row[3];


    if((repo in reposExt) && (ext === reposExt[repo])){
        if(!(repo in dataByRepo)){
        repoCount[repo] = 0;
        dataByRepo[repo] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
      }
      repoCount[repo] ++;
      
      for (var j = 0; j < dataByRepo[repo].length; j++) {
        dataByRepo[repo][j] += Number(row[j + FIRST_DATA_COLUMN]);
      };

    }

    if(ext in extensions){
      if(!(ext in langaugeTotals)){
        extensionCount[ext] = 0;
        langaugeTotals[ext] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
      } 


      extensionCount[ext]++;
      allCount ++;

      for (var j = 0; j < langaugeTotals[ext].length; j++) {
        langaugeTotals[ext][j] += Number(row[j + FIRST_DATA_COLUMN]);
        all[j] += Number(row[j + FIRST_DATA_COLUMN]);
      };
    }
  };

  Object.keys(langaugeTotals).forEach(function(key){
    var values = langaugeTotals[key];
    for (var i = 0; i < values.length; i++) {
      values[i] = values[i]/extensionCount[key];
    };
    langaugeTotals[key] = values;
  });

  Object.keys(dataByRepo).forEach(function(key){
    var values = dataByRepo[key];
    for (var i = 0; i < values.length; i++) {
      values[i] = values[i]/repoCount[key];
    };
    dataByRepo[key] = values;
  });

  for (var i = 0; i < all.length; i++) {
    all[i] = all[i]/allCount;
  };

  turnObjectArrayToCSV(langaugeTotals, extensionCount, program.output, 'tokens-by-language.csv')
    .then(turnObjectArrayToCSV(dataByRepo, repoCount, program.output, 'tokens-by-repo-lang.csv'))
    .then(turnObjectArrayToCSV({all: all}, {all: allCount}, program.output, 'tokens-all.csv'))
    .then(function(){
       console.log('complete: ' + (Date.now() - start)/1000);
     });
});
})
