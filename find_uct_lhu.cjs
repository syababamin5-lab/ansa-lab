const fs = require('fs');
const content = fs.readFileSync('./src/components/lhu/LHUViewRenderer.tsx', 'utf-8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('UCT') || line.includes('sheetCode ===')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
