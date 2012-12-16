var Swipe = require('./card-swipe').stdIn();

new Swipe(function(swipeData){
    console.log(swipeData);
});

console.log('number', Swipe.generate('track_data'))