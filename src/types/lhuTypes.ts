export type LHUSheetCode = 
  | 'LHU_PP'
  | 'LHU_ATB'
  | 'LHU_Sieve & Hidro'
  | 'LHU_standard proctor'
  | 'LHU_modified proctor'
  | 'LHU PFH'
  | 'LHU_Konsolidasi'
  | 'LHU_UCT'
  | 'LHU_DS-CD'
  | 'LHU_DS-UU'
  | 'LHU_DS-CD RES.'
  | 'LHU_TRX-UU'
  | 'LHU_TRX-CU-Multi'
  | 'LHU_TRX-CU-Normal'
  | 'LHU_TRX-CD'
  | 'LHU_CBR Unsoaked'
  | 'Template LHU_CBRsoaked';

export interface LHUHeaderInfo {
  reportNo: string;
  revision: string;
  reportDate: string;
  totalPages: number;
  currentPage: number;

  projectName: string;
  projectLocation: string;
  poNumber: string;

  clientName: string;
  clientAddress: string;

  labId: string;
  sampleSource: string;
  sampleType: string;
  soilDescription: string;
  soilColor: string;
  dateReceived: string;
  dateTested: string;

  testedByName: string;
  testedByTitle: string;
  testedBySignatureUrl?: string;

  checkedByName: string;
  checkedByTitle: string;
  checkedBySignatureUrl?: string;

  approvedByName: string;
  approvedByTitle: string;
  approvedBySignatureUrl?: string;

  notes: string[];
  decimalPlaces?: number;
}

export interface LHUValueDisplay {
  value: string;
  isCalculated: boolean;
}

export interface LHUBoundData {
  header: LHUHeaderInfo;
  testCode: string;
  testTypeName: string;
  standard: string;
  parameters: Record<string, LHUValueDisplay>;
  tableRows?: Array<Record<string, LHUValueDisplay>>;
  chartPoints?: Array<{ x: number; y: number; label?: string }>;
  extraSummary?: Record<string, LHUValueDisplay>;
  rawDetails?: any;
}
