const website_creator = require('./framework/website_creator.js');

var argv = process.argv.slice(2);

if (argv.length == 1 && argv[0] == 'build') {
    website_creator.build_all();
}






else {
    console.log('Unknown command or wrong number of arguments!');
}