card-swipe.js
==============

[![NPM version](https://img.shields.io/npm/v/card-swipe.svg)]()
[![npm](https://img.shields.io/npm/dt/card-swipe.svg)]()
[![Travis](https://img.shields.io/travis/khrome/card-swipe.svg)]()

A utility for detecting CC track inputs from streaming character data and for extracting data from them.

A credit card magstripe contains a string of data representing a composite of account details. A 'card present' transaction (which gives you a better retail percentage on your transaction fees) generally consists of setting a flag and passing along this data, which has strict regulations on them preventing them from ever being saved to disk. Normally a magstripe is just a keyboard as far as the OS knows, which often leads to tedious PC POS interfaces where you click into a field and then swipe the card, your other option is to build an input sniffer which allows you to scan time restricted character buffers for track data patterns, so you can react/generate events/whatever. So that's what this is, you plug keystroke input into it, it reacts whenever it sees a cardswipe. In addition it can use bin ranges on the account number to determine account type and issuer.

Usage
-----

require the library
    
    var Swipe = require('card-swipe');
    
the simplest way to get it running is to use the built-in stdio hook to get it running from the terminal:

    Swipe.stdIn()
    new Swipe(function(swipeData){
        console.log('swipe', swipeData);
    });
    

this is the shorthand for:

    var scanner = new Swipe.Scanner();
    new Swipe({
        scanner : scanner,
        onSwipe : function(swipeData){
            console.log('swipe', swipeData);
        }
    });
    process.stdin.setRawMode();
    process.stdin.resume();
    process.stdin.on('data', function (chunk, key) {
        chunk = chunk.toString();
        for(var lcv=0; lcv < chunk.length; lcv++) scanner.input(chunk[lcv]);
        if (key && key.ctrl && key.name == 'c') process.exit();
    });
    
likely if you are integrating this into an app, stdin is not going to be good enough for you... but luckily the scanner will wire up to just about anything.

Additionally, so I could test these things out I built a generator function

    Swipe.generate(field, [values])
    
which can generate luhn and bin valid account numbers, track_one and track_two data (since you can't really be saving these things, and test cards are continually expiring).

and for my testing harness

    Swipe.fake(scanner)
    
which generates a random fake swipe across the passed in scanner.

Testing
-------
Tests use mocha/should to execute the tests from root

    mocha

If you find any rough edges, please submit a bug!

Right now this only supports credit cards, but this could easily expand to gift cards, EBT, checks, etc. If you have a specific interest, contact me.

Enjoy,

-Abbey Hawk Sparrow