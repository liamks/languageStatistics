# Programming Language Statistics

## To install dependencies

```
npm install
```

## To Run

```
cd fetchRepos
node 1_fetchRepoInfo
// will create repoInfo.json (do not delete, needed for later steps);
// to batch results can specify page of results, and # of results
// per page:
// node 1_fetchRepoInfo --page=2 --perPage=5

node fetchRepos/2_downloadRepos --repoDir=/destination/for/download/
// trailing slash *required*
// the repositories will now be downloaded to /destination/for/download
// now we can parse the downloaded directories

cd ..
// increase Memory to 4 gigs, more if needed
sudo node --max-old-space-size=4000 1_extractCode.js --repoDir=/destination/for/download/

node 2_countTop1000Tokens.js

node 3_transformData.js --output=/destination/for/data/
```


// remove deletion code, re run token count on original data
// will create a large data set.