const XLSX = require('xlsx');
const wb = XLSX.readFile('./file excel/QMS-RPS-001.xlsx', { cellFormulas: true, cellDates: true });
const ws = wb.Sheets['WS-UCT'];

console.log("=== HEADER & METADATA ===");
['A7','D7','A9','D9','L9','O9','P9','A10','D10','L10','O10','P10','A11','D11','F11','L11','O11','P11','A12','D12','F12','L12','O12'].forEach(cell => {
  if (ws[cell]) {
    console.log(`${cell}: val=${ws[cell].v}, f=${ws[cell].f || 'none'}, w=${ws[cell].w}`);
  }
});

console.log("\n=== SPECIMEN DETAILS (UNDISTURBED) ===");
['C31','E31','F31','G31','H31','I31','C32','E32','F32','G32','H32','I32','K32','M32','N32','C34','E34','F34','G34','H34','I34','K34','M34','N34','C35','E35','F35','C36','E36','F36','C37','E37','F37','F38'].forEach(cell => {
  if (ws[cell]) {
    console.log(`${cell}: val=${ws[cell].v}, f=${ws[cell].f || 'none'}`);
  }
});

console.log("\n=== SPECIMEN DETAILS (REMOLDED) ===");
['C73','E73','F73','G73','H73','I73','C74','E74','F74','G74','H74','I74','C75','E75','F75','G75','H75','I75','C76','E76','F76','C77','E77','F77','C78','E78','F78','F79'].forEach(cell => {
  if (ws[cell]) {
    console.log(`${cell}: val=${ws[cell].v}, f=${ws[cell].f || 'none'}`);
  }
});

console.log("\n=== TABLE FORMULAS UNDISTURBED (ROW 44 & 45) ===");
['C44','D44','E44','F44','G44','H44','I44','J44','C45','D45','E45','F45','G45','H45','I45','J45'].forEach(cell => {
  if (ws[cell]) {
    console.log(`${cell}: val=${ws[cell].v}, f=${ws[cell].f || 'none'}`);
  }
});

console.log("\n=== TABLE FORMULAS REMOLDED (ROW 84 & 85) ===");
['C84','D84','E84','F84','G84','H84','I84','J84','C85','D85','E85','F85','G85','H85','I85','J85'].forEach(cell => {
  if (ws[cell]) {
    console.log(`${cell}: val=${ws[cell].v}, f=${ws[cell].f || 'none'}`);
  }
});

console.log("\n=== SUMMARY RESULTS (ROWS 163-178) ===");
for (let r = 163; r <= 178; r++) {
  ['A','B','C','D','E'].forEach(col => {
    const addr = `${col}${r}`;
    if (ws[addr]) {
      console.log(`${addr}: val=${ws[addr].v}, f=${ws[addr].f || 'none'}`);
    }
  });
}
