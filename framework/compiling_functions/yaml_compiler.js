
var yaml, fs;
try {
    // If running in node
    fs = require('fs');
    yaml = require('js-yaml');
} catch {
    // If running in browser
    fs = undefined;
    yaml = jsyaml
}


cached_files = {};
var cached_load = function () { }
var checkFileExists = function () { }
if (fs !== undefined) {
    cached_load = async function(file_path) {
        if (cached_files[file_path] === undefined) {
            try {
                await fs.promises.access(file_path, fs.constants.F_OK);
            } catch (err) {
                console.error(`File ${file_path} not found!`);
                return '';
            }
            cached_files[file_path] = await fs.promises.readFile(file_path, 'utf8')
        };
        return cached_files[file_path];
    }

    checkFileExists = function (file) {
        return fs.promises.access(file, fs.constants.F_OK)
                 .then(() => true)
                 .catch(() => false)
    }

} else {
    cached_load = async function (file_path) {
        if (cached_files[file_path] === undefined) {
            cached_files[file_path] = await fetch(file_path).then(response => response.text());
        };
        return cached_files[file_path];
    }

    checkFileExists = function(file) {
        return fetch(file).then(response => response.status==200).catch(() => false);
    }
}

async function is_html_or_yaml(file_path) {
    const file_path_html = file_path + '.html';
    const file_path_yaml = file_path + '.yaml';

    if (await checkFileExists(file_path_html)) {
        return 'html';
    } else if (await checkFileExists(file_path_yaml)) {
        return 'yaml';
    }
    return '';
}


function getDataFromYamlKey(key) {
    // Key Structure: filelink#id.class@link    attributes can be in any order and are optional
    // Example: filelink#id.class@link or filelink#id@link or filelink.class@link
    const key_splitters = /[#.@]/g;
    const filelink = key.split(key_splitters)[0];
    const id = key.includes('#') ? key.split('#')[1].split(key_splitters)[0] : '';
    const _class = key.includes('.') ? key.split('.')[1].split(key_splitters)[0] : '';
    const link = key.includes('@') ? key.split('@')[1] : '';
    return { filelink, id, _class, link };
} 


async function yaml_to_html(config, basepath="/build/packages/") {
    //const config = yaml.load(yaml_str);
    if (typeof config !== 'object') {
        try {
            config = yaml.load(config);
        } catch (err) {
            return config;
        }
    }
    let html_string = '';
    for (const [key, raw_content] of Object.entries(config)) {

        let current_html = '';

        var { filelink, id, _class, link } = getDataFromYamlKey(key);
        filelink = basepath + filelink;
        const filetype = await is_html_or_yaml(filelink);


        if (filetype === 'html') {
            const file_content = await cached_load(filelink + '.html');
            current_html += file_content;
        } else if (filetype === 'yaml') {
            const file_content = await cached_load(filelink + '.yaml');
            const yaml_obj = yaml.load(file_content);
            const html = await yaml_to_html(yaml_obj, basepath);
            current_html += html;
        }

        current_html = current_html.replace(/{{ID}}/g, id);
        current_html = current_html.replace(/{{CLASS}}/g, _class);
        current_html = current_html.replace(/{{LINK}}/g, link);

        if (raw_content === undefined) {
            current_html = current_html.replace(/{{CONTENT}}/g, '');
            html_string += current_html;
        }
        // check if content is array
        else if (Array.isArray(raw_content)) {
            let content = '';
            for (const item of raw_content) {
                //console.log(item);
                content += await yaml_to_html(item, basepath);
            }
            current_html = current_html.replace(/{{CONTENT}}/g, content);
            html_string += current_html;
        }
        // check if content is object
        else if (typeof raw_content === 'object') {
            content = await yaml_to_html(raw_content, basepath);
            current_html = current_html.replace(/{{CONTENT}}/g, content);
            html_string += current_html;
        }
        else {
            html_string += current_html.replace(/{{CONTENT}}/g, raw_content);
        }
    }

    return html_string;
}

try {
    module.exports.yaml_to_html = yaml_to_html;
} catch (err) {
  
}
