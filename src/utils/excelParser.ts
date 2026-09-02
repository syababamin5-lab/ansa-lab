import * as XLSX from 'xlsx';
import { SOIL_COLOUR_CATALOGUE } from '../types';

export interface ExcelImportResult {
  poMeta?: {
    poNumber?: string;
    clientName?: string;
    projectName?: string;
    sampleArrivalDate?: string;
  };
  samples: Array<{
    sampleCode: string;
    sampleType: 'Undisturbed Sample / UDS' | 'Disturbed Sample / DS' | 'Bulk Sample / DS';
    depthStart?: number;
    depthEnd?: number;
    rawDepthStr?: string;
    lithology: string;
    soilType: string;
    colourCode: number;
    colourName: string;
    idLab: string;
    testCodesToAssign: string[];
  }>;
}

export function parseSoilLabExcel(file: File): Promise<ExcelImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        const poMeta: ExcelImportResult['poMeta'] = {};
        const importedSamples: ExcelImportResult['samples'] = [];

        // 1. Detect Metadata in Header rows
        rows.slice(0, 15).forEach(row => {
          const rowStr = row.join(' ').toLowerCase();
          if (rowStr.includes('po') || rowStr.includes('job number')) {
            const val = row.find((cell: any) => String(cell).toUpperCase().startsWith('PO-') || String(cell).toUpperCase().includes('GQT'));
            if (val) poMeta.poNumber = String(val).trim();
          }
          if (rowStr.includes('client')) {
            const valIdx = row.findIndex((c: any) => String(c).toLowerCase().includes('client'));
            if (valIdx >= 0 && row[valIdx + 1]) poMeta.clientName = String(row[valIdx + 1]).trim();
          }
          if (rowStr.includes('project')) {
            const valIdx = row.findIndex((c: any) => String(c).toLowerCase().includes('project'));
            if (valIdx >= 0 && row[valIdx + 1]) poMeta.projectName = String(row[valIdx + 1]).trim();
          }
        });

        // 2. Dynamically Find Table Header Row
        let headerRowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
          const r = (rows[i] || []).map(c => String(c).toLowerCase().trim());
          if (
            r.includes('sample initial') || 
            r.includes('sample number') || 
            r.includes('kode sampel') || 
            r.includes('id sample') ||
            (r.includes('no') && (r.includes('type') || r.includes('material') || r.includes('depth (m)')))
          ) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          // If not found, look for row containing SG, MC, UW, ATB, TRX, etc.
          for (let i = 0; i < rows.length; i++) {
            const r = (rows[i] || []).map(c => String(c).toUpperCase().trim());
            if (r.includes('SG') || r.includes('MC') || r.includes('ATB') || r.includes('TRX-UU') || r.includes('UCT')) {
              headerRowIndex = i;
              break;
            }
          }
        }

        if (headerRowIndex === -1) {
          headerRowIndex = 11; // Fallback
        }

        const headerCols: string[] = (rows[headerRowIndex] || []).map(c => String(c).trim());

        let colSampleCodeIndex = headerCols.findIndex(c => c.toLowerCase().includes('sample') || c.toLowerCase().includes('kode'));
        let colTypeIndex = headerCols.findIndex(c => c.toLowerCase() === 'type' || c.toLowerCase().includes('tipe'));
        let colDepthIndex = headerCols.findIndex(c => c.toLowerCase().includes('depth') || c.toLowerCase().includes('kedalaman'));
        let colMaterialIndex = headerCols.findIndex(c => c.toLowerCase().includes('material') || c.toLowerCase().includes('soil'));

        if (colSampleCodeIndex === -1) colSampleCodeIndex = 1;
        if (colTypeIndex === -1) colTypeIndex = 2;
        if (colDepthIndex === -1) colDepthIndex = 3;
        if (colMaterialIndex === -1) colMaterialIndex = 5;

        // Comprehensive Mapping of Inisial / Header Names to Test Codes
        const testColMap: Array<{ colIndex: number; testCode: string }> = [];
        headerCols.forEach((colName, colIdx) => {
          const cUpper = colName.toUpperCase().trim();
          
          if (cUpper === 'SG' || cUpper.includes('SPECIFIC') || cUpper.includes('PHYSICAL')) testColMap.push({ colIndex: colIdx, testCode: 'SG' });
          else if (cUpper === 'MC' || cUpper.includes('MOISTURE')) testColMap.push({ colIndex: colIdx, testCode: 'MC' });
          else if (cUpper === 'UW' || cUpper.includes('UNIT WEIGHT')) testColMap.push({ colIndex: colIdx, testCode: 'UW' });
          else if (cUpper === 'BD' || cUpper.includes('BULK DENSITY')) testColMap.push({ colIndex: colIdx, testCode: 'BD' });
          else if (cUpper === 'ATB' || cUpper === 'ATT' || cUpper.includes('ATTERBERG')) testColMap.push({ colIndex: colIdx, testCode: 'ATB' });
          else if (cUpper === 'SL' || cUpper.includes('SHRINKAGE')) testColMap.push({ colIndex: colIdx, testCode: 'SL' });
          else if (cUpper === 'S&H' || cUpper === 'SH' || cUpper.includes('S&H') || cUpper.includes('S & H') || cUpper.includes('SIEVE') || cUpper.includes('GRAIN SIZE')) testColMap.push({ colIndex: colIdx, testCode: 'S&H' });
          
          else if (cUpper === 'CMP-STD' || cUpper.includes('CMP-STD') || cUpper.includes('CMP-S') || cUpper.includes('STANDARD PROCTOR')) testColMap.push({ colIndex: colIdx, testCode: 'CMP-STD' });
          else if (cUpper === 'CMP-MOD' || cUpper.includes('CMP-MOD') || cUpper.includes('CMP-M') || cUpper.includes('MODIFIED PROCTOR') || cUpper.includes('MODIF')) testColMap.push({ colIndex: colIdx, testCode: 'CMP-MOD' });
          
          else if (cUpper === 'PRM' || cUpper === 'PFH' || cUpper.includes('PERM') || cUpper.includes('PERMEAB')) testColMap.push({ colIndex: colIdx, testCode: 'PRM' });
          else if (cUpper === 'CNS' || cUpper === 'CT' || cUpper === 'CON' || cUpper.includes('CONSOL') || cUpper.includes('OEDO')) testColMap.push({ colIndex: colIdx, testCode: 'CNS' });
          else if (cUpper === 'SWP' || cUpper.includes('SWELLING')) testColMap.push({ colIndex: colIdx, testCode: 'SWP' });
          
          else if (cUpper === 'UCT' || cUpper.includes('UNCONFINED') || cUpper.includes('UCS')) testColMap.push({ colIndex: colIdx, testCode: 'UCT' });
          
          else if (cUpper === 'DS-UU' || cUpper.includes('DS-UU') || cUpper.includes('SHEAR UU')) testColMap.push({ colIndex: colIdx, testCode: 'DS-UU' });
          else if (cUpper === 'DS-CU' || cUpper.includes('DS-CU') || cUpper.includes('SHEAR CU')) testColMap.push({ colIndex: colIdx, testCode: 'DS-CU' });
          else if (cUpper === 'DS-RES' || cUpper === 'DS-CDR' || cUpper.includes('DS-RES') || cUpper.includes('RESIDUAL')) testColMap.push({ colIndex: colIdx, testCode: 'DS-RES' });
          else if (cUpper === 'DS-CD' || cUpper.includes('DS-CD') || cUpper.includes('SHEAR CD')) testColMap.push({ colIndex: colIdx, testCode: 'DS-CD' });
          else if (cUpper === 'DS' || cUpper === 'PB' || cUpper === 'DSH' || cUpper.includes('DIRECT SHEAR')) testColMap.push({ colIndex: colIdx, testCode: 'DS-CD' });
          
          else if (cUpper === 'TRX-UU' || cUpper.includes('TRX-UU') || cUpper.includes('TRIAXIAL UU')) testColMap.push({ colIndex: colIdx, testCode: 'TRX-UU' });
          else if (cUpper === 'TRX-CU' || cUpper.includes('TRX-CU') || cUpper.includes('TRX CU') || cUpper.includes('TRIAXIAL CU') || cUpper === 'TRX') testColMap.push({ colIndex: colIdx, testCode: 'TRX-CU' });
          else if (cUpper === 'TRX-CD' || cUpper === 'CS' || cUpper.includes('TRX-CD') || cUpper.includes('TRIAXIAL CD')) testColMap.push({ colIndex: colIdx, testCode: 'TRX-CD' });
          
          else if (cUpper === 'CBR-UNS' || cUpper === 'CBR-U' || cUpper.includes('CBR-U') || cUpper.includes('UNSOAKED')) testColMap.push({ colIndex: colIdx, testCode: 'CBR-UNS' });
          else if (cUpper === 'CBR-SOK' || cUpper === 'CBR-S' || cUpper.includes('CBR-S') || cUpper.includes('SOAKED')) testColMap.push({ colIndex: colIdx, testCode: 'CBR-SOK' });
          else if (cUpper === 'CBR' || cUpper.includes('CBR')) testColMap.push({ colIndex: colIdx, testCode: 'CBR-SOK' });
          
          else if (cUpper === 'PLI' || cUpper.includes('POINT')) testColMap.push({ colIndex: colIdx, testCode: 'PLI' });
          else if (cUpper === 'UCS' || cUpper.includes('UCS') || cUpper.includes('UNIAXIAL')) testColMap.push({ colIndex: colIdx, testCode: 'UCS-ROCK' });
          else {
            testColMap.push({ colIndex: colIdx, testCode: cUpper });
          }
        });

        // 3. Read Data Rows
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const r = rows[i];
          if (!r || r.length === 0) continue;

          const rawCode = String(r[colSampleCodeIndex] || '').trim();
          if (!rawCode || rawCode === '0' || rawCode.toLowerCase().startsWith('progres') || rawCode.toLowerCase().startsWith('target') || rawCode.toLowerCase().startsWith('keterangan') || rawCode.toLowerCase().startsWith('total')) continue;

          const rawType = String(r[colTypeIndex] || '').trim().toUpperCase();
          let sampleType: string = '';
          if (rawType.includes('BULK')) sampleType = 'Bulk Sample / DS';
          else if (rawType === 'DS' || rawType.includes('DISTURBED')) sampleType = 'Disturbed Sample / DS';
          else if (rawType === 'UDS' || rawType.includes('UNDISTURBED')) sampleType = 'Undisturbed Sample / UDS';
          else sampleType = '';

          const rawDepth = String(r[colDepthIndex] || '').trim();
          let depthStart: number | undefined = undefined;
          let depthEnd: number | undefined = undefined;
          let hasValidDepth = false;

          if (rawDepth && rawDepth !== '-' && rawDepth !== '0') {
            if (rawDepth.includes('-')) {
              const parts = rawDepth.split('-').map(p => parseFloat(p.trim().replace(',', '.')));
              if (!isNaN(parts[0]) && !isNaN(parts[1])) {
                depthStart = parts[0];
                depthEnd = parts[1];
                hasValidDepth = true;
              }
            } else {
              const singleNum = parseFloat(rawDepth.replace(',', '.'));
              if (!isNaN(singleNum)) {
                depthStart = singleNum;
                depthEnd = singleNum;
                hasValidDepth = true;
              }
            }
          }

          const rawMaterial = String(r[colMaterialIndex] || '').trim();

          // RULE: Check if cell contains 1 (or checkmark / date / non-zero / non-empty value)
          const assignedCodes: string[] = [];
          testColMap.forEach(({ colIndex, testCode }) => {
            const cellVal = String(r[colIndex] || '').trim();
            if (cellVal && cellVal !== '0' && cellVal !== '-' && cellVal.toLowerCase() !== 'false' && cellVal !== '—') {
              if (!assignedCodes.includes(testCode)) {
                assignedCodes.push(testCode);
              }
            }
          });

          importedSamples.push({
            sampleCode: rawCode,
            sampleType: sampleType as any,
            depthStart,
            depthEnd,
            rawDepthStr: hasValidDepth && depthStart !== undefined && depthEnd !== undefined 
              ? `${depthStart.toFixed(2)} - ${depthEnd.toFixed(2)} m` 
              : (rawDepth && rawDepth !== '-' ? rawDepth : ''),
            lithology: rawCode.includes('UDS') ? 'UDS' : '',
            soilType: rawMaterial,
            colourCode: 0,
            colourName: '',
            idLab: `LAB-IMP-${Math.floor(100 + Math.random() * 900)}`,
            testCodesToAssign: assignedCodes
          });
        }

        resolve({ poMeta, samples: importedSamples });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export function downloadSampleImportTemplate() {
  const data = [
    [
      'No', 'Sample Initial', 'Type', 'Depth (m)', 'Thickness (m)', 'Material',
      'SG', 'MC', 'UW', 'ATB', 'S&H',
      'CMP-STD', 'CMP-MOD', 'PRM', 'CNS', 'UCT',
      'DS-UU', 'DS-CU', 'DS-CD', 'DS-RES',
      'TRX-UU', 'TRX-CU', 'TRX-CD', 'CBR-UNS', 'CBR-SOK'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Form_Import_Sampel');

  XLSX.writeFile(wb, 'Template_Import_Sampel_Lab.xlsx');
}
