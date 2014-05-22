var count = require('../countSmileyFaces.js'),
    expect = require('chai').expect;


describe('countSmileyFaces', function(){
  var defaults = {
      ':)' : 0,
      ':o)' : 0,
      ';)' : 0,
      ';-)' : 0,
      ':-)' : 0,
      ':-D' : 0,
      ':p' : 0,
      ':(' : 0
    };

  it('should return defaults with undefined input', function(){
    var matches = count();

    expect(matches).to.deep.equal(defaults);
  });

  it('should return defaults with array input', function(){
    var matches = count([]);

    expect(matches).to.deep.equal(defaults);
  });

  it('should return defaults with empty string input', function(){
    var matches = count('');

    expect(matches).to.deep.equal(defaults);
  });

  it('should return multiple maches', function(){
    var matches = count('why are :) you curious? :) ;) :p hello world :( ;-) goodbye');

    expect(matches).to.deep.equal({
      ':)': 2,
      ':o)': 0,
      ';)': 1,
      ';-)': 1,
      ':-)': 0,
      ':-D': 0,
      ':p': 1,
      ':(': 1 
    });
  })
});