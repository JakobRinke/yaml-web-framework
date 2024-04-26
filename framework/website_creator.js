const yaml = require('js-yaml');
const fs = require('fs');
const yaml_copiler = require('./compiling_functions/yaml_compiler.js');

function create_clear_folder(folder_path) {
    if (!fs.existsSync(folder_path)) {
        fs.mkdirSync(folder_path);
    } else {
        fs.rmSync(folder_path, { recursive: true });
        fs.mkdirSync(folder_path);
    }
}

function create_build_folder() {
    console.log('Creating build folder...');
    create_clear_folder('./build');
    // copy packages folder to build folder
    fs.mkdirSync('./build/packages');
    // copy all files recursively
}

function copy_package_files() {1
    console.log('Copying package files...');
    create_clear_folder('./build/packages');1
    fs.cpSync('./packages', './build/packages', { recursive: true });
}

async function build_yamlpage(yaml_path) {
    const yaml_content = fs.readFileSync(yaml_path, 'utf8');
    
    const yaml_data = yaml.load(yaml_content);

    const html_text = await yaml_copiler.yaml_to_html(yaml_data, ["./build/packages/", "./public/"], []);
    
    const html_path = yaml_path.replace(/.yaml/, '.html').replace(/public\//, 'build/');
    
    fs.writeFileSync(html_path, html_text);
}

function copy_scripts() {
    create_clear_folder('./build/compiling_functions');
    fs.cpSync('./framework/compiling_functions', './build/compiling_functions', { recursive: true });
}

function postimplement_globals() {
    // Load Global Files in build/global
    const global_files = fs.readdirSync('./build/global');
    // Load all html files in build that are not in global files
    const build_files = fs.readdirSync('./build', {recursive: true}).filter(file => file.endsWith('.html'));
    console.log('Postimplementing globals...')
    for (const file of build_files) {
        if (file.startsWith("packages/")) {
            continue;
        }
        var file_content = fs.readFileSync(`./build/${file}`, 'utf8');
        for (const globalFile of global_files) {
            // if globalFile is css implement in head
            if (globalFile.endsWith('.css')) {
                file_content = file_content.replace('</head>', `<link rel="stylesheet" href="/global/${globalFile}">\n</head>`);
            } else if (globalFile.endsWith('.js')) {
                file_content = file_content.replace('</body>', `<script src="/global/${globalFile}"></script>\n</body>`);
            }
        }
        fs.writeFileSync(`./build/${file}`, file_content);
    }
}

function postimplement_globals_for(file) {
    console.log(`Postimplementing globals for ${file}`);
    if (file.startsWith("packages/")) {
        return;
    }
    if (!file.endsWith('.html')) {
        return;
    }
    const global_files = fs.readdirSync('./build/global');
    var file_content = fs.readFileSync(`./build/${file}`, 'utf8');
    for (const globalFile of global_files) {
        // if globalFile is css implement in head
        if (globalFile.endsWith('.css')) {
            file_content = file_content.replace('</head>', `<link rel="stylesheet" href="/global/${globalFile}">\n</head>`);
        } else if (globalFile.endsWith('.js')) {
            file_content = file_content.replace('</body>', `<script src="/global/${globalFile}"></script>\n</body>`);
        }
    }
    fs.writeFileSync(`./build/${file}`, file_content);
}


async function build_all()  {
    create_build_folder();
    copy_package_files();

    const yaml_files = fs.readdirSync('./public').filter(file => file.endsWith('.yaml'));

    for (const yaml_file of yaml_files) {
        console.log(`Building ${yaml_file}...`);
        await build_yamlpage(`./public/${yaml_file}`);
    }

    copy_scripts();

    // copy all other files that are not .yaml
    console.log('Copying other files...');
    const other_files = fs.readdirSync('./public').filter(file => !file.endsWith('.yaml'));
    other_files.forEach(file => {
        // enure that folder exists

        fs.cpSync(`./public/${file}`, `./build/${file}`, { recursive: true });
    });

    postimplement_globals();
}

async function rebuild_only(yaml_path) {
    await build_yamlpage(yaml_path);
    postimplement_globals_for(yaml_path.replace(/.yaml/, '.html').replace(/public\//, ''));
}

function rebuild_other(file_path) {
    fs.cpSync(file_path, file_path.replace(/public\//, 'build/'), { recursive: true });
    postimplement_globals_for(file_path.replace(/public\//, ''));
}


module.exports.build_all = build_all;
module.exports.rebuild_only = rebuild_only;
module.exports.rebuild_other = rebuild_other;
