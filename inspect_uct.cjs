const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('./file excel/QMS-RPS-001.xlsx', { cellFormulas: true });

function dumpSheet(sheetName, outputFile) {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) {
    console.log(`Sheet ${sheetName} not found!`);
    return;
  }

  let out = `=== DUMP OF SHEET: "${sheetName}" ===\n`;
  const range = XLSX.utils.decode_range(sheet['!ref']);
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    let rowStr = [];
    let hasContent = false;
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = sheet[cellAddress];
      if (cell) {
        hasContent = true;
        let valInfo = cell.w || cell.v || '';
        let formulaInfo = cell.f ? ` [FORMULA: =${cell.f}]` : '';
        rowStr.push(`${cellAddress}: ${valInfo}${formulaInfo}`);
      }
    }
    if (hasContent) {
      out += `ROW ${(R + 1).toString().padStart(3, ' ')} | ` + rowStr.join(' | ') + '\n';
    }
  }

  fs.writeFileSync(outputFile, out, 'utf-8');
  console.log(`Dumped ${sheetName} to ${outputFile}`);
}

dumpSheet('WS-UCT', './scratch_dump_ws_uct.txt');
dumpSheet(' LHU_UCT', './scratch_dump_lhu_uct.txt');
