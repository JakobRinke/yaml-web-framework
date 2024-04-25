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

    const html_text = await yaml_copiler.yaml_to_html(yaml_data, "./build/packages/");
    
    const html_path = yaml_path.replace(/.yaml/, '.html').replace(/public\//, 'build/');

    fs.writeFileSync(html_path, html_text);
}

async function copy_scripts() {
    create_clear_folder('./build/compiling_functions');
    fs.cpSync('./framework/compiling_functions', './build/compiling_functions', { recursive: true });
}

function build_all()  {
    create_build_folder();
    copy_package_files();

    const yaml_files = fs.readdirSync('./public').filter(file => file.endsWith('.yaml'));

    yaml_files.forEach(yaml_file => {
        console.log(`Building ${yaml_file}...`);
        build_yamlpage(`./public/${yaml_file}`);
    });

    copy_scripts();

    // copy all other files that are not .yaml
    console.log('Copying other files...');
    const other_files = fs.readdirSync('./public').filter(file => !file.endsWith('.yaml'));
    other_files.forEach(file => {
        fs.copyFileSync(`./public/${file}`, `./build/${file}`);
    });

}



module.exports.build_all = build_all;
