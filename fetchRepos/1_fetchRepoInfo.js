var github = require('octonode'),
    fs = require('fs'),
    q = require('q'),
    yaml = require('js-yaml'),
    program = require('commander'),
    languageFile = fs.readFileSync('./languages.yml', 'utf8'),
    client = github.client(),
    ghSearch = client.search(),
    output = [];


var LANGUAGES_OF_INTEREST = [
  'c', 'haskell', 'go', 'javascript', 
  'java', 'lua', 'objective-c', 'ruby', 
  'python', 'php', 
];

program.option('-pp, --perPage <n>', 'resultsPerPage')
        .option('-p, --page <n>', 'page of results, for chunking requests')
       .parse(process.argv);
    
var PER_PAGE = program.perPage || 5,
    PAGE = program.page || 1;

function fetch(){
  var extensionsMap = {};

  function buildExtensionMapping(){
    languages = yaml.safeLoad(languageFile);

    for(language in languages){
      extensionsMap[language.toLowerCase()] = languages[language]['primary_extension'];
    }

  }

  function iterateOverLanguages(){
    var promises = [];

    LANGUAGES_OF_INTEREST.forEach(function(language){
      promises.push(fetchProjectsByLanguage(language));
    });

    return q.all(promises);
  }

  var fetchProjectsByLanguage = function(language){
    var searchObj = {
      q : 'language:' + language,
      sort : 'stars',
      order : 'desc',
      per_page :  PER_PAGE,
      page : PAGE
    }, results = [],
    deferred = q.defer();

    ghSearch.repos(searchObj, function(err, body, status){
      if(err){
        console.log(err);
      }
      
      if(!err && body.items){
        results = body.items;
      }
      
      results = results.map(function(repo){
        return {
          name: repo.name,
          language : language,
          ext : extensionsMap[language],
          download_url : repo.html_url + '/archive/' + repo.default_branch + '.tar.gz'
        };
      });
      
      Array.prototype.push.apply(output, results);
      deferred.resolve();
    });

    return deferred.promise;
  };


  function saveToFile(){
    var deferred = q.defer();

    fs.writeFile('repoInfo.json', JSON.stringify(output), function(err){
      if(err){
        conosle.log(err);
        deferred.reject();
      }else{
        deferred.resolve();
      }
    })

    return deferred.promise;
  }

  function start(){
    buildExtensionMapping();

    iterateOverLanguages()
      .then(saveToFile)
      .then(function(){
        console.log('done');
      });
  }


  start();
}



fetch();