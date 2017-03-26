var fortune = require('../lib/fortune.js');
var dayOfWeek = require('../lib/dayOfWeek.js');
var expect = require('chai').expect;

suite('Fortune cookie tests', function () {
    test('getFortune() should return a fortune', function () {
        expect(fortune.getFortune()).to.be.a('string');
    });

    test('getDayOfWeek() should return a day of the week', function () {
        expect(dayOfWeek.getDayOfWeek()).to.be.a('string');
    });
});
