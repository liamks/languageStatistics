
var extract = require('../extractCStyleComments.js'),
    expect = require('chai').expect;

describe('extractCStyleComments', function(){
  var code = '';

  describe('empty string', function(){
    code = '';

    it('should return an empty array', function(){
      var out = extract({string:code});
      expect(out.comments).to.deep.equal([]);
      expect(out.code).to.deep.equal([]);
    });
  });

  describe('string with just comments', function(){
    it('should return a single comment and no code', function(){
      var code = '/* hello world*/ ',
          out = extract({string:code});

      expect(out.comments).to.deep.equal([' hello world']);
      expect(out.code).to.deep.equal([' ']);      
    });

    it('should return a single comment and no code', function(){
      var code = '/* hello world*/',
          out = extract({string:code});

      expect(out.comments).to.deep.equal([' hello world']);
      expect(out.code).to.deep.equal([]);      
    });

    it('should return a single comment and one space code', function(){
      var code = '//hello world\n ',
          out = extract({string:code});

      expect(out.comments).to.deep.equal(['hello world']);
      expect(out.code).to.deep.equal([' ']);      
    });

  });

  describe('mixed comments', function(){
    var code = "would you like /* comment1 */ I do not know if I can /*comment 2*/ and /*comment three*/ * // gekki \n goodbye"

    it('should return a single comment and one space code', function(){
      var out = extract({string:code});

      expect(out.comments).to.deep.equal([' comment1 ', 'comment 2', 'comment three', ' gekki ']);
      expect(out.code).to.deep.equal(['would you like ', ' I do not know if I can ', ' and ', ' * ', ' goodbye']);      
    });
  });
});