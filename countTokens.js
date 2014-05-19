var fs = require('fs'),
    file;
    //file = fs.readFileSync('./example-code.txt', 'utf8');

function Transformer(string){
  this.originalString = string || '';
}

Transformer.prototype.replaceStringsAndNumbers = function(){
  // some of the regex are from https://github.com/mishoo/UglifyJS/blob/master/lib/parse-js.js
  this.transStr = this.originalString
                      .replace(/"[^"]*"/g,' __str__ ')
                      .replace(/(\*){3,}|(\-){3,}/g, '') // remove execessive astericks (> 3 in a row), found in comments
                      .replace(/'[^']*'/g, ' __char__ ')
                      .replace(/0x[0-9a-f]+/ig, ' __hex__ ')
                      .replace(/-?\d+\.?(\d+)?/g, ' __num__ ')
                      .replace(/(hasOwnProperty)/g, ' __hasOwnProperty__ ');
                    
  return this;
};

Transformer.prototype.replaceTrippleChar = function(){
  this.transStr = this.transStr
                      .replace('===', ' __eq3__ ')
                      .replace('...', ' __dot3__ ');

    return this;
};

Transformer.prototype.replaceDoubleChar = function(){
  var matches = {
    '&&' : ' __and__ ', 
    '||' : ' __or__ ', 
    '<<' : ' __left__ ', 
    '>>' : ' __right__ ', 
    '==' : ' __eq2__ ', 
    ':=' : ' __assign__ ', 
    '::' : ' __colon2__ ', 
    '++' : ' __plus2__ ', 
    '--' : ' __minus2__ ', 
    '!=' : ' __noteq__ ',
    '<=' : ' __lefthash__ ', 
    '=>' : ' __righthash__ ', 
    '<-' : ' __leftarrow__ ', 
    '->' : ' __rightarrow__ ', 
    '**' : ' __asterisk2__ ', 
    '..' : ' __dot2__ '
  };

  this.transStr = this.transStr
                      .replace(/(&&)|(\|\|)|(<<)|(>>)|(==)|(:=)|(::)|(\+\+)|(\-\-)|(\!=)|(<=)|(=>)|(<\-)|(\->)|(\*\*)|(\.\.)/g, function(char){

                        return matches[char];
                      });
  return this;
};

Transformer.prototype.replaceSingleChar = function(){
  this.transStr = this.transStr
                      .replace(/([;'&!%\|<>=\+\-\?:\*&#@\$\.,\(\)\[\]\{\}])/g, ' $1 ');
    return this;
};

Transformer.prototype.replaceDupSpace = function(){
  this.transStr = this.transStr.replace(/\s+/g,' ');
  return this
}

function counter(inputStr){
  var tokens = inputStr.split(' '),
      counter = {},
      token,
      i;

  for(i = 0; i < tokens.length; i++){
    token = tokens[i];
    
    if(token === ''){
      continue;
    }

    if(!counter.hasOwnProperty(token)){
      counter[token] = 0;
    }

    counter[token] += 1;
  }

  return counter;
}

function sortCounter(count){
  var keys = Object.keys(count),
      out = [];

  for (var i = 0; i < keys.length; i++) {
    out.push({token: keys[i], n : count[keys[i]]})
  };

  var sortFn = function(a,b){
    if(a.n > b.n){
      return -1;
    }else{
      return 1;
    }
  };

  return out.sort(sortFn);
}


module.exports = {
  run : function(string){

      var t = new Transformer(string),
          count,
          sorted;

      t.replaceStringsAndNumbers()
       .replaceTrippleChar()
       .replaceDoubleChar()
       .replaceSingleChar()
       .replaceDupSpace();

      count = counter(t.transStr);
      //sorted = sortCounter(count);
      return count;
    
  }
}



