const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceIcon = path.join(__dirname, '../public/icon.png');
const linuxIconsDir = path.join(__dirname, '../build-assets/icons/linux');

async function createIcons() {
  try {
    const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];

    for (const size of sizes) {
      const outputFile = path.join(linuxIconsDir, `${size}x${size}`, 'winvault.png');

      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toFile(outputFile);

      console.log(`Created: ${outputFile}`);
    }

    const setIconFile = path.join(linuxIconsDir, 'set.png');
    await sharp(sourceIcon)
      .resize(1024, 1024, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(setIconFile);
    console.log(`Created: ${setIconFile}`);

    console.log('All Linux icons created successfully!');
  } catch (error) {
    console.error('Error creating icons:', error);
    process.exit(1);
  }
}

createIcons();