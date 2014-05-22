/*
  This could certainly be refactored, especially 
  since unit tests exist! - liam
*/

function extractCStyleComments(obj){

  var output = {
    comments : [],
    code : []
  }, i;
  this.string = obj.string;

  if(!obj.string || obj.string.length === 0){
    return output;
  }

  this.length = obj.string.length;
  this.token;
  this.nextToken;
  this.tokenPair;
  this.commentString = '';
  var inMultiComment = false,
      inComment = false;

  this.codeString = '';


  for (i = 0; i < this.length; i++) {
    this.token = this.string[i];
    this.nextToken = this.string[Math.min(i + 1, this.length - 1)];
    this.tokenPair = this.token + this.nextToken;

    if(this.tokenPair === '*/' || (this.token === '\n' && inComment)){
      this.commentString && output.comments.push(this.commentString);
      this.commentString = '';

      inComment = false;
      if(inMultiComment){
        i++;
        inMultiComment = false;
      }

      continue;
    }

    if(this.tokenPair === '//'){
      inComment = true;
      this.codeString.length && output.code.push(this.codeString);
      this.codeString = '';
      i++;
      continue;
    }

    if(this.tokenPair === '/*'){
      inMultiComment = true;
      this.codeString.length && output.code.push(this.codeString);
      this.codeString = '';
      i++;
      continue;
    }

    if(inComment || inMultiComment){
      this.commentString += this.token;
    }else{
      this.codeString += this.token;
    } 
  };

    if(inComment || inMultiComment){
      this.commentString && output.comments.push(this.commentString);
    }else{
      this.codeString.length && output.code.push(this.codeString);
    } 

  return output;
}


module.exports = extractCStyleComments;