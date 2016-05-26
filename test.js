var should = require("should");
var Swipe = require('./card-swipe.js');

describe('CreditSwipe', function(){
    
    it('can detect a card swipe', function(done){
        var scanner = new Swipe.Scanner();
        var result;
        new Swipe({
            scanner : scanner,
            onScan : function(swipeData){
                swipeData.should.have.property('account');
                swipeData.should.have.property('name');
                swipeData.should.have.property('exp_year');
                swipeData.should.have.property('exp_month');
                swipeData.should.have.property('expiration');
                swipeData.should.have.property('track_one');
                swipeData.should.have.property('track_two');
                swipeData.should.have.property('type');
                done();
            }
        });
        Swipe.fake(scanner);
    });
    
});