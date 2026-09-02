import React from 'react';

interface LHUPageContainerProps {
  children: React.ReactNode;
}

export const LHUPageContainer: React.FC<LHUPageContainerProps> = ({ children }) => {
  return (
    <div className="lhu-a4-page-outer flex justify-center bg-transparent p-0 print:p-0 print:bg-white overflow-x-auto">
      {/* 
        A4 Page dimensions for print: 210mm x 297mm 
        With 0.5cm (5mm) margins on top, bottom, left, right:
        Printable content area is 200mm width x 287mm height!
      */}
      <div className="lhu-a4-page bg-white text-slate-900 border-none shadow-none w-[210mm] max-w-full min-h-[297mm] p-[8mm] flex flex-col justify-between box-border overflow-hidden print:w-[200mm] print:h-[287mm] print:max-h-[287mm] print:p-0 print:m-0">
        {children}
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0.5cm;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .lhu-a4-page-outer {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            width: 100% !important;
          }
          .lhu-a4-page {
            width: 200mm !important;
            height: 287mm !important;
            max-height: 287mm !important;
            padding: 0 !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
            overflow: visible !important;
            page-break-after: always;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};
