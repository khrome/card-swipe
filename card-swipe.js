var objectTool = require('async-objects');
var CharacterScanBuffer = require('character-scanner');
var Keyboard = {};
var extractIssuerData = function(account){
    var results = {}
    if(!Keyboard.Sequence.issuers) return results;
    var sequence;
    var subsequence;
    var issuerInfo;
    var width;
    var issuer = false;
    for(var lcv=0; lcv <= 2; lcv++){
        sequence = account.substring(0,4)+account.substring(4,4+lcv);
        if(issuerInfo = Keyboard.Sequence.issuers[sequence]){
            if(typeof issuerInfo == 'string'){
                issuer = issuerInfo;
            }else if(issuerInfo.from && issuerInfo.to){
                width = issuerInfo.from.length;
                subsequence = account.substring(4+lcv, width);
                if(subsequence >=  issuerInfo.from && subsequence <=  issuerInfo.to){
                    issuer = issuerInfo.issuer;
                }
            }else if(issuerInfo.in){
                width = issuerInfo.in[0].length;
                subsequence = account.substring(4+lcv, width);
                if(issuerInfo.in.contains(subsequence)){
                    issuer = issuerInfo.issuer;
                }
            }else throw('unknown issuer node type')
        }
    }
    if(issuer){
        results.issuer = issuer;
    }
    return results;
};
var extractTypeData = function(account){
    var results = {}
    if(!Keyboard.Sequence.types) return results;
    var length = account.length;
    if(Keyboard.Sequence.types[length]){
        objectTool.forEach(Keyboard.Sequence.types[length], function(type, prefix){
            if(account.indexOf(prefix) === 0) results.type = type;
        });
    }else{
        results.type = 'unknown';
    }
    return results;
};
var matchTree = function(tree, value){
    var keys = Object.keys(tree);
    var size = 0;
    var match = false;
    keys.forEach(function(key){
        if(value.indexOf(key) === 0 && size < key.length){
            match = key;
            size = key.length
        }
    });
    if(!match) return undefined;
};
var internalScanner;
var CreditSwipe = function(options){
    if(typeof options == 'function') options = {onScan:options};
    if(!options) options = {};
    if(!options.scanner && !internalScanner) internalScanner = new CharacterScanBuffer();
    var scanner = options.scanner || internalScanner;
    if(!options.onScan) throw('Missing \'onScan\' option!');
    var res = [];
    var callback = options.onScan || options.callback;
    scanner.addScanner({
        name:'credit-swipe',
        scan: function(str){
            return str.match(/%B[0-9 ]{13,18}\^[\/A-Z ]+\^[0-9]{13,}\?/mi) || str.match(/;[0-9]{13,16}=[0-9]{13,}\?/mi);
        }
    });
    var swipes = {};
    var finalSwipe = function(results, cb){
        if(!swipes[results.account]) swipes[results.account] = results;
        else{
            Object.keys(results).forEach((key)=>{
                swipes[results.account][key] = results[key];
            });
        }
        setTimeout(()=>{
            let swipe = swipes[results.account];
            delete swipes[results.account];
            if(swipe) cb(swipe)
        }, 200);
    }
    scanner.on('credit-swipe', function(res){
        var result = res[0] || res;
        var results = {};
        var something = false;
        if(result.substring(0,1) == '%'){
            var parts = result.substring(2,result.length-2).split('^');
            results.account = parts[0];
            if(parts[1].indexOf('/') != -1){
                var last = parts[1].substring(0, parts[1].indexOf('/'));
                last = last.substring(0,1).toUpperCase()+last.substring(1, last.length).toLowerCase();
                results.last_name = last;
                var first = parts[1].substring(parts[1].indexOf('/')+1, parts[1].length);
                if(first.indexOf(' ') != -1){
                    results.middle_initial = first.substring(first.indexOf(' ')+1, first.length).trim();
                    first = first.substring(0, first.indexOf(' '));
                }
                first = first.substring(0,1).toUpperCase()+first.substring(1, first.length).toLowerCase();
                results.first_name = first;
                results.name = first+' '+last;
            }else results.name = parts[1];
            results.exp_year = parts[2].substring(0, 2);
            results.exp_month = parts[2].substring(2, 4);
            results.expiration = new Date(results.exp_month+'/01/'+results.exp_year);
            results.track_one = result;
            something = true;
        }
        if(result.substring(0,1) == ';'){
            var parts = result.substring(1,result.length-1).split('=');
            results.account = parts[0];
            results.exp_year = parts[1].substring(0, 2);
            results.exp_month = parts[1].substring(2, 4);
            results.expiration = new Date(results.exp_month+'/01/'+results.exp_year);
            results.track_two = result;
            something = true;
        }
        if(Keyboard.Sequence.issuers && results.account){
            results = objectTool.merge(results, extractIssuerData(results.account));
        }
        if(Keyboard.Sequence.types && results.account){
            results = objectTool.merge(results, extractTypeData(results.account));
        }
        if(options.luhn){
            results['valid'] = require("luhn").validate(results.account);
        }
        finalSwipe(results, callback);
    });
};

Keyboard.Sequence = {};

Keyboard.Sequence.types = require('./card_type');
var intKeys = {};
Object.keys(Keyboard.Sequence.types).forEach(function(stringKey){
    intKeys[parseInt(stringKey)] = Keyboard.Sequence.types[stringKey];
});
Keyboard.Sequence.types = intKeys;

//todo: switch to new format:
// Issuer Name [Card Name]<Network>|country|{details}
Keyboard.Sequence.issuers = require('./issuer_data');

module.exports = CreditSwipe;
module.exports.Scanner = CharacterScanBuffer;
module.exports.types = Keyboard.Sequence.types;
module.exports.generate = function(type, options){
    if(!options) options = {};
    var get = function(name){
        if(options[name]) return options[name];
        else{
            var result = module.exports.generate(name, options);
            options[name] = result;
            return result;
        }
    };
    switch(type){
        case 'account':
            var luhn = require("luhn");
            var keys = Object.keys(Keyboard.Sequence.types);
            var size = keys[Math.floor(Math.random()*keys.length)];
            var options = Keyboard.Sequence.types[size];
            var number = '';
            objectTool.random(options, function(item, prefix){
                number = prefix;
            });
            while(number.length < size){
                number += ''+Math.floor(Math.random()*10);
            }
            while(!luhn.validate(number)) number = (parseInt(number)+1)+'';
            return number;
            break;
        case 'expiration':
            return '1504';
        case 'list_name':
            return 'Ed Beggler';
        case 'track_one':
            return '%B'+get('account')+'^'+get('list_name').toUpperCase()+'^'+get('expiration')+'333'+'333333' /* 'A', 'BBB' or 'CCCC'*/ +'?';
        case 'track_two':
            return ';'+get('account')+'='+get('expiration')+'333'+'333333' /* 'A', 'BBB' or 'CCCC'*/ +'?';
        case 'track_data' :
            return [
                get('track_one'),
                get('track_two')
            ]
        default : return 'blah';

    }
};
module.exports.stdIn = function(){
    process.stdin.setRawMode();
    process.stdin.resume();
    process.stdin.on('data', function (chunk, key) {
        chunk = chunk.toString();
        for(var lcv=0; lcv < chunk.length; lcv++){
            if(internalScanner) internalScanner.input(chunk[lcv]);
        }
        if (key && key.ctrl && key.name == 'c') process.exit();
    });
    return CreditSwipe;
}
module.exports.fake = function(scanner, options){
    var tracks = module.exports.generate('track_data', options);
    tracks.forEach(function(track){
        for(var lcv=0; lcv < track.length; lcv++){
            scanner.input(track[lcv]);
        }
    });
}
