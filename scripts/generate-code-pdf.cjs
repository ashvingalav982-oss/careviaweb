const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPdf = path.join(__dirname, '../public/Website_Source_Code.pdf');
const doc = new PDFDocument({ margin: 50, size: 'A4' });

doc.pipe(fs.createWriteStream(outputPdf));

doc.fontSize(24).text('Website Source Code Documentation', { align: 'center' });
doc.moveDown(2);

function getFiles(dir, exts) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
        results = results.concat(getFiles(file, exts));
      }
    } else {
      if (exts.includes(path.extname(file))) {
        results.push(file);
      }
    }
  });
  return results;
}

const exts = ['.tsx', '.ts', '.css', '.html', '.json', '.js', '.cjs'];
let allFiles = [];

const srcDir = path.join(__dirname, '../src');
if (fs.existsSync(srcDir)) allFiles = allFiles.concat(getFiles(srcDir, exts));

const netlifyFunctionsDir = path.join(__dirname, '../netlify/functions');
if (fs.existsSync(netlifyFunctionsDir)) allFiles = allFiles.concat(getFiles(netlifyFunctionsDir, exts));

const rootFiles = ['package.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'netlify.toml'];
rootFiles.forEach(file => {
  const fullPath = path.join(__dirname, '../', file);
  if (fs.existsSync(fullPath)) {
    allFiles.push(fullPath);
  }
});

// Remove duplicates and sort
allFiles = [...new Set(allFiles)].sort();

// Table of Contents
doc.fontSize(16).font('Helvetica-Bold').text('Table of Contents', { underline: true });
doc.moveDown();

const basePath = path.join(__dirname, '../');

allFiles.forEach((file, index) => {
  const relativePath = path.relative(basePath, file);
  doc.fontSize(10).font('Helvetica').text(`${index + 1}. ${relativePath}`);
});

doc.addPage();

allFiles.forEach((file, index) => {
  const relativePath = path.relative(basePath, file);
  
  doc.fontSize(14).font('Helvetica-Bold').text(`File: ${relativePath}`, { underline: true });
  doc.moveDown(0.5);
  
  try {
    const code = fs.readFileSync(file, 'utf8');
    // Replace tabs with spaces and remove characters that might cause PDFKit to crash
    const sanitizedCode = code.replace(/\t/g, '  ').replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    
    doc.fontSize(8).font('Courier').text(sanitizedCode, {
      lineGap: 2,
      columns: 1
    });
  } catch (err) {
    doc.fontSize(8).font('Courier').text(`Error reading file: ${err.message}`);
  }
  
  if (index < allFiles.length - 1) {
    doc.addPage();
  }
});

doc.end();

console.log('PDF generated at ' + outputPdf);
