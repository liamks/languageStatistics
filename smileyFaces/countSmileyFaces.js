

function countSmilyFaces(string){
  var matchCount = {
    ':)' : 0,
    ':o)' : 0,
    ';)' : 0,
    ';-)' : 0,
    ':-)' : 0,
    ':-D' : 0,
    ':p' : 0,
    ':(' : 0
  }, matches;

  if(!string || typeof string !== 'string'){
    return matchCount;
  }

  matches = string.match(/(:\))|(:o\))|(;\))|(;\-\))|(:\-\))|(:\-D)|(:p)|(:\()/g);

  if(!matches){
    return matchCount;
  }

  for (var i = 0; i < matches.length; i++) {
    matchCount[matches[i]] += 1;
  };

  return matchCount;
}

module.exports = countSmilyFaces;
