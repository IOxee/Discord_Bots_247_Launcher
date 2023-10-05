const { spawn } = require('child_process');
const path = require('path');

const bots = [
  {
    name: 'tebex-bot',
    script: 'index.js',
  }
];

bots.forEach((bot) => {
  const nodemonPath = path.join(__dirname, 'node_modules', '.bin', /^win/.test(process.platform) ? 'nodemon.cmd' : 'nodemon');
  const child = spawn(nodemonPath, [bot.script], {
    cwd: path.join(__dirname, bot.name),
    stdio: 'inherit',
  });
  child.on('error', (err) => {
    console.error(`${bot.name} botunda bir hata oluştu: ${err}`);
  });
  console.log(`${bot.name} botu başlatılıyor...`);
});
