

var manyComments = "would you like /* comment1 */ I do not know if I can /*comment 2*/ and /*comment three*/ * // gekki \n goodbye"


var extract = require('../extractCStyleComments.js'),
    expect = require('chai').expect;


describe('extractCStyleComments', function(){
  var code = '';

  describe('empty string', function(){
    code = '';

    it('should return an empty array', function(){
      expect(extract({string:code})).to.deep.equal([]);
    });
  })

});