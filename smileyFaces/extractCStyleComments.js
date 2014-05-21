function extractCStyleComments(obj){
  this.string = obj.string;

  if(!obj.string || obj.string.length === 0){
    return [];
  }

  this.length = obj.string.length;
  this.i;
  this.token;
  this.nextToken;
  this.tokenPair;
  this.commentString = ''
  this.inMultiComment = false;
  this.comments = [];




  for (this.i = 0; this.i < this.length; this.i++) {
    this.token = this.string[this.i];
    this.nextToken = this.string[Math.min(this.i + 1, this.length - 1)];
    this.tokenPair = this.token + this.nextToken;

    if(this.tokenPair === '*/' || (this.token === '\n' && this.inComment)){
      this.inMultiComment = false;
      this.comments.push(this.commentString);
      this.commentString = '';

      if(!this.inComment){
        i++;
      }
      this.inComment = false;
    }

    if(this.inComment || this.inMultiComment){
      this.commentString += this.token;
    }

    if(this.tokenPair === '//'){
      this.inComment = true;
      i++;
    }

    if(this.tokenPair === '/*'){
      this.inMultiComment = true;
      i++;
    }
  };

  return this.comments;
}


module.exports = extractCStyleComments;