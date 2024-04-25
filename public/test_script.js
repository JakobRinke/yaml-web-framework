

const yaml_code_to_compile = 
`div: 
  - div: "This is new a text"
  - div: "This is yes another text"
`;

async function changeDiff () {
    console.log('changeDiff')
    const html = await yaml_to_html(yaml_code_to_compile);
    const diff = document.getElementById('diff');

    diff.innerHTML = html;
}

changeDiff();