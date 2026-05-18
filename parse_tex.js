const fs = require('fs');

function parseTex(filePath) {
    console.log(`\n--- Parsing ${filePath} ---`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const regex = /^\\(section|subsection|subsubsection)\{(.*?)\}/;
    
    for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(regex);
        if (match) {
            console.log(`Line ${i + 1}: [${match[1]}] ${match[2]}`);
        }
    }
}

parseTex('C:\\Users\\Francis\\Facultad\\TFG\\WorkSpace\\TFG\\capitulos\\05_Arquitectura.tex');
parseTex('C:\\Users\\Francis\\Facultad\\TFG\\WorkSpace\\TFG\\capitulos\\06_Implementacion.tex');
