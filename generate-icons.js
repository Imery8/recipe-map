const fs = require('fs');
const { exec } = require('child_process');

const svg = fs.readFileSync('./public/icon.svg', 'utf8');

// For web browsers that support SVG, we can use SVG directly
// But we need PNG for better compatibility

console.log('Installing sharp package for image conversion...');
exec('npm install --no-save sharp', (err) => {
  if (err) {
    console.error('Failed to install sharp:', err);
    console.log('\nPlease run: npm install --no-save sharp');
    console.log('Then run: node generate-icons.js');
    return;
  }

  const sharp = require('sharp');

  const sizes = [
    { size: 192, name: 'icon-192.png' },
    { size: 512, name: 'icon-512.png' },
    { size: 180, name: 'apple-icon.png' },
  ];

  Promise.all(
    sizes.map(({ size, name }) =>
      sharp(Buffer.from(svg))
        .resize(size, size)
        .png()
        .toFile(`./public/${name}`)
        .then(() => console.log(`Generated ${name}`))
    )
  )
    .then(() => console.log('\n✅ All icons generated successfully!'))
    .catch(err => console.error('Error generating icons:', err));
});
