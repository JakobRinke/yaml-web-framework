const website_creator = require('./framework/website_creator.js');
const debug_script = require('./framework/debug_script.js');

var argv = process.argv.slice(2);

if (argv.length == 1 && argv[0] == 'build') {
    website_creator.build_all();
}

else if (argv.length == 1 && argv[0] == 'debug') {
    debug_script.start_server();
}


else {
    console.log('Unknown command or wrong number of arguments!');
}