var fs = require('fs'),
    q = require('q'),
    program = require('commander'),
    exec = require('child_process').exec,
    request = require('request'),
    repos = require('./repoInfo.json');

program.option('-r, --repoDir <s>', 'Directory to download repos')
       .parse(process.argv);

function downloadRepos(){


  function iterateOverRepos(){
    var promises = [];

    repos.forEach(function(repo){
      promises.push(downloadARepo(repo).then(unzip));
    });

    return q.all(promises);
  }

  function downloadARepo(repo){
    console.log('downloading: ' + repo.name);
    var deferred = q.defer();

    repo.saved = program.repoDir + repo.name + '.tar.gz';
    request(repo.download_url)
        .pipe(fs.createWriteStream(repo.saved))
        .on('close', function(err){
          deferred.resolve(repo);
        });

    return deferred.promise;
  }

  function unzip(repo){
    var deferred = q.defer(),
        cmd = 'tar -zxvf ' + repo.saved + ' -C ' + program.repoDir  + ' && rm ' + repo.saved;

      exec(cmd, function(err){
        deferred.resolve();
      });

      return deferred.promise;
  }


  function start(){
    iterateOverRepos()
      .then(function(err){
        console.log('done');
      })
  }

  start();
}


downloadRepos();