const yaml = require('js-yaml');
const fs = require('fs');
const http = require('http');

const UPDATE_TIME = 150;
const DEBUG_SCRIPT = `
    <!-- DEBUG Injected SCRIPT -->
    <script>
        async function loop_update() {
            while (true) {
                const response = await fetch('/update');
                if (response.status == 200) {
                    location.reload();
                }
                await sleep(${UPDATE_TIME});
            }
        }
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        loop_update();
    </script>
`

update = false;
function start_server() {
    require('./website_creator.js').build_all();

    fs.watch('./public', { recursive: true }, async (eventType, filename) => {
        const website_creator = require('./website_creator.js');
        if (eventType == 'unlink') {
            fs.rmSync(`./build/${filename}`);
            update = true;
            return;
        }
        if (eventType == 'change' || eventType == 'create') {
            console.log("Rebuilding: ", filename)
            if (filename.endsWith('.yaml') ) {
                await website_creator.rebuild_only(`./public/${filename}`);
                update = true;
                return;
            } else {
                website_creator.rebuild_other(`./public/${filename}`);
                update = true;
                return;
            }
        } 
    
        website_creator.build_all();
        update = true;
        

    });

    const server = http.createServer(function (req, res) {
        if (req.url == '/update') {
            if (update) {
                res.writeHead(200, { 'Content-Type': 'text/html' });
            } else {
                res.writeHead(201, { 'Content-Type': 'text/html' });
            }
            res.end();
            update = false;
        } else {
            try {
                if (req.url == '/' || req.url == '') {
                    req.url = '/index.html';
                }
                const file_path = `./build/${req.url}`;
                const file_content = fs.readFileSync(file_path, 'utf8');
                res.writeHead(200);
                res.write(file_content);
            } catch {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.write('<h1>404 Not Found</h1>');
            }
            if (req.url.endsWith('.html')) {
                res.write(DEBUG_SCRIPT);
            }
            res.end();
        }
    })
    console.log('Server running at http://localhost:8080/');
    server.listen(8080);

}



module.exports = { start_server };