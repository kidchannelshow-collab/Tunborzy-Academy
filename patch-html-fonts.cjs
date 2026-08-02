const fs = require('fs');

let htmlContent = fs.readFileSync('index.html', 'utf8');
if (!htmlContent.includes('preconnect')) {
  const fontLinks = `    <link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=Outfit:wght@100..900&family=Plus+Jakarta+Sans:wght@200..800&family=Poppins:wght@100;200;300;400;500;600;700;800;900&family=Sora:wght@100..800&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet">\n`;
  htmlContent = htmlContent.replace('  </head>', fontLinks + '  </head>');
  fs.writeFileSync('index.html', htmlContent);
  console.log('index.html patched with font preconnects.');
}

let cssContent = fs.readFileSync('src/index.css', 'utf8');
if (cssContent.includes('@import url')) {
  // Remove the @import statement
  cssContent = cssContent.replace(/@import url\('[^']+'\);\n/, '');
  fs.writeFileSync('src/index.css', cssContent);
  console.log('src/index.css patched to remove @import.');
}

