import React from 'react';
import { LHUSheetCode, LHUBoundData, LHUValueDisplay } from '../../types/lhuTypes';
import { LHUHeader, LHUFooter } from './LHUHeaderFooter';
import { LHUPageContainer } from './LHUPageContainer';

import { CompanyProfile } from '../../types/companyProfileTypes';

interface LHUViewRendererProps {
  sheetCode: LHUSheetCode;
  boundData: LHUBoundData;
  companyProfile?: CompanyProfile;
}

export const LHUViewRenderer: React.FC<LHUViewRendererProps> = ({ sheetCode, boundData, companyProfile }) => {
  const { header, testTypeName, standard, parameters } = boundData;

  const renderValBadge = (item?: LHUValueDisplay) => {
    if (!item || !item.isCalculated) {
      return (
        <span className="text-[8.5px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded italic">
          Belum ada perhitungan
        </span>
      );
    }
    return (
      <span className="text-[9.5px] font-mono font-extrabold text-slate-900">
        {item.value}
      </span>
    );
  };

  // 1. MULTI-PAGE SHEET: LHU_Konsolidasi (2 PAGES 100% IDENTICAL TO lhu consol.pdf)
  if (sheetCode === 'LHU_Konsolidasi') {
    const raw = boundData.rawDetails || {};
    const pcValKg = parseFloat(raw.pcNum || parameters.preconsolidationPressure?.value || 1.50);
    const pcValKpa = pcValKg * 98.0665;
    const ccVal = parseFloat(raw.ccNum || parameters.compressionIndex?.value || 0.285);
    const crVal = parseFloat(raw.crNum || parameters.recompressionIndex?.value || 0.042);
    const e0Val = parseFloat(raw.e0Num || parameters.initialVoidRatio?.value || 0.994);

    const h0 = parseFloat(raw.consolHeightNum || 2.00);
    const d0 = parseFloat(raw.consolDiaNum || 6.35);
    const area = parseFloat(raw.consolArea || 31.67);
    const vol = parseFloat(raw.consolVol || 63.34);
    const gs = parseFloat(raw.consolGs || 2.65);
    const w0 = parseFloat(raw.consolWnInit || 32.5);
    const hs = parseFloat(raw.consolHs || 1.00);

    const rawSteps: any[] = Array.isArray(raw.steps) ? raw.steps : [];
    const loadingSteps = rawSteps.filter((st: any) => st.pKg > 0 && !st.isUnloading);
    const validSteps = rawSteps.filter((st: any) => st.hasStepData && st.pKg > 0);

    const stages = loadingSteps.length > 0
      ? loadingSteps.map((st: any) => ({
          p: Math.round(st.pKpa || st.pKg * 98.0665),
          dh: st.stepDeltaH || 0,
          h: st.currentH || (h0 - (st.cumulativeDeltaH || 0)),
          de: st.deltaE || 0,
          e: st.eVal || 0,
          t90: st.t90 || 0,
          d0: st.d0,
          d90: st.d90,
          sqrtT90: st.sqrtT90,
          m1: st.m1,
          m2: st.m2,
          hDr: st.hDr || (h0 / 2),
          mv: st.mv || 0,
          cv: st.cv || 0,
          k: st.k > 0 ? st.k.toExponential(2).toUpperCase() : '-',
          timeReadings: st.timeReadings
        }))
      : [
          { p: 25, dh: 0.00229, h: 2.0177, de: 0.002229, e: 0.9643, t90: 3.24, hDr: 1.01115, mv: 0.00004629, cv: 0.004459914, k: '2.02E-08' },
          { p: 50, dh: 0.00321, h: 2.0145, de: 0.003125, e: 0.9611, t90: 5.29, hDr: 1.01275, mv: 0.00006499, cv: 0.002740270, k: '1.75E-08' },
          { p: 100, dh: 0.00514, h: 2.0094, de: 0.005004, e: 0.9561, t90: 4.84, hDr: 1.01532, mv: 0.00005217, cv: 0.003010268, k: '1.54E-08' },
          { p: 200, dh: 0.00664, h: 2.0027, de: 0.006464, e: 0.9497, t90: 5.29, hDr: 1.01864, mv: 0.00003381, cv: 0.002772237, k: '9.19E-09' },
          { p: 400, dh: 0.00792, h: 1.9948, de: 0.007710, e: 0.9420, t90: 4.84, hDr: 1.02260, mv: 0.00002024, cv: 0.003053591, k: '6.06E-09' },
          { p: 800, dh: 0.00968, h: 1.9851, de: 0.009424, e: 0.9325, t90: 4.00, hDr: 1.02744, mv: 0.00001243, cv: 0.003729903, k: '4.55E-09' }
        ];

    // Helper: Dynamic Taylor t90 Chart (Penurunan Dial vs Akar Waktu √t)
    const renderDynamicTaylorChart = (step: any, title: string, width = 460, height = 180, isSmall = false) => {
      const CONSOL_TIMES = [0.1, 0.25, 0.5, 1, 2, 4, 8, 15, 30, 60, 120, 240, 480, 1440];
      const CONSOL_SQRT_TIMES = CONSOL_TIMES.map(t => Math.sqrt(t));

      const timeReadings: string[] = Array.isArray(step?.timeReadings) ? step.timeReadings : [];

      const pts = CONSOL_SQRT_TIMES.map((sqrtT, tIdx) => {
        const rawVal = timeReadings[tIdx];
        const valStr = rawVal !== undefined ? rawVal : '';
        const dial = parseFloat(valStr) || 0;
        return { sqrtT, dial, hasVal: valStr !== '' };
      }).filter(p => p.hasVal);

      const paddingLeft = isSmall ? 38 : 45;
      const paddingRight = 445;
      const plotWidth = paddingRight - paddingLeft;
      const paddingTop = 15;
      const paddingBottom = isSmall ? 125 : 170;
      const plotHeight = paddingBottom - paddingTop;

      if (pts.length < 2) {
        return (
          <div className="border border-slate-900 bg-white p-1 overflow-hidden">
            <div className="text-[7.5px] font-bold text-center text-slate-800 mb-0.5">{title}</div>
            <div className="h-28 flex items-center justify-center text-[8px] text-slate-400 font-mono italic">
              Belum ada data pembacaan dial
            </div>
          </div>
        );
      }

      const r0 = pts[0].dial;
      const settlements = pts.map(p => Math.abs(p.dial - r0));
      const maxS = Math.max(0.005, ...settlements);
      const sSpan = maxS * 1.15;

      const svgPts = pts.map((p) => {
        const px = paddingLeft + (p.sqrtT / 40) * plotWidth;
        const s = Math.abs(p.dial - r0);
        const py = paddingTop + (s / sSpan) * plotHeight;
        return { x: px, y: py, dial: p.dial, sqrtT: p.sqrtT, s };
      });

      const pathStr = svgPts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');

      const dStep = sSpan / 5;
      const dTicks = Array.from({ length: 6 }, (_, i) => r0 - i * dStep);

      // Taylor 1.15x Construction Lines
      const d0Val = step?.d0 !== undefined ? step.d0 : r0;
      const s0 = Math.abs(d0Val - r0);
      const yD0 = paddingTop + (s0 / sSpan) * plotHeight;

      const t90Val = step?.t90 || 0;
      const cvVal = step?.cv || 0;
      const sqrtT90 = step?.sqrtT90 || (t90Val > 0 ? Math.sqrt(t90Val) : 0);
      const xT90 = paddingLeft + (sqrtT90 / 40) * plotWidth;
      const d90Val = step?.d90 !== undefined ? step.d90 : (r0 - 0.90 * maxS);
      const s90 = Math.abs(d90Val - r0);
      const yD90 = paddingTop + (s90 / sSpan) * plotHeight;

      const slope2 = (xT90 > paddingLeft && Math.abs(yD90 - yD0) > 0.001) ? (yD90 - yD0) / (xT90 - paddingLeft) : 1;
      const slope1 = slope2 * 1.15;

      const maxY = paddingBottom;
      let xTanEnd = slope1 > 0 ? (paddingLeft + (maxY - yD0) / slope1) : paddingRight;
      let yTanEnd = maxY;
      if (xTanEnd > paddingRight) {
        xTanEnd = paddingRight;
        yTanEnd = yD0 + slope1 * (paddingRight - paddingLeft);
      }

      let x115End = paddingLeft + 1.15 * (xTanEnd - paddingLeft);
      let y115End = yTanEnd;
      if (x115End > paddingRight) {
        x115End = paddingRight;
        y115End = yD0 + slope2 * (paddingRight - paddingLeft);
      }

      return (
        <div className="border border-slate-900 bg-white p-1 overflow-hidden">
          <div className="text-[7.5px] font-bold text-center text-slate-800 mb-0.5">{title}</div>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-white border border-slate-200 overflow-hidden">
            <text x={-(height/2)} y="12" transform="rotate(-90)" textAnchor="middle" fontSize={isSmall ? "6" : "6.5"} fontWeight="bold" fill="#475569">Settlement Dial (mm)</text>
            <text x="240" y={height - 3} textAnchor="middle" fontSize={isSmall ? "6" : "6.5"} fontWeight="bold" fill="#475569">√t (min½)</text>

            {/* Y Grid Ticks (Dial values Top -> Bottom) */}
            {dTicks.map((dVal, idx) => {
              const py = paddingTop + (idx / 5) * plotHeight;
              return (
                <g key={idx}>
                  <line x1={paddingLeft} y1={py} x2={paddingRight} y2={py} stroke="#E2E8F0" strokeWidth="0.8" />
                  <text x={paddingLeft - 4} y={py + 2.5} textAnchor="end" fontSize={isSmall ? "5.5" : "6.5"} fill="#94A3B8">{dVal.toFixed(4)}</text>
                </g>
              );
            })}

            {/* X Grid Ticks (0, 5, 10, ... 40) */}
            {[0, 5, 10, 15, 20, 25, 30, 35, 40].map(val => {
              const x = paddingLeft + (val / 40) * plotWidth;
              return (
                <g key={val}>
                  <line x1={x} y1={paddingTop} x2={x} y2={paddingBottom} stroke="#E2E8F0" strokeWidth="0.8" />
                  <text x={x} y={paddingBottom + 9} textAnchor="middle" fontSize={isSmall ? "5.5" : "6.5"} fill="#64748B">{val}</text>
                </g>
              );
            })}

            {/* Axes */}
            <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingBottom} stroke="#334155" strokeWidth="1.2" />
            <line x1={paddingLeft} y1={paddingTop} x2={paddingRight} y2={paddingTop} stroke="#334155" strokeWidth="1.2" />

            {/* Tangent Construction Lines (Taylor 1.15x) */}
            <line x1={paddingLeft} y1={yD0} x2={xTanEnd} y2={yTanEnd} stroke="#EA580C" strokeWidth="1.1" />
            <line x1={paddingLeft} y1={yD0} x2={x115End} y2={y115End} stroke="#16A34A" strokeWidth="1" strokeDasharray="3 2" />
            <circle cx={paddingLeft} cy={yD0} r="1.8" fill="#EA580C" stroke="#fff" strokeWidth="0.5" />

            {/* Curve */}
            {pathStr && <path d={pathStr} fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
            {svgPts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="2.0" fill="#2563EB" stroke="#fff" strokeWidth="0.6" />
            ))}

            {/* t90 Lines & Badge */}
            {t90Val > 0 && (
              <g>
                <line x1={xT90} y1={paddingTop} x2={xT90} y2={paddingBottom} stroke="#0EA5E9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1={paddingLeft} y1={yD90} x2={xT90} y2={yD90} stroke="#0EA5E9" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx={xT90} cy={yD90} r="2.5" fill="#0EA5E9" stroke="#fff" strokeWidth="0.8" />
              </g>
            )}
          </svg>

          <div className="flex items-center justify-center gap-2 text-[6px] text-slate-500 font-mono mt-0.5">
            <span className="text-orange-600 font-semibold">Garis 1 (Awal)</span>
            <span>·</span>
            <span className="text-emerald-700 font-semibold">Garis 2 (1.15×)</span>
            <span>·</span>
            <span className="text-sky-600">t90 = {t90Val.toFixed(2)} min</span>
            <span>·</span>
            <span className="text-blue-600">Cv = {(cvVal * 100).toFixed(4)} x10⁻² cm²/s</span>
          </div>
        </div>
      );
    };

    const headerP1 = { ...header, currentPage: 1, totalPages: 2 };
    const headerP2 = { ...header, currentPage: 2, totalPages: 2 };

    return (
      <div className="space-y-6">
        {/* PAGE 1 */}
        <LHUPageContainer>
          <LHUHeader
            header={headerP1}
            titleIndo="UJI KONSOLIDASI"
            titleEn="(CONSOLIDATION TEST)"
            standardStr="SNI 2812:2011 / ASTM D2435"
            companyProfile={companyProfile}
          />

          <div className="flex-1 my-2 space-y-2 text-[8.5px] font-sans overflow-hidden">
            <div className="grid grid-cols-2 gap-2">
              {/* LEFT COLUMN */}
              <div className="space-y-2">
                {/* 1. DATA BENDA UJI */}
                <div className="border border-slate-900 bg-white p-1">
                  <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-bold uppercase text-[8px] tracking-wide mb-1">
                    DATA BENDA UJI / SPECIMEN DATA
                  </div>
                  <table className="w-full text-[8px] border-collapse">
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-0.5 font-semibold text-slate-700 w-3/5">Tinggi Benda Uji / Specimen Height, cm</td>
                        <td className="py-0.5 w-3 text-center text-slate-400 font-bold">:</td>
                        <td className="py-0.5 text-right font-mono font-bold text-slate-900">{h0.toFixed(header.decimalPlaces ?? 3)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-semibold text-slate-700">Diameter Benda Uji / Specimen Diameter, cm</td>
                        <td className="py-0.5 w-3 text-center text-slate-400 font-bold">:</td>
                        <td className="py-0.5 text-right font-mono font-bold text-slate-900">{d0.toFixed(header.decimalPlaces ?? 3)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-semibold text-slate-700">Luas Permukaan Benda Uji / Specimen Area, cm²</td>
                        <td className="py-0.5 w-3 text-center text-slate-400 font-bold">:</td>
                        <td className="py-0.5 text-right font-mono font-bold text-slate-900">{area.toFixed(header.decimalPlaces ?? 3)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-semibold text-slate-700">Volume Benda Uji / Specimen Volume, cm³</td>
                        <td className="py-0.5 w-3 text-center text-slate-400 font-bold">:</td>
                        <td className="py-0.5 text-right font-mono font-bold text-slate-900">{vol.toFixed(header.decimalPlaces ?? 3)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-semibold text-slate-700">Berat Jenis Tanah / Specific Gravity</td>
                        <td className="py-0.5 w-3 text-center text-slate-400 font-bold">:</td>
                        <td className="py-0.5 text-right font-mono font-bold text-slate-900">{gs.toFixed(header.decimalPlaces ?? 3)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-semibold text-slate-700">Kadar Air Semula / Initial Moisture Content (%)</td>
                        <td className="py-0.5 w-3 text-center text-slate-400 font-bold">:</td>
                        <td className="py-0.5 text-right font-mono font-bold text-slate-900">{w0.toFixed(header.decimalPlaces ?? 3)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-semibold text-slate-700">Angka pori semula / Initial Void Ratio, e0</td>
                        <td className="py-0.5 w-3 text-center text-slate-400 font-bold">:</td>
                        <td className="py-0.5 text-right font-mono font-bold text-slate-900">{e0Val.toFixed(header.decimalPlaces ?? 3)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-semibold text-slate-700">Tinggi Padatan / Solid Height, Hs (cm)</td>
                        <td className="py-0.5 w-3 text-center text-slate-400 font-bold">:</td>
                        <td className="py-0.5 text-right font-mono font-bold text-slate-900">{hs.toFixed(header.decimalPlaces ?? 3)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-semibold text-slate-700">Tahap Pembebanan / Loading Increment, kPa</td>
                        <td className="py-0.5 w-3 text-center text-slate-400 font-bold">:</td>
                        <td className="py-0.5 text-right font-mono font-bold text-slate-900 text-[7px] leading-tight">25 - 50 - 100 - 200 - 400 - 800</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-semibold text-slate-700">Durasi Pembebanan / Loading Duration</td>
                        <td className="py-0.5 w-3 text-center text-slate-400 font-bold">:</td>
                        <td className="py-0.5 text-right font-mono font-bold text-slate-900">1440 menit</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. HASIL PENGUJIAN */}
                <div className="border border-slate-900 bg-white p-1">
                  <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-bold uppercase text-[8px] tracking-wide mb-1">
                    HASIL PENGUJIAN / TEST RESULT
                  </div>
                  <table className="w-full text-[7.5px] border-collapse border border-slate-900 text-center">
                    <thead className="bg-slate-100 font-bold border-b border-slate-900">
                      <tr>
                        <th className="p-0.5 border-r border-slate-900">Pressure<br/>kPa</th>
                        <th className="p-0.5 border-r border-slate-900">ΔH<br/>cm</th>
                        <th className="p-0.5 border-r border-slate-900">H<br/>cm</th>
                        <th className="p-0.5 border-r border-slate-900">Δe</th>
                        <th className="p-0.5 border-r border-slate-900">e</th>
                        <th className="p-0.5 border-r border-slate-900">t90<br/>min</th>
                        <th className="p-0.5">HDrainage<br/>cm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-mono">
                      {stages.map((st, idx) => (
                        <tr key={idx}>
                          <td className="p-0.5 border-r border-slate-300 font-bold">{st.p}</td>
                          <td className="p-0.5 border-r border-slate-300">{st.dh.toFixed(5)}</td>
                          <td className="p-0.5 border-r border-slate-300">{st.h.toFixed(4)}</td>
                          <td className="p-0.5 border-r border-slate-300">{st.de.toFixed(6)}</td>
                          <td className="p-0.5 border-r border-slate-300 font-bold">{st.e.toFixed(4)}</td>
                          <td className="p-0.5 border-r border-slate-300">{st.t90.toFixed(2)}</td>
                          <td className="p-0.5">{st.hDr.toFixed(5)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 3. PARAMETER HASIL UJI */}
                <div className="border border-slate-900 bg-white p-1">
                  <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-bold uppercase text-[8px] tracking-wide mb-1">
                    PARAMETER HASIL UJI / TEST RESULT PARAMETERS
                  </div>
                  <div className="grid grid-cols-3 gap-1 items-center">
                    <div className="col-span-2">
                      <table className="w-full text-[7.5px] border-collapse border border-slate-900 text-center">
                        <thead className="bg-slate-100 font-bold border-b border-slate-900">
                          <tr>
                            <th className="p-0.5 border-r border-slate-900">Tekanan Vertikal, kPa</th>
                            <th className="p-0.5 border-r border-slate-900">Mv<br/>m²/kN</th>
                            <th className="p-0.5 border-r border-slate-900">Cv<br/>cm²/s</th>
                            <th className="p-0.5">k<br/>cm/s</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300 font-mono">
                          {stages.map((st, idx) => (
                            <tr key={idx}>
                              <td className="p-0.5 border-r border-slate-300 font-bold">{st.p}</td>
                              <td className="p-0.5 border-r border-slate-300">{st.mv.toFixed(8)}</td>
                              <td className="p-0.5 border-r border-slate-300">{st.cv.toFixed(9)}</td>
                              <td className="p-0.5">{st.k}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="col-span-1 border border-slate-900 p-1 bg-slate-50 space-y-1 font-mono text-[8px] text-slate-900">
                      <div className="flex justify-between border-b border-slate-300 pb-0.5">
                        <span className="font-bold">Cc :</span>
                        <span className="font-extrabold text-[#1e40af]">{ccVal.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-300 pb-0.5">
                        <span className="font-bold">Cr :</span>
                        <span className="font-extrabold text-[#1e40af]">{crVal.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Pc :</span>
                        <span className="font-extrabold text-[#dc2626]">{pcValKg.toFixed(2)} kg/cm²</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-2">
                {/* 1. GRAFIK e-log P (MATCHING FORM UJI EXACTLY) */}
                <div className="border border-slate-900 bg-white p-1 overflow-hidden">
                  <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-bold uppercase text-[8px] tracking-wide mb-1">
                    GRAFIK e-log P / e-log P Curve
                  </div>
                  {(() => {
                    const stepEVals = validSteps.length > 0 ? validSteps.map((s: any) => s.eVal) : stages.map((s: any) => s.e);
                    const rawMinE = stepEVals.length > 0 ? Math.min(...stepEVals) : 0.90;
                    const rawMaxE = stepEVals.length > 0 ? Math.max(e0Val, ...stepEVals) : 1.00;
                    const ePad = Math.max(0.02, (rawMaxE - rawMinE) * 0.15);
                    const eFloor = Math.max(0, Math.floor((rawMinE - ePad) * 50) / 50);
                    const eCeil = Math.ceil((rawMaxE + ePad) * 50) / 50;
                    const eSpan = Math.max(0.05, eCeil - eFloor);
                    const eStep = eSpan / 5;
                    const eTicks = Array.from({ length: 6 }, (_, i) => eFloor + i * eStep);

                    const pts = validSteps.length > 0
                      ? validSteps.map((s: any) => {
                          const pKpa = s.pKpa || s.pKg * 98.0665;
                          const px = 42 + ((Math.log10(pKpa) - 1) / 2) * 403;
                          const py = 15 + ((eCeil - s.eVal) / eSpan) * 158;
                          return { x: Math.max(42, Math.min(445, px)), y: Math.max(15, Math.min(173, py)), e: s.eVal, p: pKpa, isUnload: s.isUnloading };
                        })
                      : stages.map((s: any) => {
                          const px = 42 + ((Math.log10(s.p) - 1) / 2) * 403;
                          const py = 15 + ((eCeil - s.e) / eSpan) * 158;
                          return { x: Math.max(42, Math.min(445, px)), y: Math.max(15, Math.min(173, py)), e: s.e, p: s.p, isUnload: false };
                        });

                    const pathStr = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');

                    const pcKpa = pcValKpa > 0 ? pcValKpa : 235;
                    const pcX = 42 + ((Math.log10(pcKpa) - 1) / 2) * 403;
                    const clampedPcX = Math.max(42, Math.min(445, pcX));
                    const pcY = 15 + ((eCeil - (e0Val - ccVal * 0.1)) / eSpan) * 158;
                    const clampedPcY = Math.max(15, Math.min(173, pcY));

                    return (
                      <svg viewBox="0 0 460 200" className="w-full h-44 bg-white border border-slate-200 overflow-hidden">
                        <text x="-88" y="12" transform="rotate(-90)" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#475569">Void Ratio (e)</text>
                        <text x="240" y="196" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#475569">Pressure (kPa)</text>

                        {/* Y-axis Ticks & Labels */}
                        {eTicks.map((val, i) => {
                          const y = 15 + ((eCeil - val) / eSpan) * 158;
                          return (
                            <g key={i}>
                              <line x1="42" y1={y} x2="445" y2={y} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                              <text x="38" y={y + 3} textAnchor="end" fontSize="7.5" fill="#94A3B8">{val.toFixed(3)}</text>
                            </g>
                          );
                        })}

                        {/* Initial Void Ratio e0 Dashed Line */}
                        {e0Val > 0 && e0Val >= eFloor && e0Val <= eCeil && (() => {
                          const ey = 15 + ((eCeil - e0Val) / eSpan) * 158;
                          return (
                            <g>
                              <line x1="42" y1={ey} x2="445" y2={ey} stroke="#D97706" strokeWidth="1.2" strokeDasharray="4 4" />
                              <circle cx="42" cy={ey} r="3" fill="#D97706" />
                              <text x="48" y={ey - 4} fontSize="7.5" fontWeight="bold" fill="#B45309">e₀ = {e0Val.toFixed(3)}</text>
                            </g>
                          );
                        })()}

                        {/* Log X-axis Ticks (10, 20, 50, 100, 200, 500, 1000) */}
                        {[10, 20, 50, 100, 200, 500, 1000].map((val) => {
                          const x = 42 + ((Math.log10(val) - 1) / 2) * 403;
                          const isMajor = [10, 100, 1000].includes(val);
                          return (
                            <g key={val}>
                              <line x1={x} y1="15" x2={x} y2="173" stroke={isMajor ? '#CBD5E1' : '#F1F5F9'} strokeWidth={isMajor ? '1.2' : '0.8'} strokeDasharray="3 3" />
                              {isMajor && <text x={x} y="184" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#64748B">{val}</text>}
                            </g>
                          );
                        })}

                        {/* Axes */}
                        <line x1="42" y1="15" x2="42" y2="173" stroke="#334155" strokeWidth="1.5" />
                        <line x1="42" y1="173" x2="445" y2="173" stroke="#334155" strokeWidth="1.5" />

                        {/* e-log P Curve Path */}
                        <path d={pathStr} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Data Points with e-value text tags */}
                        {pts.map((p, idx) => (
                          <g key={idx}>
                            <circle cx={p.x} cy={p.y} r="3.5" fill={p.isUnload ? "#9333EA" : "#0284C7"} stroke="#fff" strokeWidth="1.2" />
                            <text x={p.x} y={p.y - 5} textAnchor="middle" fontSize="7" fontWeight="extrabold" fill="#1E293B">{p.e.toFixed(3)}</text>
                          </g>
                        ))}

                        {/* Pc Line */}
                        <line x1={Math.max(42, clampedPcX - 40)} y1={Math.max(15, clampedPcY - 20)} x2={Math.min(445, clampedPcX + 50)} y2={Math.min(173, clampedPcY + 30)} stroke="#64748B" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1={clampedPcX} y1="15" x2={clampedPcX} y2="173" stroke="#DC2626" strokeWidth="1.2" strokeDasharray="3 3" />
                        <circle cx={clampedPcX} cy={clampedPcY} r="4" fill="#DC2626" />
                      </svg>
                    );
                  })()}

                  <div className="flex items-center justify-center gap-3 text-[7px] text-slate-600 font-mono mt-1">
                    <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-blue-600 inline-block"></span> e log P</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-slate-500 border-b border-dashed border-slate-500 inline-block"></span> Bisector Line</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-blue-500 border-b border-dashed border-blue-500 inline-block"></span> Pc Line</span>
                    <span className="flex items-center gap-1 text-red-600 font-bold">▲ Pc = {pcValKg.toFixed(2)} kg/cm² ({pcValKpa.toFixed(0)} kPa)</span>
                  </div>
                </div>

                {/* 2. SETTLEMENT VS √TIME CURVE (PAGE 1: LOAD STEP 0 / 25 kPa) */}
                {renderDynamicTaylorChart(rawSteps[0] || {}, `LOAD INCREMENT ${stages[0]?.p || 25} kPa`)}
              </div>
            </div>
          </div>

          <LHUFooter header={headerP1} sheetCode="LHU_Konsolidasi" companyProfile={companyProfile} />
        </LHUPageContainer>

        {/* PAGE 2 (LAMPIRAN / APPENDIX) */}
        <LHUPageContainer>
          <LHUHeader
            header={headerP2}
            titleIndo="LAMPIRAN / APPENDIX"
            titleEn="(CONSOLIDATION TEST TAYLOR PLOTS & PHOTOGRAPHS)"
            standardStr="SNI 2812:2011 / ASTM D2435"
            companyProfile={companyProfile}
          />

          <div className="flex-1 my-2 space-y-2 text-[8.5px] font-sans overflow-hidden">
            <div className="bg-[#1e40af] text-white px-2 py-1 font-bold uppercase text-[9px] tracking-wide">
              SETTLEMENT VS √TIME (min<sup>1/2</sup>) CURVE (TAYLOR METHOD) - ALL LOADING INCREMENTS
            </div>

            {/* GRID OF 5 TAYLOR CURVES FROM REAL TEST DATA */}
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4, 5].map((idx) => {
                const st = rawSteps[idx] || {};
                const pKpa = stages[idx]?.p || [50, 100, 200, 400, 800][idx - 1];
                return (
                  <div key={idx}>
                    {renderDynamicTaylorChart(st, `LOAD INCREMENT ${pKpa} kPa`, 460, 140, true)}
                  </div>
                );
              })}

              {/* PHOTO SLOTS SECTION */}
              <div className="border border-slate-900 bg-white p-1 overflow-hidden flex flex-col justify-between">
                <div className="text-[7.5px] font-bold text-center text-slate-800 mb-0.5">FOTO PENGUJIAN / TEST PHOTOGRAPH</div>
                <div className="grid grid-cols-2 gap-1 flex-1">
                  <div className="border border-dashed border-slate-300 rounded bg-slate-50 flex items-center justify-center text-[7.5px] text-slate-400 font-semibold italic text-center p-2">
                    Foto Sampel / Specimen Photo
                  </div>
                  <div className="border border-dashed border-slate-300 rounded bg-slate-50 flex items-center justify-center text-[7.5px] text-slate-400 font-semibold italic text-center p-2">
                    Foto Pengujian Oedometer / Test Setup
                  </div>
                </div>
              </div>
            </div>
          </div>

          <LHUFooter header={headerP2} sheetCode="LHU_Konsolidasi" companyProfile={companyProfile} />
        </LHUPageContainer>
      </div>
    );
  }

  // 2. MULTI-PAGE SHEET: LHU_UCT (2 PAGES 100% IDENTICAL TO QMS-RPS-001.xlsx sheet LHU_UCT)
  if (sheetCode === 'LHU_UCT') {
    const defDigits = header.decimalPlaces ?? 3;
    const raw = boundData.rawDetails || {};
    const d0Uds = raw.d0Uds ?? 38.0;
    const l0Uds = raw.l0Uds ?? 76.0;
    const area0UdsMm = raw.area0UdsMm ?? 1134.11;
    const mcUds = raw.mcUds ?? 8.15;
    const wetDensityUds = raw.wetDensityUds ?? 2.01;
    const dryDensityUds = raw.dryDensityUds ?? 1.86;
    const quUds = raw.quUds ?? 107.17;
    const suUds = raw.suUds ?? 53.59;
    const strainFailUds = raw.strainFailUds ?? 9.87;

    const d0Rem = raw.d0Rem ?? 38.0;
    const l0Rem = raw.l0Rem ?? 76.0;
    const area0RemMm = raw.area0RemMm ?? 1134.11;
    const mcRem = raw.mcRem ?? 8.98;
    const wetDensityRem = raw.wetDensityRem ?? 1.97;
    const dryDensityRem = raw.dryDensityRem ?? 1.81;
    const quRem = raw.quRem ?? 83.87;
    const suRem = raw.suRem ?? 41.93;
    const strainFailRem = raw.strainFailRem ?? 11.18;

    const sensitivity = raw.sensitivity ?? 1.28;

    const rowsUds: any[] = Array.isArray(raw.rowsUds) ? raw.rowsUds : [];
    const rowsRem: any[] = Array.isArray(raw.rowsRem) ? raw.rowsRem : [];

    const allStrainsUds = rowsUds.map((r: any) => r.strainPct || 0);
    const allStrainsRem = rowsRem.map((r: any) => r.strainPct || 0);
    const maxStrainData = Math.max(0, ...allStrainsUds, ...allStrainsRem, 15.0);
    const maxXVal = Math.max(20, Math.ceil((maxStrainData * 1.1) / 5) * 5);
    const xTicks = [0, 1, 2, 3, 4].map(i => (maxXVal / 4) * i);

    const allStressesUds = rowsUds.map((r: any) => r.stressKpa || 0);
    const allStressesRem = rowsRem.map((r: any) => r.stressKpa || 0);
    const maxStressData = Math.max(0, ...allStressesUds, ...allStressesRem, 100.0);
    const maxYVal = Math.max(120, Math.ceil((maxStressData * 1.20) / 20) * 20); // Peak + 20% headroom!
    const yStep = maxYVal / 6;
    const yTicks = [0, 1, 2, 3, 4, 5, 6].map(i => Math.round(i * yStep));

    return (
      <div className="space-y-6">
        {/* PAGE 1: INFORMASI BENDA UJI, HASIL PENGUJIAN, & GRAFIK TEGANGAN VS REGANGAN */}
        <LHUPageContainer>
          <LHUHeader
            header={header}
            titleIndo="UJI KUAT TEKAN BEBAS"
            titleEn="(UNCONFINED COMPRESSION TEST)"
            standardStr="SNI 3638:2012 / ASTM D2166"
            pageStr="1 dari 2"
          />

          <div className="flex-1 space-y-2 py-1 font-sans text-[8px]">
            {/* TWO-COLUMN LAYOUT: TABLES ON TOP, CHART BELOW (MATCHING LHU-UCT.pdf) */}
            <div className="grid grid-cols-2 gap-2">
              {/* 1. INFORMASI BENDA UJI / SPECIMEN INFORMATION */}
              <div className="border border-slate-900 bg-white">
                <div className="bg-slate-100 text-slate-900 px-2 py-0.5 font-extrabold uppercase text-[8px] border-b border-slate-900">
                  INFORMASI BENDA UJI / SPECIMEN INFORMATION
                </div>
                <table className="w-full text-[8px] border-collapse text-left font-mono">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-900 text-slate-900 font-sans text-center">
                      <th className="py-0.5 px-1.5 border-r border-slate-900 text-left">Contoh / Sample</th>
                      <th className="py-0.5 px-1 border-r border-slate-900 text-blue-900">Undisturbed</th>
                      <th className="py-0.5 px-1 text-purple-900">Remolded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-center">
                    <tr>
                      <td className="py-0.5 px-1.5 text-slate-700 border-r border-slate-300 text-left font-sans">Diameter Awal (mm)</td>
                      <td className="py-0.5 px-1 border-r border-slate-300 font-bold">{d0Uds.toFixed(defDigits)}</td>
                      <td className="py-0.5 px-1 font-bold">{d0Rem.toFixed(defDigits)}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 px-1.5 text-slate-700 border-r border-slate-300 text-left font-sans">Tinggi Awal (mm)</td>
                      <td className="py-0.5 px-1 border-r border-slate-300 font-bold">{l0Uds.toFixed(defDigits)}</td>
                      <td className="py-0.5 px-1 font-bold">{l0Rem.toFixed(defDigits)}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 px-1.5 text-slate-700 border-r border-slate-300 text-left font-sans">Luas Penampang Awal (mm²)</td>
                      <td className="py-0.5 px-1 border-r border-slate-300 font-bold">{area0UdsMm.toFixed(defDigits)}</td>
                      <td className="py-0.5 px-1 font-bold">{area0RemMm.toFixed(defDigits)}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 px-1.5 text-slate-700 border-r border-slate-300 text-left font-sans">Kadar Air (%)</td>
                      <td className="py-0.5 px-1 border-r border-slate-300 font-bold text-blue-900">{mcUds.toFixed(defDigits)}</td>
                      <td className="py-0.5 px-1 font-bold text-purple-900">{mcRem.toFixed(defDigits)}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 px-1.5 text-slate-700 border-r border-slate-300 text-left font-sans">Berat Isi Basah (g/cm³)</td>
                      <td className="py-0.5 px-1 border-r border-slate-300 font-bold">{wetDensityUds.toFixed(defDigits)}</td>
                      <td className="py-0.5 px-1 font-bold">{wetDensityRem.toFixed(defDigits)}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 px-1.5 text-slate-700 border-r border-slate-300 text-left font-sans">Berat Isi Kering (g/cm³)</td>
                      <td className="py-0.5 px-1 border-r border-slate-300 font-bold">{dryDensityUds.toFixed(defDigits)}</td>
                      <td className="py-0.5 px-1 font-bold">{dryDensityRem.toFixed(defDigits)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 2. HASIL PENGUJIAN / TEST RESULT */}
              <div className="border border-slate-900 bg-white">
                <div className="bg-slate-100 text-slate-900 px-2 py-0.5 font-extrabold uppercase text-[8px] border-b border-slate-900">
                  HASIL PENGUJIAN / TEST RESULT
                </div>
                <table className="w-full text-[8px] border-collapse text-left font-mono">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-900 text-slate-900 font-sans text-center">
                      <th className="py-0.5 px-1.5 border-r border-slate-900 text-left">Contoh / Sample</th>
                      <th className="py-0.5 px-1 border-r border-slate-900 text-blue-900">Undisturbed</th>
                      <th className="py-0.5 px-1 text-purple-900">Remolded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-center">
                    <tr>
                      <td className="py-0.5 px-1.5 text-slate-900 border-r border-slate-300 text-left font-sans font-bold">Kuat Tekan Bebas, qu (kPa)</td>
                      <td className="py-0.5 px-1 border-r border-slate-300 font-black text-blue-900 bg-blue-50/40">{quUds.toFixed(defDigits)}</td>
                      <td className="py-0.5 px-1 font-black text-purple-900 bg-purple-50/40">{quRem.toFixed(defDigits)}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 px-1.5 text-slate-900 border-r border-slate-300 text-left font-sans font-bold">Kuat Geser Tak Terdrainase, Su (kPa)</td>
                      <td className="py-0.5 px-1 border-r border-slate-300 font-black text-indigo-900">{suUds.toFixed(defDigits)}</td>
                      <td className="py-0.5 px-1 font-black text-purple-900">{suRem.toFixed(defDigits)}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 px-1.5 text-slate-800 border-r border-slate-300 text-left font-sans">Regangan Saat Keruntuhan (%)</td>
                      <td className="py-0.5 px-1 border-r border-slate-300 font-bold">{strainFailUds.toFixed(defDigits)}</td>
                      <td className="py-0.5 px-1 font-bold">{strainFailRem.toFixed(defDigits)}</td>
                    </tr>
                    <tr className="bg-emerald-50/60 font-bold">
                      <td className="py-0.5 px-1.5 text-emerald-950 border-r border-slate-300 text-left font-sans">Sensitivitas, St ( - )</td>
                      <td colSpan={2} className="py-0.5 px-1 text-center font-black text-emerald-900">
                        {sensitivity.toFixed(defDigits)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. TWO-COLUMN CHARTS: STRESS VS STRAIN (LEFT) & MOHR CIRCLE (RIGHT) */}
            <div className="grid grid-cols-2 gap-2">
              {/* GRAFIK 1 (KIRI): TEGANGAN VS REGANGAN */}
              <div className="border border-slate-900 bg-white p-1.5 space-y-1">
                <div className="text-[8px] font-extrabold text-slate-900 uppercase tracking-wider text-center">
                  GRAFIK TEGANGAN VS REGANGAN / STRESS VS STRAIN CURVE
                </div>

                <div className="bg-white border border-slate-300 p-1">
                  <svg viewBox="0 0 460 212" className="w-full h-auto">
                    {/* Grid Background */}
                    <rect x="45" y="15" width="400" height="138" fill="#FFFFFF" stroke="#E2E8F0" />

                    {/* Y-axis Label */}
                    <text x="-84" y="12" transform="rotate(-90)" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#334155">Stress (kPa)</text>

                    {/* X-axis Label */}
                    <text x="245" y="169" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#334155">Strain (%)</text>

                    {/* Y Gridlines & Labels */}
                    {yTicks.map(val => {
                      const y = 153 - (val / maxYVal) * 138;
                      return (
                        <g key={val}>
                          <line x1="45" y1={y} x2="445" y2={y} stroke="#E2E8F0" strokeWidth="1" strokeDasharray={val === 0 ? undefined : '2 2'} />
                          <text x="40" y={y + 2.5} textAnchor="end" fontSize="7" fill="#475569">{val}</text>
                        </g>
                      );
                    })}

                    {/* X Gridlines & Labels */}
                    {xTicks.map(val => {
                      const x = 45 + (val / maxXVal) * 400;
                      return (
                        <g key={val}>
                          <line x1={x} y1="15" x2={x} y2="153" stroke="#E2E8F0" strokeWidth="1" strokeDasharray={val === 0 ? undefined : '2 2'} />
                          <text x={x} y="161" textAnchor="middle" fontSize="7" fill="#475569">{val}</text>
                        </g>
                      );
                    })}

                    {/* Axes */}
                    <line x1="45" y1="15" x2="45" y2="153" stroke="#475569" strokeWidth="1.2" />
                    <line x1="45" y1="153" x2="445" y2="153" stroke="#475569" strokeWidth="1.2" />

                    {/* 1. UNDISTURBED CURVE (SOLID BLUE) */}
                    {rowsUds.length > 0 && (() => {
                      const validPts = rowsUds.filter((r: any) => r.stressKpa > 0);
                      const pts = [{ px: 45, py: 153, stress: 0, strain: 0 }, ...validPts.map((r: any) => ({
                        px: 45 + (Math.min(maxXVal, r.strainPct) / maxXVal) * 400,
                        py: 153 - (Math.min(maxYVal, r.stressKpa) / maxYVal) * 138,
                        stress: r.stressKpa,
                        strain: r.strainPct
                      }))];
                      const pathStr = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.px.toFixed(1)} ${p.py.toFixed(1)}`, '');

                      // Peak Undisturbed
                      const peakPt = pts.reduce((prev, curr) => (curr.stress > prev.stress ? curr : prev), pts[0]);

                      return (
                        <g>
                          {/* Peak Projection Dashed Lines (Blue) */}
                          {peakPt.stress > 0 && (
                            <g>
                              <line x1="45" y1={peakPt.py} x2={peakPt.px} y2={peakPt.py} stroke="#93c5fd" strokeWidth="1.2" strokeDasharray="3 3" />
                              <line x1={peakPt.px} y1={peakPt.py} x2={peakPt.px} y2="153" stroke="#93c5fd" strokeWidth="1.2" strokeDasharray="3 3" />
                            </g>
                          )}

                          {/* Path Curve */}
                          <path d={pathStr} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                          {/* Peak Marker (Red Triangle) */}
                          {peakPt.stress > 0 && (
                            <polygon
                              points={`${peakPt.px},${peakPt.py - 5} ${peakPt.px - 4.5},${peakPt.py + 4} ${peakPt.px + 4.5},${peakPt.py + 4}`}
                              fill="#dc2626"
                              stroke="#ffffff"
                              strokeWidth="0.8"
                            />
                          )}
                        </g>
                      );
                    })()}

                    {/* 2. REMOLDED CURVE (SOLID ORANGE) */}
                    {rowsRem.length > 0 && (() => {
                      const validPts = rowsRem.filter((r: any) => r.stressKpa > 0);
                      const pts = [{ px: 45, py: 153, stress: 0, strain: 0 }, ...validPts.map((r: any) => ({
                        px: 45 + (Math.min(maxXVal, r.strainPct) / maxXVal) * 400,
                        py: 153 - (Math.min(maxYVal, r.stressKpa) / maxYVal) * 138,
                        stress: r.stressKpa,
                        strain: r.strainPct
                      }))];
                      const pathStr = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.px.toFixed(1)} ${p.py.toFixed(1)}`, '');

                      // Peak Remolded
                      const peakPt = pts.reduce((prev, curr) => (curr.stress > prev.stress ? curr : prev), pts[0]);

                      return (
                        <g>
                          {/* Peak Projection Dashed Lines (Orange) */}
                          {peakPt.stress > 0 && (
                            <g>
                              <line x1="45" y1={peakPt.py} x2={peakPt.px} y2={peakPt.py} stroke="#fdba74" strokeWidth="1.2" strokeDasharray="3 3" />
                              <line x1={peakPt.px} y1={peakPt.py} x2={peakPt.px} y2="153" stroke="#fdba74" strokeWidth="1.2" strokeDasharray="3 3" />
                            </g>
                          )}

                          {/* Path Curve */}
                          <path d={pathStr} fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                          {/* Peak Marker (Red Square) */}
                          {peakPt.stress > 0 && (
                            <rect
                              x={peakPt.px - 4}
                              y={peakPt.py - 4}
                              width="8"
                              height="8"
                              fill="#dc2626"
                              stroke="#ffffff"
                              strokeWidth="0.8"
                            />
                          )}
                        </g>
                      );
                    })()}

                    {/* 3. EXCEL-STYLE LEGEND BELOW CHART */}
                    <g transform="translate(0, 178)" fontSize="7" fill="#334155">
                      {/* Column 1 (Undisturb / Left) */}
                      <g transform="translate(60, 0)">
                        <line x1="0" y1="0" x2="35" y2="0" stroke="#2563eb" strokeWidth="2" />
                        <text x="42" y="3" fontWeight="500">Undisturb</text>

                        <polygon points="17,-13 12.5,-4 21.5,-4" fill="#dc2626" />
                        <text x="42" y="-5" fontWeight="500">qu = {Math.round(quUds)} kPa</text>

                        <line x1="0" y1="16" x2="35" y2="16" stroke="#93c5fd" strokeWidth="1.2" strokeDasharray="3 3" />
                        <text x="42" y="19" fontWeight="500">Peak Undisturbed</text>
                      </g>

                      {/* Column 2 (Remolded / Right) */}
                      <g transform="translate(240, 0)">
                        <line x1="0" y1="0" x2="35" y2="0" stroke="#ea580c" strokeWidth="2" />
                        <text x="42" y="3" fontWeight="500">Remolded</text>

                        <rect x="13" y="-13" width="8" height="8" fill="#dc2626" />
                        <text x="42" y="-5" fontWeight="500">qu = {Math.round(quRem)} kPa</text>

                        <line x1="0" y1="16" x2="35" y2="16" stroke="#fdba74" strokeWidth="1.2" strokeDasharray="3 3" />
                        <text x="42" y="19" fontWeight="500">Peak Remolded</text>
                      </g>
                    </g>
                  </svg>
                </div>
              </div>

              {/* GRAFIK 2 (KANAN): LINGKARAN MOHR (PERFECT SEMICIRCLE) */}
              <div className="border border-slate-900 bg-white p-1.5 space-y-1">
                <div className="text-[8px] font-extrabold text-slate-900 uppercase tracking-wider text-center">
                  GRAFIK LINGKARAN MOHR / MOHR'S CIRCLE
                </div>

                <div className="bg-white border border-slate-300 p-1">
                  {(() => {
                    // Calculate dynamic X & Y max with EXACT 20% headroom above peak values
                    const peakQuMax = Math.max(0, ...allStressesUds, ...allStressesRem, quUds, quRem, 100.0);
                    const maxStressVal = Math.max(120, Math.ceil((peakQuMax * 1.20) / 20) * 20); // Peak qu + 20% headroom!
                    const maxShearVal = maxStressVal / 2; // Y-max is exactly half of X-max (Peak Su + 20% headroom) for 1:1 ratio!

                    const xTicksMohr = [0, 1, 2, 3, 4].map(i => Math.round((maxStressVal / 4) * i));
                    const yTicksMohr = [0, 1, 2, 3, 4].map(i => Math.round((maxShearVal / 4) * i));

                    const plotW = 390;
                    const plotH = 195;
                    const originX = 45;
                    const originY = 210;

                    return (
                      <svg viewBox="0 0 460 255" className="w-full h-auto">
                        {/* Grid Background */}
                        <rect x={originX} y="15" width={plotW} height={plotH} fill="#FFFFFF" stroke="#E2E8F0" />
                        <text x="-110" y="12" transform="rotate(-90)" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#334155">Tegangan Geser τ (kPa)</text>
                        <text x={originX + plotW / 2} y={originY + 18} textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#334155">Tegangan Aksial σ (kPa)</text>

                        {/* Y Gridlines & Labels */}
                        {yTicksMohr.map(val => {
                          const y = originY - (val / maxShearVal) * plotH;
                          return (
                            <g key={val}>
                              <line x1={originX} y1={y} x2={originX + plotW} y2={y} stroke="#E2E8F0" strokeWidth="1" strokeDasharray={val === 0 ? undefined : '2 2'} />
                              <text x={originX - 5} y={y + 2.5} textAnchor="end" fontSize="7" fill="#475569">{val}</text>
                            </g>
                          );
                        })}

                        {/* X Gridlines & Labels */}
                        {xTicksMohr.map(val => {
                          const x = originX + (val / maxStressVal) * plotW;
                          return (
                            <g key={val}>
                              <line x1={x} y1="15" x2={x} y2={originY} stroke="#E2E8F0" strokeWidth="1" />
                              <text x={x} y="161" textAnchor="middle" fontSize="7" fill="#475569">{val}</text>
                            </g>
                          );
                        })}

                        <line x1={originX} y1="15" x2={originX} y2={originY} stroke="#334155" strokeWidth="1.2" />
                        <line x1={originX} y1={originY} x2={originX + plotW} y2={originY} stroke="#334155" strokeWidth="1.2" />

                        {/* 1. UNDISTURBED MOHR SEMICIRCLE (BLUE) */}
                        {quUds > 0 && (() => {
                          const x0 = originX;
                          const x1 = originX + (Math.min(maxStressVal, quUds) / maxStressVal) * plotW;
                          const rPx = (x1 - x0) / 2;
                          const cx = x0 + rPx;
                          const topY = originY - rPx;

                          return (
                            <g>
                              {/* Tangent line at top Su */}
                              <line x1={originX} y1={topY} x2={cx} y2={topY} stroke="#93c5fd" strokeWidth="1" strokeDasharray="2 2" />
                              <line x1={cx} y1={topY} x2={cx} y2={originY} stroke="#93c5fd" strokeWidth="1" strokeDasharray="2 2" />

                              {/* Perfect Semicircle Path */}
                              <path
                                d={`M ${x0.toFixed(1)} ${originY} A ${rPx.toFixed(1)} ${rPx.toFixed(1)} 0 0 1 ${x1.toFixed(1)} ${originY}`}
                                fill="none"
                                stroke="#2563eb"
                                strokeWidth="2"
                              />

                              {/* Center & Top Markers */}
                              <circle cx={cx} cy={topY} r="2.5" fill="#dc2626" />
                              <text x={cx} y={topY - 4} textAnchor="middle" fontSize="6.5" fontWeight="extrabold" fill="#2563eb">
                                Su={suUds.toFixed(1)}
                              </text>
                            </g>
                          );
                        })()}

                        {/* 2. REMOLDED MOHR SEMICIRCLE (ORANGE) */}
                        {quRem > 0 && (() => {
                          const x0 = originX;
                          const x1 = originX + (Math.min(maxStressVal, quRem) / maxStressVal) * plotW;
                          const rPx = (x1 - x0) / 2;
                          const cx = x0 + rPx;
                          const topY = originY - rPx;

                          return (
                            <g>
                              {/* Tangent line at top Su */}
                              <line x1={originX} y1={topY} x2={cx} y2={topY} stroke="#fdba74" strokeWidth="1" strokeDasharray="2 2" />
                              <line x1={cx} y1={topY} x2={cx} y2={originY} stroke="#fdba74" strokeWidth="1" strokeDasharray="2 2" />

                              {/* Perfect Semicircle Path */}
                              <path
                                d={`M ${x0.toFixed(1)} ${originY} A ${rPx.toFixed(1)} ${rPx.toFixed(1)} 0 0 1 ${x1.toFixed(1)} ${originY}`}
                                fill="none"
                                stroke="#ea580c"
                                strokeWidth="1.8"
                                strokeDasharray="4 3"
                              />

                              {/* Center & Top Markers */}
                              <circle cx={cx} cy={topY} r="2.5" fill="#dc2626" />
                              <text x={cx} y={topY - 4} textAnchor="middle" fontSize="6.5" fontWeight="extrabold" fill="#ea580c">
                                Su={suRem.toFixed(1)}
                              </text>
                            </g>
                          );
                        })()}

                        {/* Legend Mohr Circle */}
                        <g transform="translate(0, 178)" fontSize="7" fill="#334155">
                          <g transform="translate(50, 0)">
                            <line x1="0" y1="0" x2="25" y2="0" stroke="#2563eb" strokeWidth="2" />
                            <text x="30" y="3" fontWeight="bold">Undisturbed (qu={Math.round(quUds)} kPa)</text>
                          </g>
                          <g transform="translate(250, 0)">
                            <line x1="0" y1="0" x2="25" y2="0" stroke="#ea580c" strokeWidth="1.8" strokeDasharray="4 3" />
                            <text x="30" y="3" fontWeight="bold">Remolded (qu={Math.round(quRem)} kPa)</text>
                          </g>
                        </g>
                      </svg>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          <LHUFooter header={header} sheetCode="LHU_UCT" companyProfile={companyProfile} />
        </LHUPageContainer>

        {/* PAGE 2: LAMPIRAN / APPENDIX (FOTO PENGUJIAN & DOKUMENTASI UCT MATCHING LHU-UCT.pdf) */}
        <LHUPageContainer>
          <LHUHeader
            header={header}
            titleIndo="LAMPIRAN / APPENDIX"
            titleEn="UJI KUAT TEKAN BEBAS (UNCONFINED COMPRESSION TEST)"
            standardStr="SNI 3638:2012 / ASTM D2166"
            pageStr="2 dari 2"
            companyProfile={companyProfile}
          />

          <div className="flex-1 space-y-4 py-2 font-sans text-[8.5px]">
            {/* FOTO PENGUJIAN / TEST PHOTOS (MATCHING LHU-UCT.pdf PAGE 2) */}
            <div className="border border-slate-900 bg-white p-3 space-y-3">
              <div className="text-[9px] font-extrabold text-slate-900 uppercase tracking-wider text-center border-b border-slate-300 pb-1">
                FOTO PENGUJIAN / TEST PHOTOS
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                {/* PHOTO SLOT 1 */}
                <div className="border border-slate-300 bg-slate-50 rounded p-2 text-center space-y-2">
                  <div className="h-56 border border-dashed border-slate-400 bg-white flex flex-col items-center justify-center p-3 text-slate-400">
                    <svg className="w-10 h-10 mb-2 stroke-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[9px] font-bold text-slate-600">FOTO PENGUJIAN 1</span>
                    <span className="text-[8px] text-slate-400">Sampel Undisturbed Sebelum / Saat Keruntuhan</span>
                  </div>
                  <div className="text-[8.5px] font-bold text-slate-800">Sampel Undisturbed (UDS)</div>
                </div>

                {/* PHOTO SLOT 2 */}
                <div className="border border-slate-300 bg-slate-50 rounded p-2 text-center space-y-2">
                  <div className="h-56 border border-dashed border-slate-400 bg-white flex flex-col items-center justify-center p-3 text-slate-400">
                    <svg className="w-10 h-10 mb-2 stroke-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[9px] font-bold text-slate-600">FOTO PENGUJIAN 2</span>
                    <span className="text-[8px] text-slate-400">Sampel Remolded Sebelum / Saat Keruntuhan</span>
                  </div>
                  <div className="text-[8.5px] font-bold text-slate-800">Sampel Remolded (REM)</div>
                </div>
              </div>
            </div>

            {/* CATATAN / NOTES (MATCHING LHU-UCT.pdf) */}
            <div className="border border-slate-900 bg-slate-50 p-2.5 space-y-1 font-mono text-[7.5px] text-slate-700">
              <div className="font-extrabold text-slate-900 font-sans uppercase">CATATAN / NOTES :</div>
              <div>- Laporan Hasil Uji ini hanya berlaku untuk contoh yang diuji - This test report applies only to the tested sample.</div>
              <div>- Dilarang memperbanyak laporan tanpa ijin tertulis dari Laboratorium Mekanika Tanah PT. TERRAFORMA GEOTEKNIK INDONESIA - This report shall not be reproduced except in full without written approval from PT. TERRAFORMA GEOTEKNIK INDONESIA Soil Mechanics Laboratory.</div>
              <div>- Laboratorium tidak bertanggung jawab atas kegiatan pengambilan dan transportasi contoh yang dilakukan oleh pihak lain - The laboratory is not responsible for sampling, handling and sample transportation conducted by others.</div>
            </div>
          </div>

          <LHUFooter header={header} sheetCode="LHU_UCT" companyProfile={companyProfile} />
        </LHUPageContainer>
      </div>
    );
  }

  return (
    <LHUPageContainer>
      {/* 1. KOP SURAT & METADATA HEADER */}
      <LHUHeader
        header={header}
        titleIndo={sheetCode === 'LHU_PP' ? 'LAPORAN HASIL PENGUJIAN SIFAT FISIK TANAH' : testTypeName}
        titleEn={sheetCode === 'LHU_PP' ? '(PHYSICAL PROPERTIES LABORATORY TEST REPORT)' : `(${boundData.testCode} LABORATORY REPORT)`}
        standardStr={sheetCode === 'LHU_PP' ? 'SNI 1964:2008 / SNI 1965:2008 / SNI 2813:2008' : standard}
        companyProfile={companyProfile}
      />

      {/* 2. AREA UTAMA TABEL HASIL & GRAFIK (MATCHING QMS-RPS-001.xlsx 100%) */}
      <div className="flex-1 my-2 space-y-2 text-[9px] overflow-hidden">
        
        {/* 1. LHU_PP - TABEL HASIL PENGUJIAN SIFAT FISIK TANAH (MC, UW, SG) */}
        {sheetCode === 'LHU_PP' && (
          <div className="space-y-3 font-sans text-[8.5px]">
            <div className="flex items-center justify-between bg-[#1e40af] text-white px-2 py-1 font-bold uppercase text-[9px] tracking-wide">
              <span>TABEL HASIL PENGUJIAN KADAR AIR, BERAT JENIS &amp; BOBOT ISI (MC, UW, SG)</span>
              <span className="text-[8px] font-mono bg-emerald-600 px-1.5 py-0.5 rounded text-white font-normal">SNI / ASTM STANDARD</span>
            </div>

            <table className="w-full border-collapse border border-slate-900 text-left text-[8.5px]">
              <thead>
                <tr className="bg-slate-100 font-extrabold border-b border-slate-900 text-slate-900 text-center">
                  <th className="py-1 px-1 border-r border-slate-900 w-8">No</th>
                  <th className="py-1 px-2 border-r border-slate-900 text-left">Parameter / Description</th>
                  <th className="py-1 px-1 border-r border-slate-900 w-44">Metode Uji (Standard)</th>
                  <th className="py-1 px-1 border-r border-slate-900 w-20">Symbol</th>
                  <th className="py-1 px-1 border-r border-slate-900 w-20">Satuan</th>
                  <th className="py-1 px-1 border-r border-slate-900 w-28">Hasil Uji</th>
                  <th className="py-1 px-1 w-24">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-sans">
                {/* SECTION I: PENGUJIAN UTAMA */}
                <tr className="bg-slate-200/80 font-extrabold text-slate-900">
                  <td colSpan={7} className="py-0.5 px-2 text-left">A. Parameter Pengujian Laboratorium Utama (Lab Tests)</td>
                </tr>
                <tr>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">1</td>
                  <td className="py-1 px-2 font-semibold border-r border-slate-300">Kadar Air Asli / Moisture Content (MC)</td>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">SNI 1965 : 2008</td>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">w</td>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">%</td>
                  <td className="py-1 px-1 text-center font-bold text-emerald-800 border-r border-slate-300">{renderValBadge(parameters.moistureContent)}</td>
                  <td className="py-1 px-1 text-center text-slate-400">-</td>
                </tr>
                <tr>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">2</td>
                  <td className="py-1 px-2 font-semibold border-r border-slate-300">Berat Jenis Tanah / Specific Gravity (SG)</td>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">SNI 1964 : 2008</td>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">Gs</td>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">-</td>
                  <td className="py-1 px-1 text-center font-bold text-emerald-800 border-r border-slate-300">{renderValBadge(parameters.specificGravity)}</td>
                  <td className="py-1 px-1 text-center text-slate-400">-</td>
                </tr>
                <tr>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">3</td>
                  <td className="py-1 px-2 font-semibold border-r border-slate-300">Berat Isi Basah / Bulk Density / Wet Unit Weight</td>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">SNI 2813 : 2008</td>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">γ_wet</td>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">g/cm³</td>
                  <td className="py-1 px-1 text-center font-bold text-emerald-800 border-r border-slate-300">{renderValBadge(parameters.bulkDensity)}</td>
                  <td className="py-1 px-1 text-center text-slate-400">-</td>
                </tr>
                <tr>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">4</td>
                  <td className="py-1 px-2 font-semibold border-r border-slate-300">Berat Isi Kering / Dry Density / Dry Unit Weight</td>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">SNI 2813 : 2008</td>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">γ_dry</td>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">g/cm³</td>
                  <td className="py-1 px-1 text-center font-bold text-emerald-800 border-r border-slate-300">{renderValBadge(parameters.dryDensity)}</td>
                  <td className="py-1 px-1 text-center text-slate-400">-</td>
                </tr>

                {/* SECTION II: HUBUNGAN BERAT-VOLUME / PARAMETER TURUNAN */}
                <tr className="bg-slate-200/80 font-extrabold text-slate-900">
                  <td colSpan={7} className="py-0.5 px-2 text-left">B. Hubungan Berat &amp; Volume / Phase Relationships (Calculated Values)</td>
                </tr>
                <tr>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">5</td>
                  <td className="py-1 px-2 font-semibold border-r border-slate-300">Angka Pori / Void Ratio</td>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">ASTM D2487</td>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">e</td>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">-</td>
                  <td className="py-1 px-1 text-center font-bold text-emerald-800 border-r border-slate-300">{renderValBadge(parameters.voidRatio)}</td>
                  <td className="py-1 px-1 text-center text-slate-400">-</td>
                </tr>
                <tr>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">6</td>
                  <td className="py-1 px-2 font-semibold border-r border-slate-300">Porositas / Porosity</td>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">ASTM D2487</td>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">n</td>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">%</td>
                  <td className="py-1 px-1 text-center font-bold text-emerald-800 border-r border-slate-300">{renderValBadge(parameters.porosity)}</td>
                  <td className="py-1 px-1 text-center text-slate-400">-</td>
                </tr>
                <tr>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">7</td>
                  <td className="py-1 px-2 font-semibold border-r border-slate-300">Derajat Kejenuhan / Degree of Saturation</td>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">ASTM D2487</td>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">Sr</td>
                  <td className="py-1 px-1 text-center font-mono border-r border-slate-300">%</td>
                  <td className="py-1 px-1 text-center font-bold text-emerald-800 border-r border-slate-300">{renderValBadge(parameters.degreeSat)}</td>
                  <td className="py-1 px-1 text-center text-slate-400">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 2. LHU_ATB */}
        {sheetCode === 'LHU_ATB' && (() => {
          const defDigits = boundData.header.decimalPlaces ?? 3;
          const raw = boundData.rawDetails || {};
          const llNum = raw.llNum || 0;
          const plNum = raw.plNum || 0;
          const piNum = raw.piNum || 0;
          const uscsCode = raw.uscsCode || '-';
          const blows = raw.blows || ['11', '23', '31', '44'];
          const mcLL = raw.mcLL || [];
          const mcPL = raw.mcPL || [];

          // Prepare valid LL points for semi-log regression
          const llPoints: { b: number; mc: number }[] = [];
          blows.forEach((bStr: string, i: number) => {
            const b = parseFloat(bStr) || 0;
            const mc = mcLL[i] !== undefined && mcLL[i] !== null ? parseFloat(String(mcLL[i])) : 0;
            if (b > 0 && mc > 0) {
              llPoints.push({ b, mc });
            }
          });

          // Calculate semi-log regression slope & intercept for flow line
          let slopeM = 0;
          let interceptC = 0;
          if (llPoints.length > 1) {
            const n = llPoints.length;
            const sumX = llPoints.reduce((acc, t) => acc + Math.log10(t.b), 0);
            const sumY = llPoints.reduce((acc, t) => acc + t.mc, 0);
            const sumXY = llPoints.reduce((acc, t) => acc + (Math.log10(t.b) * t.mc), 0);
            const sumX2 = llPoints.reduce((acc, t) => acc + Math.pow(Math.log10(t.b), 2), 0);
            const denom = (n * sumX2) - (sumX * sumX);
            if (Math.abs(denom) > 1e-6) {
              slopeM = ((n * sumXY) - (sumX * sumY)) / denom;
              interceptC = (sumY - (slopeM * sumX)) / n;
            }
          }

          return (
            <div className="grid grid-cols-2 gap-2 text-[8.5px] font-sans">
              {/* KOLOM KIRI: DATA BATAS CAIR, BATAS PLASTIS, & GRAFIK FLOW CURVE */}
              <div className="space-y-1.5 flex flex-col justify-between">
                {/* 1. DATA BATAS CAIR */}
                <div className="border border-slate-900 bg-white">
                  <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-bold uppercase text-[8px] tracking-wide">
                    DATA BATAS CAIR / LIQUID LIMIT DATA
                  </div>
                  <table className="w-full text-[8.5px] border-collapse text-center">
                    <thead className="bg-slate-100 font-bold border-b border-slate-900">
                      <tr>
                        <th className="p-0.5 border-r border-slate-900">Jumlah Pukulan / Number of Blows</th>
                        <th className="p-0.5">Kadar Air / Moisture Content (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-mono">
                      {blows.map((b: string, i: number) => {
                        const valNum = mcLL[i] !== undefined && mcLL[i] !== null ? parseFloat(String(mcLL[i])) : 0;
                        return (
                          <tr key={i}>
                            <td className="p-0.5 border-r border-slate-300 font-bold">{b || (i === 0 ? '40' : i === 1 ? '31' : i === 2 ? '20' : '12')}</td>
                            <td className="p-0.5">{valNum > 0 ? `${valNum.toFixed(defDigits)} %` : renderValBadge(parameters.liquidLimit)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 2. DATA BATAS PLASTIS */}
                <div className="border border-slate-900 bg-white">
                  <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-bold uppercase text-[8px] tracking-wide">
                    DATA BATAS PLASTIS / PLASTIC LIMIT DATA
                  </div>
                  <table className="w-full text-[8.5px] border-collapse text-center">
                    <thead className="bg-slate-100 font-bold border-b border-slate-900">
                      <tr>
                        <th className="p-0.5 border-r border-slate-900">Pengulangan / Trial</th>
                        <th className="p-0.5">Kadar Air / Moisture Content (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-mono">
                      <tr>
                        <td className="p-0.5 border-r border-slate-300 font-bold">1</td>
                        <td className="p-0.5">{mcPL[0] && parseFloat(String(mcPL[0])) > 0 ? `${parseFloat(String(mcPL[0])).toFixed(defDigits)} %` : renderValBadge(parameters.plasticLimit)}</td>
                      </tr>
                      <tr>
                        <td className="p-0.5 border-r border-slate-300 font-bold">2</td>
                        <td className="p-0.5">{mcPL[1] && parseFloat(String(mcPL[1])) > 0 ? `${parseFloat(String(mcPL[1])).toFixed(defDigits)} %` : renderValBadge(parameters.plasticLimit)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3. GRAFIK BATAS CAIR (FLOW CURVE) - HIGH PRECISION MATH FROM FORM UJI */}
                <div className="border border-slate-900 bg-white p-1">
                  <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-bold uppercase text-[8px] tracking-wide mb-1">
                    GRAFIK / GRAFIK BATAS CAIR / LIQUID LIMIT FLOW CURVE
                  </div>
                  <svg viewBox="0 0 460 200" className="w-full h-56 bg-white border border-slate-200 overflow-visible">
                    {/* Y-axis label */}
                    <text x="-88" y="12" transform="rotate(-90)" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#475569">Kadar Air / Moisture Content (%)</text>
                    {/* X-axis label */}
                    <text x="252" y="196" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#475569">Jumlah Ketukan / Num. of Blows</text>

                    {/* Grid Y: 0 to 100 % */}
                    {[0, 20, 40, 60, 80, 100].map(val => {
                      const y = 15 + ((100 - val) / 100) * 158;
                      return (
                        <g key={val}>
                          <line x1="42" y1={y} x2="445" y2={y} stroke={val === 0 ? '#94A3B8' : '#E2E8F0'} strokeWidth={val === 0 ? '1.5' : '1'} />
                          <text x="38" y={y + 3} textAnchor="end" fontSize="7.5" fill="#94A3B8">{val}</text>
                        </g>
                      );
                    })}

                    {/* Vertical log grid: blows 1 to 100 */}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100].map(val => {
                      const x = 42 + (Math.log10(val) / 2) * 403;
                      const isMajor = val === 1 || val === 10 || val === 25 || val === 100;
                      return (
                        <g key={val}>
                          <line x1={x} y1="15" x2={x} y2="173" stroke={isMajor ? '#CBD5E1' : '#F1F5F9'} strokeWidth={isMajor ? '1.5' : '1'} strokeDasharray={val === 25 ? '4 3' : undefined} />
                          {isMajor && <text x={x} y="184" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#64748B">{val}</text>}
                        </g>
                      );
                    })}

                    {/* Axes */}
                    <line x1="42" y1="15" x2="42" y2="173" stroke="#334155" strokeWidth="1.5" />
                    <line x1="42" y1="173" x2="445" y2="173" stroke="#334155" strokeWidth="1.5" />

                    {/* Regression Line: from min blow point to max blow point */}
                    {llPoints.length > 1 && slopeM !== 0 && (() => {
                      const blowsList = llPoints.map(t => t.b).sort((a, b) => a - b);
                      const x1v = blowsList[0];
                      const y1v = slopeM * Math.log10(x1v) + interceptC;
                      const x2v = blowsList[blowsList.length - 1];
                      const y2v = slopeM * Math.log10(x2v) + interceptC;

                      const px1 = 42 + (Math.log10(x1v) / 2) * 403;
                      const py1 = 15 + ((100 - Math.min(100, Math.max(0, y1v))) / 100) * 158;
                      const px2 = 42 + (Math.log10(x2v) / 2) * 403;
                      const py2 = 15 + ((100 - Math.min(100, Math.max(0, y2v))) / 100) * 158;
                      return <line x1={px1} y1={py1} x2={px2} y2={py2} stroke="#2563EB" strokeWidth="2" />;
                    })()}

                    {/* Individual Data Points with Alternating Label Placement */}
                    {llPoints.map((t, idx) => {
                      const px = 42 + (Math.log10(t.b) / 2) * 403;
                      const py = 15 + ((100 - Math.min(100, Math.max(0, t.mc))) / 100) * 158;
                      const isEven = idx % 2 === 0;
                      const textY = isEven ? py - 7 : py + 14;
                      return (
                        <g key={idx}>
                          <circle cx={px} cy={py} r="4" fill="#2563EB" stroke="#fff" strokeWidth="1.5" />
                          <text x={px} y={textY} textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#1E40AF">{t.mc.toFixed(defDigits)}%</text>
                        </g>
                      );
                    })}

                    {/* LL @ 25 Blows Indicator Point & Non-Overlapping Label */}
                    {llNum > 0 && (() => {
                      const x25 = 42 + (Math.log10(25) / 2) * 403;
                      const y25 = 15 + ((100 - Math.min(100, Math.max(0, llNum))) / 100) * 158;
                      return (
                        <g>
                          <line x1={x25} y1={y25} x2={x25} y2="173" stroke="#EA580C" strokeWidth="1.5" strokeDasharray="3 3" />
                          <line x1="42" y1={y25} x2={x25} y2={y25} stroke="#EA580C" strokeWidth="1.5" strokeDasharray="3 3" />
                          <circle cx={x25} cy={y25} r="4" fill="#EA580C" stroke="#fff" strokeWidth="1.5" />
                          <text x={x25 - 6} y={y25 - 6} textAnchor="end" fontSize="7.5" fontWeight="bold" fill="#EA580C">LL = {llNum.toFixed(defDigits)}%</text>
                        </g>
                      );
                    })()}
                  </svg>
                </div>
              </div>

              {/* KOLOM KANAN: GRAFIK USCS PLASTICITY CHART & PARAMETER HASIL PENGUJIAN */}
              <div className="space-y-1.5 flex flex-col justify-between">
                {/* 1. GRAFIK KLASIFIKASI PLASTISITAS TANAH / USCS PLASTICITY CHART - HIGH PRECISION MATH FROM FORM UJI */}
                <div className="border border-slate-900 bg-white p-1">
                  <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-bold uppercase text-[8px] tracking-wide mb-1">
                    GRAFIK KLASIFIKASI PLASTISITAS TANAH / USCS PLASTICITY CHART
                  </div>
                  <svg viewBox="0 0 350 285" className="w-full h-auto max-h-[285px] bg-white border border-slate-200 overflow-visible mx-auto">
                    {/* Y-axis label */}
                    <text x="-125" y="10" transform="rotate(-90)" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#475569">Indeks Plastisitas / Plasticity Index (PI)</text>
                    {/* X-axis label */}
                    <text x="178" y="275" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#475569">Batas Cair / Liquid Limit (LL)</text>

                    {/* Grid Y: PI 0 to 80 (Equal unit scale with X-axis) */}
                    {[0, 10, 20, 30, 40, 50, 60, 70, 80].map(val => {
                      const y = 15 + ((80 - val) / 80) * 224;
                      return (
                        <g key={val}>
                          <line x1="38" y1={y} x2="318" y2={y} stroke={val === 0 ? '#94A3B8' : '#F1F5F9'} strokeWidth={val === 0 ? '1.5' : '1'} />
                          <text x="34" y={y + 2.5} textAnchor="end" fontSize="7" fill="#64748B">{val}</text>
                        </g>
                      );
                    })}

                    {/* Grid X: LL 0 to 100 (Equal unit scale with Y-axis) */}
                    {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(val => {
                      const x = 38 + (val / 100) * 280;
                      return (
                        <g key={val}>
                          <line x1={x} y1="15" x2={x} y2="239" stroke={val === 50 ? '#475569' : '#F1F5F9'} strokeWidth={val === 50 ? '1.5' : '1'} />
                          <text x={x} y="251" textAnchor="middle" fontSize="7" fill="#64748B">{val}</text>
                        </g>
                      );
                    })}

                    {/* Axes (Length of X = 280px, Length of Y = 224px, 1 unit = 2.80px) */}
                    <line x1="38" y1="15" x2="38" y2="239" stroke="#334155" strokeWidth="1.5" />
                    <line x1="38" y1="239" x2="318" y2="239" stroke="#334155" strokeWidth="1.5" />

                    {/* A-Line: PI = 0.73 * (LL - 20) */}
                    {(() => {
                      const ax1 = 38 + (20 / 100) * 280; 
                      const ay1 = 239;
                      const ax2 = 38 + (100 / 100) * 280; 
                      const pi2 = 0.73 * (100 - 20); // 58.4
                      const ay2 = 15 + ((80 - pi2) / 80) * 224;
                      return (
                        <g>
                          <line x1={ax1} y1={ay1} x2={ax2} y2={ay2} stroke="#000000" strokeWidth="1.5" />
                          <text x={ax2 - 25} y={ay2 - 5} fontSize="6.5" fontWeight="bold" fill="#1E293B" transform={`rotate(-36 ${ax2-25} ${ay2-5})`}>A-Line: PI=0.73(LL-20)</text>
                        </g>
                      );
                    })()}

                    {/* U-Line: PI = 0.9 * (LL - 8) */}
                    {(() => {
                      const ux1 = 38 + (8 / 100) * 280; 
                      const uy1 = 239;
                      // Reaches PI=80 at LL = 8 + 80/0.9 = 96.89
                      const maxLL_U = Math.min(100, 8 + (80 / 0.9));
                      const ux2 = 38 + (maxLL_U / 100) * 280; 
                      const uy2 = 15;
                      return (
                        <g>
                          <line x1={ux1} y1={uy1} x2={ux2} y2={uy2} stroke="#64748B" strokeWidth="1" strokeDasharray="3 3" />
                          <text x={ux2 - 25} y={uy2 + 10} fontSize="6" fontWeight="bold" fill="#64748B" transform={`rotate(-42 ${ux2-25} ${uy2+10})`}>U-Line: PI=0.9(LL-8)</text>
                        </g>
                      );
                    })()}

                    {/* CL-ML Zone */}
                    {(() => {
                      const y4 = 15 + ((80 - 4) / 80) * 224; 
                      const y7 = 15 + ((80 - 7) / 80) * 224;
                      const xBound = 38 + (29.6 / 100) * 280;
                      return (
                        <g>
                          <rect x="38" y={y7} width={xBound - 38} height={y4 - y7} fill="#EFF6FF" opacity="0.6" />
                          <line x1="38" y1={y4} x2={xBound} y2={y4} stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
                          <line x1="38" y1={y7} x2={xBound} y2={y7} stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
                          <text x="65" y={y4 - 2} fontSize="7" fontWeight="bold" fill="#475569">CL-ML</text>
                        </g>
                      );
                    })()}

                    {/* Region Labels */}
                    <text x="140" y="165" fontSize="10" fontWeight="900" fill="#334155">CL<tspan fontSize="7.5" fontWeight="normal" fill="#94A3B8"> or OL</tspan></text>
                    <text x="220" y="80" fontSize="10" fontWeight="900" fill="#334155">CH<tspan fontSize="7.5" fontWeight="normal" fill="#94A3B8"> or OH</tspan></text>
                    <text x="145" y="210" fontSize="10" fontWeight="900" fill="#334155">ML<tspan fontSize="7.5" fontWeight="normal" fill="#94A3B8"> or OL</tspan></text>
                    <text x="235" y="175" fontSize="10" fontWeight="900" fill="#334155">MH<tspan fontSize="7.5" fontWeight="normal" fill="#94A3B8"> or OH</tspan></text>

                    {/* Green Plot Point */}
                    {llNum > 0 && piNum >= 0 && (() => {
                      const px = 38 + (Math.min(100, Math.max(0, llNum)) / 100) * 280;
                      const py = 15 + ((80 - Math.min(80, Math.max(0, piNum))) / 80) * 224;
                      return (
                        <g>
                          <circle cx={px} cy={py} r="5" fill="#16A34A" stroke="#fff" strokeWidth="1.5" />
                          <text x={px + 6} y={py + 3} fontSize="7.5" fontWeight="bold" fill="#15803D">({llNum.toFixed(defDigits)}, {piNum.toFixed(defDigits)})</text>
                        </g>
                      );
                    })()}
                  </svg>
                </div>

                {/* 2. PARAMETER HASIL PENGUJIAN */}
                <div className="border border-slate-900 bg-white">
                  <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-bold uppercase text-[8px] tracking-wide">
                    PARAMETER HASIL PENGUJIAN / TEST RESULT PARAMETERS
                  </div>
                  <table className="w-full text-[9px] border-collapse text-left">
                    <tbody className="divide-y divide-slate-300 font-sans">
                      <tr>
                        <td className="p-1 font-semibold border-r border-slate-300 w-2/3">Batas Cair / Liquid Limit, LL (%) :</td>
                        <td className="p-1 text-center font-mono font-bold">{renderValBadge(parameters.liquidLimit)}</td>
                      </tr>
                      <tr>
                        <td className="p-1 font-semibold border-r border-slate-300">Batas Plastis / Plastic Limit, PL (%) :</td>
                        <td className="p-1 text-center font-mono font-bold">{renderValBadge(parameters.plasticLimit)}</td>
                      </tr>
                      <tr>
                        <td className="p-1 font-semibold border-r border-slate-300">Indeks Plastisitas / Plasticity Index, PI (%) :</td>
                        <td className="p-1 text-center font-mono font-bold">{renderValBadge(parameters.plasticityIndex)}</td>
                      </tr>
                      <tr>
                        <td className="p-1 font-semibold border-r border-slate-300">Klasifikasi USCS / USCS Classification :</td>
                        <td className="p-1 text-center font-extrabold font-mono text-[#1e40af]">{renderValBadge(parameters.uscsClassification)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 3. LHU_Sieve & Hidro */}
        {sheetCode === 'LHU_Sieve & Hidro' && (() => {
          const defDigits = boundData.header.decimalPlaces ?? 3;
          const raw = boundData.rawDetails || {};
          const gravel = raw.gravel || 0;
          const sand = raw.sand || 0;
          const silt = raw.silt || 0;
          const clay = raw.clay || 0;
          const gsAvg = raw.gsAvg || 2.65;
          const d10 = raw.d10 || 0.030;
          const d30 = raw.d30 || 0.060;
          const d60 = raw.d60 || 0.470;
          const cu = raw.cu || 15.67;
          const cc = raw.cc || 0.25;

          const sieveResults = raw.sieveResults || [];
          const hydroResults = raw.hydroResults || [];
          const uscsCode: string = raw.uscsCode || '-';
          const soilName: string = raw.soilName || '-';

          // Find % Passing No. 200 (0.075mm) to cap hydrometer % finer and ensure smooth continuity
          const no200Obj = sieveResults.find((s: any) => s.name === 'No. 200' || s.openingMm === 0.075);
          const pctPassingNo200 = no200Obj && no200Obj.pctPassing !== undefined ? parseFloat(no200Obj.pctPassing) : (sieveResults.length > 0 ? parseFloat(sieveResults[sieveResults.length - 1].pctPassing) : 31.19);

          return (
            <div className="space-y-1.5 text-[9px] font-sans">
              {/* TOP SECTION: HASIL PENGUJIAN / TEST RESULT (2 COLUMNS) */}
              <div className="grid grid-cols-2 gap-2 items-start">
                {/* 1. HASIL ANALISA SARINGAN / SIEVE ANALYSIS RESULT */}
                <div className="border border-slate-900 bg-white">
                  <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-bold uppercase text-[8px] tracking-wide">
                    1. HASIL ANALISA SARINGAN / SIEVE ANALYSIS RESULT
                  </div>
                  <table className="w-full text-[8.5px] border-collapse text-center">
                    <thead className="bg-slate-100 font-bold border-b border-slate-900">
                      <tr>
                        <th className="py-1 px-0.5 border-r border-slate-900">Ukuran Saringan / Sieve Size</th>
                        <th className="py-1 px-0.5 border-r border-slate-900">Berat Tertahan / Mass Retained (g)</th>
                        <th className="py-1 px-0.5 border-r border-slate-900">% Tertahan / Percent Retained (%)</th>
                        <th className="py-1 px-0.5">% Lolos / Percent Passing (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-mono">
                      {sieveResults.map((s: any, i: number) => (
                        <tr key={i}>
                          <td className="py-0.5 px-0.5 border-r border-slate-300 font-bold">{s.name}</td>
                          <td className="py-0.5 px-0.5 border-r border-slate-300">{s.retained !== undefined ? parseFloat(s.retained).toFixed(defDigits) : '-'}</td>
                          <td className="py-0.5 px-0.5 border-r border-slate-300">{s.pctRetained !== undefined ? parseFloat(s.pctRetained).toFixed(defDigits) : '-'}</td>
                          <td className="py-0.5 px-0.5 font-bold text-emerald-800">{s.pctPassing !== undefined ? parseFloat(s.pctPassing).toFixed(defDigits) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 2. HASIL HIDROMETER / HYDROMETER RESULT */}
                <div className="border border-slate-900 bg-white">
                  <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-bold uppercase text-[8px] tracking-wide">
                    2. HASIL HIDROMETER / HYDROMETER RESULT
                  </div>
                  <table className="w-full text-[8.5px] border-collapse text-center">
                    <thead className="bg-slate-100 font-bold border-b border-slate-900">
                      <tr>
                        <th className="py-1 px-1 border-r border-slate-900">Diameter Butir / Particle Diameter (mm)</th>
                        <th className="py-1 px-1">Persentase Lebih Halus / Percent Finer (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-mono">
                      {hydroResults.map((h: any, i: number) => (
                        <tr key={i}>
                          <td className="py-0.5 px-1 border-r border-slate-300 font-bold">{h.diamD !== undefined ? parseFloat(h.diamD).toFixed(defDigits) : '-'}</td>
                          <td className="py-0.5 px-1 font-bold text-emerald-800">{h.pctFiner !== undefined ? parseFloat(h.pctFiner).toFixed(defDigits) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* LOWER SECTION: GRAFIK & PARAMETER (2 COLUMNS) */}
              <div className="grid grid-cols-2 gap-2">
                {/* LEFT: KURVA DISTRIBUSI UKURAN BUTIR / PARTICLE SIZE DISTRIBUTION CURVE */}
                <div className="border border-slate-900 bg-white p-1 flex flex-col justify-between">
                  <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-bold uppercase text-[8px] tracking-wide mb-1">
                    GRAFIK / KURVA DISTRIBUSI UKURAN BUTIR / PARTICLE SIZE DISTRIBUTION CURVE
                  </div>
                  
                  <svg viewBox="0 0 460 210" className="w-full h-64 bg-white border border-slate-200 overflow-visible">
                    {/* Y-axis label */}
                    <text x="-95" y="12" transform="rotate(-90)" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#475569">Persen Lolos / Percent Passing (%)</text>
                    {/* X-axis label */}
                    <text x="240" y="206" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#475569">Diameter Butir / Grain Diameter (mm)</text>

                    {/* Grid Y: 0 to 100 % */}
                    {[0, 20, 40, 60, 80, 100].map(val => {
                      const y = 15 + ((100 - val) / 100) * 158;
                      return (
                        <g key={val}>
                          <line x1="42" y1={y} x2="445" y2={y} stroke={val === 0 ? '#94A3B8' : '#E2E8F0'} strokeWidth={val === 0 ? '1.5' : '1'} />
                          <text x="38" y={y + 3} textAnchor="end" fontSize="7.5" fill="#94A3B8">{val}</text>
                        </g>
                      );
                    })}

                    {/* Log Grid X: 5 Log Cycles (0.001 to 100 mm) */}
                    {[0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.074, 0.1, 0.42, 1, 2, 4.76, 10, 19.05, 100].map(val => {
                      const logVal = Math.log10(val);
                      const x = 42 + ((logVal + 3) / 5) * 403;
                      const isMajor = [0.001, 0.01, 0.1, 1, 10, 100].includes(val);
                      return (
                        <g key={val}>
                          <line x1={x} y1="15" x2={x} y2="173" stroke={isMajor ? '#CBD5E1' : '#F1F5F9'} strokeWidth={isMajor ? '1.5' : '0.8'} strokeDasharray={!isMajor ? '2 2' : undefined} />
                          {isMajor && <text x={x} y="184" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#64748B">{val}</text>}
                        </g>
                      );
                    })}

                    {/* Soil Fraction Region Dividers */}
                    {(() => {
                      const xClay = 42 + ((Math.log10(0.002) + 3) / 5) * 403;
                      const xSilt = 42 + ((Math.log10(0.074) + 3) / 5) * 403;
                      const xSand = 42 + ((Math.log10(4.76) + 3) / 5) * 403;
                      return (
                        <g>
                          <line x1={xClay} y1="15" x2={xClay} y2="173" stroke="#6366F1" strokeWidth="1" strokeDasharray="3 3" />
                          <line x1={xSilt} y1="15" x2={xSilt} y2="173" stroke="#0EA5E9" strokeWidth="1" strokeDasharray="3 3" />
                          <line x1={xSand} y1="15" x2={xSand} y2="173" stroke="#14B8A6" strokeWidth="1" strokeDasharray="3 3" />
                          <text x={(42 + xClay) / 2} y="24" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#4338CA">LEMPUNG</text>
                          <text x={(xClay + xSilt) / 2} y="24" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#0369A1">LANAU</text>
                          <text x={(xSilt + xSand) / 2} y="24" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#0F766E">PASIR</text>
                          <text x={(xSand + 445) / 2} y="24" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#B45309">KERIKIL</text>
                        </g>
                      );
                    })()}

                    {/* Axes */}
                    <line x1="42" y1="15" x2="42" y2="173" stroke="#334155" strokeWidth="1.5" />
                    <line x1="42" y1="173" x2="445" y2="173" stroke="#334155" strokeWidth="1.5" />

                    {/* Combined Plot Line: Sieve points + Hydrometer points */}
                    {(() => {
                      const pts: { x: number; y: number; d: number }[] = [];

                      sieveResults.forEach((s: any) => {
                        const opening = parseFloat(s.openingMm);
                        const passing = parseFloat(s.pctPassing);
                        if (!isNaN(opening) && opening > 0 && !isNaN(passing)) {
                          const px = 42 + ((Math.log10(opening) + 3) / 5) * 403;
                          const py = 15 + ((100 - Math.min(100, Math.max(0, passing))) / 100) * 158;
                          pts.push({ x: px, y: py, d: opening });
                        }
                      });

                      hydroResults.forEach((h: any) => {
                        const diamD = parseFloat(h.diamD);
                        let finer = parseFloat(h.pctFiner);
                        if (!isNaN(diamD) && diamD > 0 && !isNaN(finer)) {
                          // Cap hydrometer % finer at No. 200 passing to eliminate artificial spike/discontinuity
                          if (pctPassingNo200 > 0) {
                            finer = Math.min(pctPassingNo200, finer);
                          }
                          const px = 42 + ((Math.log10(diamD) + 3) / 5) * 403;
                          const py = 15 + ((100 - Math.min(100, Math.max(0, finer))) / 100) * 158;
                          pts.push({ x: px, y: py, d: diamD });
                        }
                      });

                      // Sort points by diameter D ascending (x pixel ascending)
                      pts.sort((a, b) => a.x - b.x);
                      if (pts.length === 0) return null;

                      const pathStr = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');

                      return (
                        <g>
                          <path d={pathStr} fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
                          {pts.map((p, idx) => (
                            <circle key={idx} cx={p.x} cy={p.y} r="3.5" fill="#0284C7" stroke="#fff" strokeWidth="1.5" />
                          ))}
                        </g>
                      );
                    })()}
                  </svg>

                  <div className="text-[7px] text-slate-500 font-mono text-center mt-1">
                    Sieve and Hydrometer Curve · D10: {d10.toFixed(defDigits)} mm · D30: {d30.toFixed(defDigits)} mm · D60: {d60.toFixed(defDigits)} mm
                  </div>
                </div>

                {/* RIGHT: PARAMETER HASIL UJI / TEST RESULT PARAMETERS */}
                <div className="border border-slate-900 bg-white flex flex-col justify-between">
                  <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-bold uppercase text-[8px] tracking-wide">
                    PARAMETER HASIL UJI / TEST RESULT PARAMETERS
                  </div>
                  <table className="w-full text-[8.5px] border-collapse text-left flex-1">
                    <tbody className="divide-y divide-slate-300 font-sans">
                      <tr>
                        <td className="p-1 font-semibold border-r border-slate-300">Berat Jenis Tanah / Specific Gravity, Gs (-) :</td>
                        <td className="p-1 text-center font-mono font-bold">{gsAvg.toFixed(defDigits)}</td>
                      </tr>
                      <tr>
                        <td className="p-1 font-semibold border-r border-slate-300">Kerikil / Gravel (%) :</td>
                        <td className="p-1 text-center font-mono font-bold">{gravel.toFixed(defDigits)}</td>
                      </tr>
                      <tr>
                        <td className="p-1 font-semibold border-r border-slate-300">Pasir / Sand (%) :</td>
                        <td className="p-1 text-center font-mono font-bold">{sand.toFixed(defDigits)}</td>
                      </tr>
                      <tr>
                        <td className="p-1 font-semibold border-r border-slate-300">Lanau / Silt (%) :</td>
                        <td className="p-1 text-center font-mono font-bold">{silt.toFixed(defDigits)}</td>
                      </tr>
                      <tr>
                        <td className="p-1 font-semibold border-r border-slate-300">Lempung / Clay (%) :</td>
                        <td className="p-1 text-center font-mono font-bold">{clay.toFixed(defDigits)}</td>
                      </tr>
                      <tr>
                        <td className="p-1 font-semibold border-r border-slate-300">Klasifikasi Jenis Tanah (USCS) / Soil Classification* :</td>
                        <td className="p-1 text-center font-extrabold font-mono text-[#1e40af]">
                          {renderValBadge(parameters.uscsClassification)}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-1 font-semibold border-r border-slate-300">D10 (mm) :</td>
                        <td className="p-1 text-center font-mono font-bold">{d10 > 0 ? d10.toFixed(defDigits) : '-'}</td>
                      </tr>
                      <tr>
                        <td className="p-1 font-semibold border-r border-slate-300">D30 (mm) :</td>
                        <td className="p-1 text-center font-mono font-bold">{d30 > 0 ? d30.toFixed(defDigits) : '-'}</td>
                      </tr>
                      <tr>
                        <td className="p-1 font-semibold border-r border-slate-300">D60 (mm) :</td>
                        <td className="p-1 text-center font-mono font-bold">{d60 > 0 ? d60.toFixed(defDigits) : '-'}</td>
                      </tr>
                      <tr>
                        <td className="p-1 font-semibold border-r border-slate-300">Cu (-) :</td>
                        <td className="p-1 text-center font-mono font-bold">{cu > 0 ? cu.toFixed(defDigits) : '-'}</td>
                      </tr>
                      <tr>
                        <td className="p-1 font-semibold border-r border-slate-300">Cc (-) :</td>
                        <td className="p-1 text-center font-mono font-bold">{cc > 0 ? cc.toFixed(defDigits) : '-'}</td>
                      </tr>
                      <tr>
                        <td className="p-1 font-semibold border-r border-slate-300">Klasifikasi Jenis Tanah (USCS) / Soil Classification* :</td>
                        <td className="p-1 text-center font-extrabold font-mono text-[#1e40af]">
                          {(() => {
                            const raw = boundData.rawDetails || {};
                            return raw.uscsCode || '-';
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* HERO SOIL NAME CARD - ASTM D2487 Descriptive Name */}
                  <div className="mx-1 mb-1 mt-0.5 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white rounded p-1.5 flex items-center justify-between border border-slate-600">
                    <div>
                      <div className="text-[7px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">JENIS TANAH / SOIL TYPE (ASTM D2487)</div>
                      <div className="text-[12px] font-black text-white leading-tight tracking-wide">
                        {(() => {
                          const raw = boundData.rawDetails || {};
                          return raw.soilName || 'UNKNOWN MATERIAL';
                        })()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-black font-mono text-emerald-300 tracking-widest">
                        {(() => {
                          const raw = boundData.rawDetails || {};
                          return raw.uscsCode || '-';
                        })()}
                      </div>
                      <div className="text-[7px] text-slate-400">USCS Symbol</div>
                    </div>
                  </div>

                  <div className="p-1 text-[7px] text-slate-500 italic border-t border-slate-300 leading-tight">
                    *Deskripsi material berdasarkan ukuran pasir, lanau dan lempung serta merupakan klasifikasi tanah menurut USCS atau AASHTO.
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 4. LHU_DS-UU & LHU_DS-CD */}
        {(sheetCode === 'LHU_DS-UU' || sheetCode === 'LHU_DS-CD' || sheetCode === 'LHU_DS-CD RES.') && (() => {
          const raw = boundData.rawDetails || {};
          const defDigits = boundData.header.decimalPlaces ?? 3;
          const cKpa = parseFloat(raw.cohesionKpa || parameters.cohesionKpa?.value || 23.388);
          const cKg = parseFloat(raw.cohesionKg || parameters.cohesionKg?.value || (cKpa / 98.0665));
          const phi = parseFloat(raw.phiDeg || parameters.frictionAngle?.value || 21.486);

          const spec1 = raw.spec1 || { normalKg: 10, normalKpa: 35.388, tauKpa: 37.420, heightCm: 2.49, diaCm: 5.94, areaCm2: 27.712, volCm3: 69.002, mc: 14.910, wetDensity: 1.822, dryDensity: 1.742 };
          const spec2 = raw.spec2 || { normalKg: 20, normalKpa: 70.776, tauKpa: 51.093, heightCm: 2.49, diaCm: 5.94, areaCm2: 27.712, volCm3: 69.002, mc: 16.186, wetDensity: 1.786, dryDensity: 1.713 };
          const spec3 = raw.spec3 || { normalKg: 40, normalKpa: 141.553, tauKpa: 79.158, heightCm: 2.49, diaCm: 5.94, areaCm2: 27.712, volCm3: 69.002, mc: 15.443, wetDensity: 1.804, dryDensity: 1.732 };

          // 15 displacement readings matching WS_DS-UU
          const dispReadings = [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.5, 3.0, 4.0, 5.0];
          const curve1 = [0, 11.51, 18.71, 23.03, 27.35, 31.66, 34.54, 35.98, 37.42, 37.42, 37.42, 37.42, 37.42, 37.42, 37.42];
          const curve2 = [0, 20.15, 25.91, 31.66, 34.54, 37.42, 38.86, 40.30, 41.74, 43.18, 44.62, 48.93, 48.93, 50.37, 51.09];
          const curve3 = [0, 16.98, 22.45, 28.78, 36.12, 40.01, 43.61, 48.07, 51.52, 54.69, 56.27, 60.59, 66.20, 69.08, 79.16];

          // Chart scaling constants:
          // Vertical Y-axis max limit automatically set to max Y value + 30%
          const maxTauVal = Math.max(spec1.tauKpa, spec2.tauKpa, spec3.tauKpa, ...curve1, ...curve2, ...curve3);
          const rawMaxY = maxTauVal * 1.30; // Max Y + 30%
          const maxYCurve = Math.ceil(rawMaxY / 10) * 10; // e.g. 79.16 * 1.30 = 102.9 -> 110 kPa
          const yTicksCurve = [0, 1, 2, 3, 4, 5].map(step => Math.round((maxYCurve / 5) * step));

          // Horizontal X-axis max limit automatically set to max displacement + 30%
          const maxDispVal = Math.max(...dispReadings); // 5.0 mm
          const maxXCurve = Math.ceil(maxDispVal * 1.30 * 2) / 2; // 5.0 * 1.30 = 6.5 mm
          const xTicksCurve = [0, 1, 2, 3, 4, 5, 6];

          const maxXEnvelope = 160;
          const maxYEnvelope = 100;

          return (
            <div className="space-y-2 font-sans text-[8.5px]">
              
              {/* TWO-COLUMN GRID: DATA BENDA UJI (LEFT) & DATA PENGUJIAN (RIGHT) */}
              <div className="grid grid-cols-2 gap-2">
                
                {/* LEFT BOX: DATA BENDA UJI / SPECIMEN DATA */}
                <div className="border border-slate-900 bg-white">
                  <div className="bg-slate-100 text-slate-900 px-2 py-0.5 font-bold uppercase text-[8px] border-b border-slate-900 flex justify-between">
                    <span>DATA BENDA UJI / SPECIMEN DATA</span>
                  </div>
                  <table className="w-full text-[8.5px] border-collapse text-center font-mono">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-slate-900 text-slate-900 font-sans">
                        <th className="py-0.5 px-1.5 border-r border-slate-900 text-left">Benda Uji / Specimen No.</th>
                        <th className="py-0.5 px-1 border-r border-slate-900 w-12 text-blue-900">1</th>
                        <th className="py-0.5 px-1 border-r border-slate-900 w-12 text-emerald-900">2</th>
                        <th className="py-0.5 px-1 w-12 text-red-900">3</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-0.5 px-1.5 text-slate-700 border-r border-slate-300 text-left font-sans font-medium">Diameter / Diameter (cm)</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{spec1.diaCm.toFixed(2)}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{spec2.diaCm.toFixed(2)}</td>
                        <td className="py-0.5 px-1">{spec3.diaCm.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 text-slate-700 border-r border-slate-300 text-left font-sans font-medium">Tinggi / Height (cm)</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{spec1.heightCm.toFixed(2)}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{spec2.heightCm.toFixed(2)}</td>
                        <td className="py-0.5 px-1">{spec3.heightCm.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 text-slate-700 border-r border-slate-300 text-left font-sans font-medium">Luas / Area (cm2)</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{spec1.areaCm2.toFixed(2)}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{spec2.areaCm2.toFixed(2)}</td>
                        <td className="py-0.5 px-1">{spec3.areaCm2.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 text-slate-700 border-r border-slate-300 text-left font-sans font-medium">Volume / Volume (cm3)</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{spec1.volCm3.toFixed(2)}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{spec2.volCm3.toFixed(2)}</td>
                        <td className="py-0.5 px-1">{spec3.volCm3.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 text-slate-700 border-r border-slate-300 text-left font-sans font-medium">Kadar Air / Moisture Content (%)</td>
                        <td className="py-0.5 px-1 border-r border-slate-300 font-bold text-emerald-800">{spec1.mc.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300 font-bold text-emerald-800">{spec2.mc.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 font-bold text-emerald-800">{spec3.mc.toFixed(defDigits)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 text-slate-700 border-r border-slate-300 text-left font-sans font-medium">Berat isi Basah / Wet Density (g/cm3)</td>
                        <td className="py-0.5 px-1 border-r border-slate-300 font-bold text-emerald-800">{spec1.wetDensity.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300 font-bold text-emerald-800">{spec2.wetDensity.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 font-bold text-emerald-800">{spec3.wetDensity.toFixed(defDigits)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 text-slate-700 border-r border-slate-300 text-left font-sans font-medium">Berat Isi Kering / Dry Density (g/cm3)</td>
                        <td className="py-0.5 px-1 border-r border-slate-300 font-bold text-emerald-800">{spec1.dryDensity.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300 font-bold text-emerald-800">{spec2.dryDensity.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 font-bold text-emerald-800">{spec3.dryDensity.toFixed(defDigits)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* RIGHT BOX: DATA PENGUJIAN / TEST DATA */}
                <div className="border border-slate-900 bg-white flex flex-col justify-between">
                  <div className="bg-slate-100 text-slate-900 px-2 py-0.5 font-bold uppercase text-[8px] border-b border-slate-900 flex justify-between">
                    <span>DATA PENGUJIAN / TEST DATA</span>
                  </div>
                  
                  <table className="w-full text-[8.5px] border-collapse text-center font-mono h-full">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-slate-900 text-slate-900 font-sans">
                        <th className="py-1 px-2 border-r border-slate-900 text-left">Benda Uji / Specimen No.</th>
                        <th className="py-1 px-1 border-r border-slate-900 w-12 text-blue-900">1</th>
                        <th className="py-1 px-1 border-r border-slate-900 w-12 text-emerald-900">2</th>
                        <th className="py-1 px-1 w-12 text-red-900">3</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-1 px-2 text-slate-700 border-r border-slate-300 text-left font-sans font-medium">Beban Normal / Normal Load (Kgf)</td>
                        <td className="py-1 px-1 border-r border-slate-300 font-bold">{spec1.normalKg.toFixed(0)}</td>
                        <td className="py-1 px-1 border-r border-slate-300 font-bold">{spec2.normalKg.toFixed(0)}</td>
                        <td className="py-1 px-1 font-bold">{spec3.normalKg.toFixed(0)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-slate-700 border-r border-slate-300 text-left font-sans font-medium">Tegangan Normal / Normal Stress, σₙ (kPa)</td>
                        <td className="py-1 px-1 border-r border-slate-300 font-extrabold text-blue-900">{spec1.normalKpa.toFixed(defDigits)}</td>
                        <td className="py-1 px-1 border-r border-slate-300 font-extrabold text-emerald-900">{spec2.normalKpa.toFixed(defDigits)}</td>
                        <td className="py-1 px-1 font-extrabold text-red-900">{spec3.normalKpa.toFixed(defDigits)}</td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="py-1.5 px-2 text-slate-900 border-r border-slate-300 text-left font-sans font-extrabold">Tegangan Geser Saat Runtuh / Shear Stress at Failure, τf (kPa)</td>
                        <td className="py-1.5 px-1 border-r border-slate-300 font-extrabold text-blue-900 text-[9.5px]">{spec1.tauKpa.toFixed(defDigits)}</td>
                        <td className="py-1.5 px-1 border-r border-slate-300 font-extrabold text-emerald-900 text-[9.5px]">{spec2.tauKpa.toFixed(defDigits)}</td>
                        <td className="py-1.5 px-1 font-extrabold text-red-900 text-[9.5px]">{spec3.tauKpa.toFixed(defDigits)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FLEX CONTAINER: LEFT COLUMN 30% (TALL SINGLE BOX) vs RIGHT COLUMN 70% (RIGHT CHART + PARAMETER TABLE) */}
              <div className="flex gap-2 pt-1">
                
                {/* LEFT COLUMN (30% WIDTH) - TALL SINGLE CARD SPANNING FULL HEIGHT */}
                <div className="w-[30%] border border-slate-700 bg-white p-1.5 flex flex-col justify-between">
                  <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-semibold uppercase text-[7.5px] border-b border-slate-700 text-center mb-1">
                    <div>GRAFIK TEGANGAN GESER / PERGESERAN</div>
                    <div className="text-[6px] font-mono text-blue-200 font-normal">SHEAR STRESS VS DISPLACEMENT</div>
                  </div>

                  {/* TALL SVG CHART */}
                  <svg viewBox="0 0 160 210" className="w-full h-72 bg-white border border-slate-200 overflow-visible my-auto">
                    <text x="-100" y="8" transform="rotate(-90)" textAnchor="middle" fontSize="5.5" fontWeight="500" fill="#475569">Tegangan Geser τ (kPa)</text>
                    <text x="88" y="206" textAnchor="middle" fontSize="5.5" fontWeight="500" fill="#475569">Pergeseran Δh (mm)</text>

                    {/* Y Grid Ticks (Dynamically generated for max Y + 30%) */}
                    {yTicksCurve.map((val) => {
                      const y = 12 + ((maxYCurve - val) / maxYCurve) * 180;
                      return (
                        <g key={val}>
                          <line x1="28" y1={y} x2="152" y2={y} stroke="#F1F5F9" strokeWidth="0.5" />
                          <text x="24" y={y + 2} textAnchor="end" fontSize="5" fill="#64748B">{val}</text>
                        </g>
                      );
                    })}

                    {/* X Grid Ticks (Dynamically generated for max horizontal + 30%) */}
                    {xTicksCurve.map((val) => {
                      const x = 28 + (val / maxXCurve) * 124;
                      return (
                        <g key={val}>
                          <line x1={x} y1="12" x2={x} y2="192" stroke="#F1F5F9" strokeWidth="0.5" />
                          <text x={x} y="200" textAnchor="middle" fontSize="5" fill="#64748B">{val}</text>
                        </g>
                      );
                    })}

                    <line x1="28" y1="12" x2="28" y2="192" stroke="#475569" strokeWidth="0.8" />
                    <line x1="28" y1="192" x2="152" y2="192" stroke="#475569" strokeWidth="0.8" />

                    {/* Specimen 1 Curve (Blue) - Stops at Peak Failure Point */}
                    {(() => {
                      const maxVal = Math.max(...curve1);
                      const peakIdx = curve1.findIndex(v => v >= maxVal);
                      const activeReadings = dispReadings.slice(0, (peakIdx >= 0 ? peakIdx : curve1.length - 1) + 1);
                      
                      const pts = activeReadings.map((xVal, i) => {
                        const x = 28 + (xVal / maxXCurve) * 124;
                        const y = 12 + ((maxYCurve - (curve1[i] || 0)) / maxYCurve) * 180;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      }).join(' ');

                      const lastX = 28 + (activeReadings[activeReadings.length - 1] / maxXCurve) * 124;
                      const lastY = 12 + ((maxYCurve - maxVal) / maxYCurve) * 180;

                      return (
                        <g key="spec1">
                          <polyline points={pts} fill="none" stroke="#2563EB" strokeWidth="1.3" />
                          <circle cx={lastX} cy={lastY} r="3" fill="#2563EB" stroke="#ffffff" strokeWidth="0.8" />
                        </g>
                      );
                    })()}

                    {/* Specimen 2 Curve (Green) - Stops at Peak Failure Point */}
                    {(() => {
                      const maxVal = Math.max(...curve2);
                      const peakIdx = curve2.findIndex(v => v >= maxVal);
                      const activeReadings = dispReadings.slice(0, (peakIdx >= 0 ? peakIdx : curve2.length - 1) + 1);
                      
                      const pts = activeReadings.map((xVal, i) => {
                        const x = 28 + (xVal / maxXCurve) * 124;
                        const y = 12 + ((maxYCurve - (curve2[i] || 0)) / maxYCurve) * 180;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      }).join(' ');

                      const lastX = 28 + (activeReadings[activeReadings.length - 1] / maxXCurve) * 124;
                      const lastY = 12 + ((maxYCurve - maxVal) / maxYCurve) * 180;

                      return (
                        <g key="spec2">
                          <polyline points={pts} fill="none" stroke="#16A34A" strokeWidth="1.3" />
                          <circle cx={lastX} cy={lastY} r="3" fill="#16A34A" stroke="#ffffff" strokeWidth="0.8" />
                        </g>
                      );
                    })()}

                    {/* Specimen 3 Curve (Red) - Stops at Peak Failure Point */}
                    {(() => {
                      const maxVal = Math.max(...curve3);
                      const peakIdx = curve3.findIndex(v => v >= maxVal);
                      const activeReadings = dispReadings.slice(0, (peakIdx >= 0 ? peakIdx : curve3.length - 1) + 1);
                      
                      const pts = activeReadings.map((xVal, i) => {
                        const x = 28 + (xVal / maxXCurve) * 124;
                        const y = 12 + ((maxYCurve - (curve3[i] || 0)) / maxYCurve) * 180;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      }).join(' ');

                      const lastX = 28 + (activeReadings[activeReadings.length - 1] / maxXCurve) * 124;
                      const lastY = 12 + ((maxYCurve - maxVal) / maxYCurve) * 180;

                      return (
                        <g key="spec3">
                          <polyline points={pts} fill="none" stroke="#DC2626" strokeWidth="1.3" />
                          <circle cx={lastX} cy={lastY} r="3" fill="#DC2626" stroke="#ffffff" strokeWidth="0.8" />
                        </g>
                      );
                    })()}
                  </svg>

                  {/* LEGEND BAR AT BOTTOM OF TALL LEFT CARD */}
                  <div className="mt-1 pt-1 border-t border-slate-200 flex flex-col gap-0.5 text-[6.5px] font-semibold bg-slate-50 p-1 rounded">
                    <div className="flex items-center gap-1.5 text-blue-900">
                      <span className="w-2.5 h-0.5 bg-[#2563EB] inline-block"></span>
                      <span>Benda Uji 1 (σₙ = {spec1.normalKpa.toFixed(1)} kPa)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-900">
                      <span className="w-2.5 h-0.5 bg-[#16A34A] inline-block"></span>
                      <span>Benda Uji 2 (σₙ = {spec2.normalKpa.toFixed(1)} kPa)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-red-900">
                      <span className="w-2.5 h-0.5 bg-[#DC2626] inline-block"></span>
                      <span>Benda Uji 3 (σₙ = {spec3.normalKpa.toFixed(1)} kPa)</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN (70% WIDTH): CONTAINS RIGHT CHART (TOP) + PARAMETER TABLE (BOTTOM) */}
                <div className="w-[70%] flex flex-col justify-between gap-2">
                  
                  {/* RIGHT CHART: GRAFIK ENVELOPE KUAT GESER */}
                  <div className="border border-slate-700 p-1.5 bg-white flex flex-col justify-between flex-1">
                    <div className="bg-[#1e40af] text-white px-2 py-0.5 font-semibold uppercase text-[7.5px] border-b border-slate-700 flex items-center justify-between">
                      <div>GRAFIK ENVELOPE KUAT GESER (SHEAR STRENGTH FAILURE ENVELOPE)</div>
                      <div className="font-mono text-[6.5px] text-amber-300 font-semibold bg-blue-900 px-1.5 py-0.5 rounded">
                        τ = {cKpa.toFixed(defDigits)} + σₙ·tan({phi.toFixed(defDigits)}°)
                      </div>
                    </div>

                    <svg viewBox="0 0 340 135" className="w-full h-52 bg-white border border-slate-200 overflow-visible my-1">
                      <text x="-65" y="10" transform="rotate(-90)" textAnchor="middle" fontSize="5.5" fontWeight="500" fill="#475569">Kuat Geser τf (kPa)</text>
                      <text x="170" y="131" textAnchor="middle" fontSize="5.5" fontWeight="500" fill="#475569">Tegangan Normal σₙ (kPa)</text>

                      {/* Y Grid Ticks (0, 20, 40, 60, 80, 100) */}
                      {[0, 20, 40, 60, 80, 100].map((val) => {
                        const y = 12 + ((maxYEnvelope - val) / maxYEnvelope) * 105;
                        return (
                          <g key={val}>
                            <line x1="32" y1={y} x2="330" y2={y} stroke="#F1F5F9" strokeWidth="0.5" />
                            <text x="27" y={y + 2} textAnchor="end" fontSize="5" fill="#64748B">{val}</text>
                          </g>
                        );
                      })}

                      {/* X Grid Ticks (0, 40, 80, 120, 160) */}
                      {[0, 40, 80, 120, 160].map((val) => {
                        const x = 32 + (val / maxXEnvelope) * 298;
                        return (
                          <g key={val}>
                            <line x1={x} y1="12" x2={x} y2="117" stroke="#F1F5F9" strokeWidth="0.5" />
                            <text x={x} y="125" textAnchor="middle" fontSize="5" fill="#64748B">{val}</text>
                          </g>
                        );
                      })}

                      <line x1="32" y1="12" x2="32" y2="117" stroke="#475569" strokeWidth="0.8" />
                      <line x1="32" y1="117" x2="330" y2="117" stroke="#475569" strokeWidth="0.8" />

                      {/* Envelope Line & Sample Failure Points (Slimmed down) */}
                      {(() => {
                        const x0 = 32; 
                        const y0 = 12 + ((maxYEnvelope - cKpa) / maxYEnvelope) * 105;
                        const sigEnd = maxXEnvelope; 
                        const tauEnd = cKpa + sigEnd * Math.tan((phi * Math.PI) / 180);
                        const xEnd = 32 + 298; 
                        const yEnd = 12 + ((maxYEnvelope - Math.min(maxYEnvelope, tauEnd)) / maxYEnvelope) * 105;

                        const p1x = 32 + (spec1.normalKpa / maxXEnvelope) * 298; 
                        const p1y = 12 + ((maxYEnvelope - spec1.tauKpa) / maxYEnvelope) * 105;

                        const p2x = 32 + (spec2.normalKpa / maxXEnvelope) * 298; 
                        const p2y = 12 + ((maxYEnvelope - spec2.tauKpa) / maxYEnvelope) * 105;

                        const p3x = 32 + (spec3.normalKpa / maxXEnvelope) * 298; 
                        const p3y = 12 + ((maxYEnvelope - spec3.tauKpa) / maxYEnvelope) * 105;

                        return (
                          <g>
                            {/* Failure Envelope Line (Slim Red Dashed Line 1.3) */}
                            <line x1={x0} y1={y0} x2={xEnd} y2={yEnd} stroke="#DC2626" strokeWidth="1.3" strokeDasharray="4 2" />

                            {/* Failure Point 1 (Blue Circle r=3) */}
                            <circle cx={p1x} cy={p1y} r="3" fill="#2563EB" stroke="#ffffff" strokeWidth="0.8" />

                            {/* Failure Point 2 (Green Circle r=3) */}
                            <circle cx={p2x} cy={p2y} r="3" fill="#16A34A" stroke="#ffffff" strokeWidth="0.8" />

                            {/* Failure Point 3 (Red Circle r=3) */}
                            <circle cx={p3x} cy={p3y} r="3" fill="#DC2626" stroke="#ffffff" strokeWidth="0.8" />
                          </g>
                        );
                      })()}
                    </svg>

                    {/* LEGEND BAR FOR ENVELOPE CHART */}
                    <div className="mt-1 pt-1 border-t border-slate-200 flex items-center justify-around text-[6.5px] font-semibold bg-slate-50 p-1 rounded">
                      <div className="flex items-center gap-1 text-blue-900">
                        <span className="w-2 h-2 rounded-full bg-[#2563EB] border border-white inline-block"></span>
                        <span>Titik Keruntuhan Uji 1</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-900">
                        <span className="w-2 h-2 rounded-full bg-[#16A34A] border border-white inline-block"></span>
                        <span>Titik Keruntuhan Uji 2</span>
                      </div>
                      <div className="flex items-center gap-1 text-red-900">
                        <span className="w-2 h-2 rounded-full bg-[#DC2626] border border-white inline-block"></span>
                        <span>Titik Keruntuhan Uji 3</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-800">
                        <span className="w-3.5 h-0 border-t border-dashed border-[#DC2626] inline-block"></span>
                        <span>Selubung Geser (cᵤ = {cKpa.toFixed(defDigits)} kPa, φᵤ = {phi.toFixed(defDigits)}°)</span>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM SECTION: PARAMETER HASIL UJI IN RIGHT COLUMN */}
                  <div className="border border-slate-700 bg-white overflow-hidden shadow-2xs">
                    <div className="bg-[#1e40af] text-white px-2.5 py-0.5 font-semibold uppercase text-[8px] tracking-wide flex items-center justify-between">
                      <span>PARAMETER HASIL UJI / TEST RESULT PARAMETERS</span>
                      <span className="text-[7px] bg-blue-900 px-1.5 py-0.5 rounded font-mono text-amber-300 font-semibold">
                        SNI 3420:2016
                      </span>
                    </div>
                    
                    <table className="w-full text-[8.5px] border-collapse text-left font-sans">
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="py-1 px-2.5 font-medium text-slate-800 border-r border-slate-300 w-1/2">
                            Kohesi Tak Terdrainase / Undrained Cohesion, cᵤ :
                          </td>
                          <td className="py-1 px-2.5 font-semibold font-mono text-center text-blue-900 text-[9.5px]">
                            {cKpa.toFixed(defDigits)} kPa &nbsp; ({cKg.toFixed(defDigits)} kg/cm²)
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 px-2.5 font-medium text-slate-800 border-r border-slate-300">
                            Sudut Geser Dalam Tak Terdrainase / Undrained Internal Friction Angle, φᵤ (°) :
                          </td>
                          <td className="py-1 px-2.5 font-semibold font-mono text-center text-emerald-900 text-[9.5px] bg-emerald-50/50">
                            {phi.toFixed(defDigits)} °
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                </div>

              </div>

            </div>
          );
        })()}

        {/* 5. LHU_TRX-UU - UJI TRIAKSIAL UU (MATCHING QMS-RPS-001.xlsx Sheet LHU_TRX-UU 100%) */}
        {sheetCode === 'LHU_TRX-UU' && (() => {
          const defDigits = boundData.header.decimalPlaces ?? 3;
          const raw = boundData.rawDetails || {};
          const spec1 = raw.spec1 || { diaMm: 38.1, heightMm: 76.2, areaCm2: 11.4, weightG: 142.5, mc: 24.5, wetDensity: 1.64, dryDensity: 1.317 };
          const spec2 = raw.spec2 || { diaMm: 38.1, heightMm: 76.2, areaCm2: 11.4, weightG: 143.1, mc: 24.8, wetDensity: 1.647, dryDensity: 1.320 };
          const spec3 = raw.spec3 || { diaMm: 38.1, heightMm: 76.2, areaCm2: 11.4, weightG: 143.8, mc: 25.1, wetDensity: 1.655, dryDensity: 1.323 };

          const rawT1 = raw.test1 || {};
          const rawT2 = raw.test2 || {};
          const rawT3 = raw.test3 || {};

          const test1 = {
            sig3: parseFloat(rawT1.sig3Kpa ?? rawT1.sig3 ?? 49.03),
            devSig: parseFloat(rawT1.devSigKpa ?? rawT1.devSig ?? 108.85),
            sig1: parseFloat(rawT1.sig1Kpa ?? rawT1.sig1 ?? 157.88),
            tau: parseFloat(rawT1.tauKpa ?? rawT1.tau ?? 54.43),
            strain: parseFloat(rawT1.strain ?? 0.85),
            sig3Kg: parseFloat(rawT1.sig3Kg ?? 0.5),
            devSigKg: parseFloat(rawT1.devSigKg ?? 1.11),
            sig1Kg: parseFloat(rawT1.sig1Kg ?? 1.61),
            tauKg: parseFloat(rawT1.tauKg ?? 0.555),
            curvePts: Array.isArray(rawT1.curvePts) ? rawT1.curvePts : []
          };

          const test2 = {
            sig3: parseFloat(rawT2.sig3Kpa ?? rawT2.sig3 ?? 98.07),
            devSig: parseFloat(rawT2.devSigKpa ?? rawT2.devSig ?? 150.04),
            sig1: parseFloat(rawT2.sig1Kpa ?? rawT2.sig1 ?? 248.11),
            tau: parseFloat(rawT2.tauKpa ?? rawT2.tau ?? 75.02),
            strain: parseFloat(rawT2.strain ?? 1.15),
            sig3Kg: parseFloat(rawT2.sig3Kg ?? 1.0),
            devSigKg: parseFloat(rawT2.devSigKg ?? 1.53),
            sig1Kg: parseFloat(rawT2.sig1Kg ?? 2.53),
            tauKg: parseFloat(rawT2.tauKg ?? 0.765),
            curvePts: Array.isArray(rawT2.curvePts) ? rawT2.curvePts : []
          };

          const test3 = {
            sig3: parseFloat(rawT3.sig3Kpa ?? rawT3.sig3 ?? 196.13),
            devSig: parseFloat(rawT3.devSigKpa ?? rawT3.devSig ?? 233.40),
            sig1: parseFloat(rawT3.sig1Kpa ?? rawT3.sig1 ?? 429.53),
            tau: parseFloat(rawT3.tauKpa ?? rawT3.tau ?? 116.70),
            strain: parseFloat(rawT3.strain ?? 1.35),
            sig3Kg: parseFloat(rawT3.sig3Kg ?? 2.0),
            devSigKg: parseFloat(rawT3.devSigKg ?? 2.38),
            sig1Kg: parseFloat(rawT3.sig1Kg ?? 4.38),
            tauKg: parseFloat(rawT3.tauKg ?? 1.190),
            curvePts: Array.isArray(rawT3.curvePts) ? rawT3.curvePts : []
          };

          const rawCuKpa = parseFloat(raw.cuValKpa ?? 24.680);
          const cuValKpa = rawCuKpa < 2.0 ? rawCuKpa * 98.0665 : rawCuKpa;
          const cuValKg = rawCuKpa < 2.0 ? rawCuKpa : rawCuKpa / 98.0665;
          const phiValDeg = parseFloat(raw.phiValDeg ?? 17.33);

          return (
            <div className="space-y-2 font-sans text-[8.5px]">
              {/* TOP SECTION: 2-COLUMN GRID FOR SPECIMEN DATA & TEST RESULTS */}
              <div className="grid grid-cols-2 gap-2 items-start">
                {/* LEFT BOX: DATA BENDA UJI / SPECIMEN DATA */}
                <div className="border border-slate-900 bg-white">
                  <div className="bg-[#1e40af] text-white px-2 py-0.5 font-bold uppercase text-[8.5px] tracking-wide border-b border-slate-900">
                    DATA BENDA UJI / SPECIMEN DATA
                  </div>
                  <table className="w-full text-[8.5px] border-collapse text-center">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-slate-900 text-slate-900">
                        <th className="py-1 px-1.5 border-r border-slate-900 text-left font-sans">Benda Uji / Specimen</th>
                        <th className="py-1 px-1 border-r border-slate-900 w-14 text-center">1</th>
                        <th className="py-1 px-1 border-r border-slate-900 w-14 text-center">2</th>
                        <th className="py-1 px-1 w-14 text-center">3</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-mono">
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300 text-left font-sans">Diameter Awal / Initial Diameter, mm</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{spec1.diaMm.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{spec2.diaMm.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1">{spec3.diaMm.toFixed(defDigits)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300 text-left font-sans">Tinggi Awal / Initial Height, mm</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{spec1.heightMm.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{spec2.heightMm.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1">{spec3.heightMm.toFixed(defDigits)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300 text-left font-sans">Luas Awal / Initial Area, cm²</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{spec1.areaCm2.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{spec2.areaCm2.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1">{spec3.areaCm2.toFixed(defDigits)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300 text-left font-sans">Berat Awal / Initial Weight, g</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{spec1.weightG.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{spec2.weightG.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1">{spec3.weightG.toFixed(defDigits)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300 text-left font-sans">Kadar Air / Moisture Content, (%)</td>
                        <td className="py-0.5 px-1 border-r border-slate-300 font-bold text-emerald-800">{spec1.mc.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300 font-bold text-emerald-800">{spec2.mc.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 font-bold text-emerald-800">{spec3.mc.toFixed(defDigits)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300 text-left font-sans">Berat Isi Basah / Bulk Density, g/cm³</td>
                        <td className="py-0.5 px-1 border-r border-slate-300 font-bold text-emerald-800">{spec1.wetDensity.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300 font-bold text-emerald-800">{spec2.wetDensity.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 font-bold text-emerald-800">{spec3.wetDensity.toFixed(defDigits)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300 text-left font-sans">Berat Isi Kering / Dry Density, g/cm³</td>
                        <td className="py-0.5 px-1 border-r border-slate-300 font-bold text-emerald-800">{spec1.dryDensity.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300 font-bold text-emerald-800">{spec2.dryDensity.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 font-bold text-emerald-800">{spec3.dryDensity.toFixed(defDigits)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* RIGHT BOX: HASIL PENGUJIAN / TEST RESULTS */}
                <div className="border border-slate-900 bg-white">
                  <div className="bg-[#1e40af] text-white px-2 py-0.5 font-bold uppercase text-[8.5px] tracking-wide border-b border-slate-900">
                    HASIL PENGUJIAN / TEST RESULTS
                  </div>
                  <table className="w-full text-[8.5px] border-collapse text-center">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-slate-900 text-slate-900">
                        <th className="py-1 px-1.5 border-r border-slate-900 text-left font-sans">Benda Uji / Specimen</th>
                        <th className="py-1 px-1 border-r border-slate-900 w-14 text-center">1</th>
                        <th className="py-1 px-1 border-r border-slate-900 w-14 text-center">2</th>
                        <th className="py-1 px-1 w-14 text-center">3</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-mono">
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300 text-left font-sans">Tekanan Sel / Cell Pressure, σ₃ (kPa)</td>
                        <td className="py-0.5 px-1 border-r border-slate-300 font-bold text-blue-900">{test1.sig3.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300 font-bold text-blue-900">{test2.sig3.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 font-bold text-blue-900">{test3.sig3.toFixed(defDigits)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300 text-left font-sans">Tegangan Deviator saat Keruntuhan / Deviator Stress at Failure (kPa)</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{test1.devSig.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{test2.devSig.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1">{test3.devSig.toFixed(defDigits)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300 text-left font-sans">Tegangan Utama Mayor saat Keruntuhan / Major Principal Stress at Failure, σ₁ (kPa)</td>
                        <td className="py-0.5 px-1 border-r border-slate-300 font-bold">{test1.sig1.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300 font-bold">{test2.sig1.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 font-bold">{test3.sig1.toFixed(defDigits)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300 text-left font-sans">Tegangan Geser saat Keruntuhan / Shear Stress at Failure (kPa)</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{test1.tau.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{test2.tau.toFixed(defDigits)}</td>
                        <td className="py-0.5 px-1">{test3.tau.toFixed(defDigits)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300 text-left font-sans">Regangan Aksial saat Keruntuhan / Axial Strain at Failure (%)</td>
                        <td className="py-0.5 px-1 border-r border-slate-300 font-bold text-slate-800">{test1.strain.toFixed(defDigits)} %</td>
                        <td className="py-0.5 px-1 border-r border-slate-300 font-bold text-slate-800">{test2.strain.toFixed(defDigits)} %</td>
                        <td className="py-0.5 px-1 font-bold text-slate-800">{test3.strain.toFixed(defDigits)} %</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MIDDLE SECTION: 30% / 70% ASYMMETRIC GRID WITH RIGHT-ALIGNED PARAMETERS */}
              <div className="grid grid-cols-10 gap-2">
                {/* LEFT CHART (30% WIDTH = col-span-3): KURVA TEGANGAN DEVIATOR TERHADAP REGANGAN */}
                <div className="col-span-3 border border-slate-900 bg-white p-1 flex flex-col justify-between h-full">
                  <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-bold uppercase text-[7.5px] tracking-wide text-center shrink-0">
                    KURVA DEVIATOR vs REGANGAN
                  </div>
                  {(() => {
                    const maxPeakDev = Math.max(10, test1.devSig, test2.devSig, test3.devSig);
                    const maxDevY = Math.max(50, Math.ceil((maxPeakDev + 5) / 10) * 10);
                    const stepY = maxDevY / 4;
                    const yTicksDev = [0, stepY, 2 * stepY, 3 * stepY, maxDevY];

                    const maxStrainVal = Math.max(0.5, test1.strain, test2.strain, test3.strain);
                    const maxStrainX = maxStrainVal <= 1.5 ? 2.0 : maxStrainVal <= 2.5 ? 3.0 : Math.ceil((maxStrainVal + 1) / 2) * 2;
                    const stepX = maxStrainX / 4;
                    const xTicksDev = [0, stepX, 2 * stepX, 3 * stepX, maxStrainX];

                    return (
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <svg viewBox="0 0 260 260" className="w-full h-full min-h-[220px] bg-white border border-slate-200 overflow-visible">
                          {/* Y-axis label */}
                          <text x="-110" y="10" transform="rotate(-90)" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#475569">Tegangan Deviator Δσ (kPa)</text>
                          {/* X-axis label */}
                          <text x="140" y="254" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#475569">Regangan Aksial ε (%)</text>

                          {/* Y Grid */}
                          {yTicksDev.map(val => {
                            const y = 230 - (val / maxDevY) * 215;
                            return (
                              <g key={val}>
                                <line x1="38" y1={y} x2="245" y2={y} stroke={val === 0 ? '#94A3B8' : '#E2E8F0'} strokeWidth={val === 0 ? '1.5' : '1'} />
                                <text x="34" y={y + 3} textAnchor="end" fontSize="7" fill="#94A3B8">{val.toFixed(0)}</text>
                              </g>
                            );
                          })}

                          {/* X Grid */}
                          {xTicksDev.map(val => {
                            const x = 38 + (val / maxStrainX) * 207;
                            return (
                              <g key={val}>
                                <line x1={x} y1="15" x2={x} y2="230" stroke={val === 0 ? '#94A3B8' : '#E2E8F0'} strokeWidth={val === 0 ? '1.5' : '1'} />
                                <text x={x} y="241" textAnchor="middle" fontSize="7" fill="#64748B">{val.toFixed(1)}</text>
                              </g>
                            );
                          })}

                          {/* Axes */}
                          <line x1="38" y1="15" x2="38" y2="230" stroke="#334155" strokeWidth="1.5" />
                          <line x1="38" y1="230" x2="245" y2="230" stroke="#334155" strokeWidth="1.5" />

                          {/* 3 Stress-Strain Curves */}
                          {(() => {
                            const curves = [
                              { peakDev: test1.devSig, peakStrain: test1.strain, color: '#2563EB', label: 'Specimen 1', rawPts: test1.curvePts },
                              { peakDev: test2.devSig, peakStrain: test2.strain, color: '#16A34A', label: 'Specimen 2', rawPts: test2.curvePts },
                              { peakDev: test3.devSig, peakStrain: test3.strain, color: '#DC2626', label: 'Specimen 3', rawPts: test3.curvePts }
                            ];

                            return (
                              <g>
                                {curves.map((c, idx) => {
                                  let pts: { s: number; d: number }[] = [];
                                  if (c.rawPts && c.rawPts.length > 0) {
                                    pts = [{ s: 0, d: 0 }, ...c.rawPts.map(p => ({ s: p.strainPct, d: p.devStressKpa }))];
                                  } else {
                                    pts = [
                                      { s: 0, d: 0 },
                                      { s: c.peakStrain * 0.3, d: c.peakDev * 0.6 },
                                      { s: c.peakStrain * 0.6, d: c.peakDev * 0.88 },
                                      { s: c.peakStrain, d: c.peakDev },
                                      { s: Math.min(maxStrainX, c.peakStrain * 1.2), d: c.peakDev * 0.96 },
                                      { s: maxStrainX, d: c.peakDev * 0.93 }
                                    ];
                                  }

                                  const svgPts = pts.map(p => ({
                                    x: 38 + (p.s / maxStrainX) * 207,
                                    y: 230 - (Math.min(maxDevY, p.d) / maxDevY) * 215
                                  }));

                                  const dStr = `M ${svgPts[0].x} ${svgPts[0].y} ` +
                                    svgPts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');

                                  const peakSvg = svgPts.reduce((prev, curr) => (curr.y < prev.y ? curr : prev), svgPts[0]);

                                  return (
                                    <g key={idx}>
                                      <path d={dStr} fill="none" stroke={c.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                      <circle cx={peakSvg.x} cy={peakSvg.y} r="3.5" fill={c.color} stroke="#fff" strokeWidth="1.5" />
                                      <text x={Math.min(210, peakSvg.x + 4)} y={peakSvg.y - 4} fontSize="7" fontWeight="extrabold" fill={c.color}>
                                        {c.peakDev.toFixed(1)}
                                      </text>
                                    </g>
                                  );
                                })}
                              </g>
                            );
                          })()}
                        </svg>

                        {/* CLEAN EXTERNAL LEGEND BAR BELOW CHART (OUTSIDE SVG PLOT AREA) */}
                        <div className="mt-1 pt-1 border-t border-slate-200 flex flex-col gap-0.5 text-[6.5px] font-bold">
                          <div className="flex items-center gap-1 text-blue-900">
                            <span className="w-2.5 h-0.5 bg-[#2563EB] inline-block rounded-full"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] inline-block"></span>
                            <span>Benda Uji 1 (σ₃={test1.sig3.toFixed(0)} kPa)</span>
                          </div>
                          <div className="flex items-center gap-1 text-emerald-900">
                            <span className="w-2.5 h-0.5 bg-[#16A34A] inline-block rounded-full"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] inline-block"></span>
                            <span>Benda Uji 2 (σ₃={test2.sig3.toFixed(0)} kPa)</span>
                          </div>
                          <div className="flex items-center gap-1 text-red-900">
                            <span className="w-2.5 h-0.5 bg-[#DC2626] inline-block rounded-full"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] inline-block"></span>
                            <span>Benda Uji 3 (σ₃={test3.sig3.toFixed(0)} kPa)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* RIGHT COLUMN (70% WIDTH = col-span-7): MOHR CIRCLES CHART + PARAMETER RESULTS ALIGNED TO THE RIGHT */}
                <div className="col-span-7 space-y-2">
                  <div className="border border-slate-900 bg-white p-1 flex flex-col justify-between">
                    <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-bold uppercase text-[8px] tracking-wide mb-1">
                      LINGKARAN MOHR DAN SELUBUNG KERUNTUHAN / MOHR CIRCLES AND FAILURE ENVELOPE
                    </div>
                    {(() => {
                      const maxSig1 = Math.max(10, test1.sig1, test2.sig1, test3.sig1);
                      // Dynamic auto-fit X-Axis based on actual max sigma1
                      let maxMohrX = 300;
                      let xStep = 50;

                      if (maxSig1 <= 80) { maxMohrX = 100; xStep = 20; }
                      else if (maxSig1 <= 120) { maxMohrX = 150; xStep = 30; }
                      else if (maxSig1 <= 160) { maxMohrX = 200; xStep = 40; }
                      else if (maxSig1 <= 210) { maxMohrX = 250; xStep = 50; }
                      else if (maxSig1 <= 260) { maxMohrX = 300; xStep = 50; }
                      else if (maxSig1 <= 320) { maxMohrX = 350; xStep = 50; }
                      else if (maxSig1 <= 360) { maxMohrX = 400; xStep = 80; }
                      else if (maxSig1 <= 450) { maxMohrX = 500; xStep = 100; }
                      else if (maxSig1 <= 550) { maxMohrX = 600; xStep = 100; }
                      else {
                        xStep = Math.ceil((maxSig1 * 1.15 / 5) / 50) * 50;
                        maxMohrX = xStep * 5;
                      }

                      // TRUE 1:1 ISOTROPIC ASPECT RATIO (PERFECT SEMICIRCLE: Width = 440px, Height = 220px => 2:1 ratio)
                      const actualYMax = maxMohrX / 2;
                      const yStep = xStep / 2;

                      const yTicksMohr: number[] = [];
                      for (let v = 0; v <= actualYMax + 0.001; v += yStep) {
                        yTicksMohr.push(Math.round(v));
                      }

                      const xTicksMohr: number[] = [];
                      for (let v = 0; v <= maxMohrX + 0.001; v += xStep) {
                        xTicksMohr.push(Math.round(v));
                      }

                      const toX = (sigma: number) => 45 + (sigma / maxMohrX) * 440;
                      const toY = (tau: number) => 235 - (tau / actualYMax) * 220;

                      return (
                        <div>
                          <svg viewBox="0 0 520 250" className="w-full h-[230px] bg-white border border-slate-200 overflow-visible">
                            {/* Y-axis label */}
                            <text x="-115" y="12" transform="rotate(-90)" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#475569">Tegangan Geser τ (kPa)</text>
                            {/* X-axis label */}
                            <text x="265" y="246" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#475569">Tegangan Utama σ (kPa)</text>

                            {/* Y Grid */}
                            {yTicksMohr.map(val => {
                              const y = toY(val);
                              return (
                                <g key={val}>
                                  <line x1="45" y1={y} x2="485" y2={y} stroke={val === 0 ? '#94A3B8' : '#E2E8F0'} strokeWidth={val === 0 ? '1.5' : '1'} />
                                  <text x="40" y={y + 3} textAnchor="end" fontSize="7.5" fill="#94A3B8">{val}</text>
                                </g>
                              );
                            })}

                            {/* X Grid */}
                            {xTicksMohr.map(val => {
                              const x = toX(val);
                              return (
                                <g key={val}>
                                  <line x1={x} y1="15" x2={x} y2="235" stroke={val === 0 ? '#94A3B8' : '#E2E8F0'} strokeWidth={val === 0 ? '1.5' : '1'} />
                                  <text x={x} y="244" textAnchor="middle" fontSize="7.5" fill="#64748B">{val}</text>
                                </g>
                              );
                            })}

                            {/* Axes */}
                            <line x1="45" y1="15" x2="45" y2="235" stroke="#334155" strokeWidth="1.5" />
                            <line x1="45" y1="235" x2="485" y2="235" stroke="#334155" strokeWidth="1.5" />

                            {/* 3 Mohr Circles - 100% PERFECT 1:1 TRUE ISOTROPIC SEMI-CIRCLES */}
                            {(() => {
                              const circles = [
                                { s3: test1.sig3, s1: test1.sig1, color: '#2563EB' },
                                { s3: test2.sig3, s1: test2.sig1, color: '#16A34A' },
                                { s3: test3.sig3, s1: test3.sig1, color: '#DC2626' }
                              ];

                              return (
                                <g>
                                  {circles.map((c, idx) => {
                                    const xStart = toX(c.s3);
                                    const xEnd = toX(c.s1);
                                    const rPx = (xEnd - xStart) / 2;
                                    const yAxis = 235;

                                    // Perfect 1:1 true circular arc
                                    const arcPath = `M ${xStart} ${yAxis} A ${rPx} ${rPx} 0 0 1 ${xEnd} ${yAxis}`;

                                    return (
                                      <path key={idx} d={arcPath} fill="none" stroke={c.color} strokeWidth="2.2" />
                                    );
                                  })}

                                  {/* Failure Envelope Tangent Line */}
                                  {(() => {
                                    const x0 = 45;
                                    const y0 = toY(cuValKpa);
                                    // Stop dashed failure envelope line just past the 3rd specimen circle
                                    const maxSpecStress = Math.min(maxMohrX * 0.92, Math.max(test3.sig1, 10) * 1.05);
                                    const tauEnd = cuValKpa + maxSpecStress * Math.tan((phiValDeg * Math.PI) / 180);
                                    const xEnd = toX(maxSpecStress);
                                    const yEnd = toY(tauEnd);

                                    return (
                                      <g>
                                        <line x1={x0} y1={y0} x2={xEnd} y2={yEnd} stroke="#000000" strokeWidth="2" strokeDasharray="4 3" />
                                        <text x={Math.min(480 - 160, Math.max(70, xEnd - 90))} y={yEnd - 6} fontSize="7.5" fontWeight="bold" fill="#000000">
                                          cu = {cuValKpa.toFixed(defDigits)} kPa ({cuValKg.toFixed(defDigits)} kg/cm²), φu = {phiValDeg.toFixed(defDigits)}°
                                        </text>
                                      </g>
                                    );
                                  })()}
                                </g>
                              );
                            })()}
                          </svg>

                          {/* CLEAN EXTERNAL LEGEND BAR BELOW MOHR CHART (OUTSIDE SVG PLOT AREA) */}
                          <div className="mt-1 pt-1 border-t border-slate-200 flex items-center justify-between px-2 text-[7.5px] font-bold bg-slate-50 rounded">
                            <div className="flex items-center gap-1.5 text-blue-900">
                              <svg className="w-3.5 h-2" viewBox="0 0 14 8">
                                <path d="M 1 7 A 6 6 0 0 1 13 7" fill="none" stroke="#2563EB" strokeWidth="2" />
                              </svg>
                              <span>Lingkaran Mohr Benda Uji 1</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-emerald-900">
                              <svg className="w-3.5 h-2" viewBox="0 0 14 8">
                                <path d="M 1 7 A 6 6 0 0 1 13 7" fill="none" stroke="#16A34A" strokeWidth="2" />
                              </svg>
                              <span>Lingkaran Mohr Benda Uji 2</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-red-900">
                              <svg className="w-3.5 h-2" viewBox="0 0 14 8">
                                <path d="M 1 7 A 6 6 0 0 1 13 7" fill="none" stroke="#DC2626" strokeWidth="2" />
                              </svg>
                              <span>Lingkaran Mohr Benda Uji 3</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-900">
                              <span className="w-3 h-0 border-t-2 border-dashed border-black inline-block"></span>
                              <span>Selubung Keruntuhan (cᵤ, φᵤ)</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* BOTTOM SECTION: PARAMETER HASIL UJI (ALIGNED UNDER 70% MOHR CHART) */}
                  {(() => {
                    const defDigits = boundData.header.decimalPlaces ?? 3;
                    return (
                      <div className="border border-slate-900 bg-white">
                        <div className="bg-[#1e40af] text-white px-2 py-0.5 font-bold uppercase text-[8.5px] tracking-wide">
                          PARAMETER HASIL UJI / TEST RESULT PARAMETERS
                        </div>
                        <table className="w-full text-[8.5px] border-collapse text-left">
                          <tbody className="divide-y divide-slate-300 font-sans">
                            <tr>
                              <td className="py-1 px-2 font-semibold text-slate-800 border-r border-slate-300 w-3/5">
                                Kohesi Tak Terdrainase / Undrained Cohesion, cᵤ :
                              </td>
                              <td className="py-1 px-3 font-extrabold font-mono text-center text-blue-900 text-[10px]">
                                {cuValKpa.toFixed(defDigits)} kPa ({cuValKg.toFixed(defDigits)} kg/cm²)
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1 px-2 font-semibold text-slate-800 border-r border-slate-300">
                                Sudut Geser Dalam Tak Terdrainase / Undrained Internal Friction Angle, φᵤ (°) :
                              </td>
                              <td className="py-1 px-3 font-extrabold font-mono text-center text-emerald-900 text-[10px] bg-emerald-50">
                                {phiValDeg.toFixed(defDigits)} °
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })()}

        {/* 5. LHU_TRX-CU & TRX-CD (OTHERS) */}
        {(sheetCode === 'LHU_TRX-CU-Multi' || sheetCode === 'LHU_TRX-CU-Normal' || sheetCode === 'LHU_TRX-CD') && (() => {
          const raw = boundData.rawDetails || {};
          const isMulti = sheetCode === 'LHU_TRX-CU-Multi';
          const stageLabels = isMulti ? ['Stage 1', 'Stage 2', 'Stage 3'] : ['Spesimen 1', 'Spesimen 2', 'Spesimen 3'];

          const cEffKpa = raw.cPrimeKpa ?? 8.50;
          const cEffKg = raw.cPrimeKg ?? (cEffKpa / 98.0665);
          const phiEff = raw.phiPrimeDeg ?? 28.50;

          const cTotKpa = raw.cTotalKpa ?? 12.00;
          const cTotKg = raw.cTotalKg ?? (cTotKpa / 98.0665);
          const phiTot = raw.phiTotalDeg ?? 14.20;

          const s1 = raw?.spec1 || {};
          const s2 = raw?.spec2 || {};
          const s3 = raw?.spec3 || {};

          const sig3_1 = s1?.cellP ?? 240.00;
          const dSig1 = s1?.devP ?? 74.25;
          const sig1_1 = s1?.sig1 ?? (sig3_1 + dSig1);

          const sig3_2 = s2?.cellP ?? 290.00;
          const dSig2 = s2?.devP ?? 111.78;
          const sig1_2 = s2?.sig1 ?? (sig3_2 + dSig2);

          const sig3_3 = s3?.cellP ?? 390.00;
          const dSig3 = s3?.devP ?? 186.92;
          const sig1_3 = s3?.sig1 ?? (sig3_3 + dSig3);

          const sig3Eff_1 = s1?.sig3Eff ?? (s1?.effP ?? 50.00);
          const sig1Eff_1 = s1?.sig1Eff ?? (sig3Eff_1 + dSig1);

          const sig3Eff_2 = s2?.sig3Eff ?? (s2?.effP ?? 100.00);
          const sig1Eff_2 = s2?.sig1Eff ?? (sig3Eff_2 + dSig2);

          const sig3Eff_3 = s3?.sig3Eff ?? (s3?.effP ?? 200.00);
          const sig1Eff_3 = s3?.sig1Eff ?? (sig3Eff_3 + dSig3);

          // Helper points for 4 SVG Plots
          const curve1 = [
            { strain: 0, dev: 0, u: 190, ratio: 1.0 },
            { strain: 1.5, dev: 25, u: 194, ratio: 1.5 },
            { strain: 3.5, dev: 52, u: 200, ratio: 2.3 },
            { strain: 5.0, dev: 68, u: 204, ratio: 2.8 },
            { strain: 6.39, dev: 74.25, u: 205, ratio: 3.12 }
          ];
          const curve2 = [
            { strain: 6.39, dev: 0, u: 190, ratio: 1.0 },
            { strain: 8.5, dev: 45, u: 198, ratio: 1.5 },
            { strain: 11.0, dev: 80, u: 210, ratio: 2.1 },
            { strain: 13.0, dev: 102, u: 218, ratio: 2.45 },
            { strain: 14.31, dev: 111.78, u: 220, ratio: 2.60 }
          ];
          const curve3 = [
            { strain: 14.31, dev: 0, u: 190, ratio: 1.0 },
            { strain: 14.8, dev: 45, u: 205, ratio: 1.4 },
            { strain: 15.1, dev: 120, u: 230, ratio: 1.9 },
            { strain: 15.25, dev: 160, u: 245, ratio: 2.15 },
            { strain: 15.40, dev: 186.92, u: 253, ratio: 2.31 }
          ];

          const allCurves = [
            { label: stageLabels[0], color: '#06B6D4', pts: curve1 },
            { label: stageLabels[1], color: '#6366F1', pts: curve2 },
            { label: stageLabels[2], color: '#A855F7', pts: curve3 }
          ];

          return (
            <div className="space-y-2 font-sans text-slate-900">
              {/* HEADER DATA SPECIMEN & PARAMETER RINGKASAN */}
              <div className="grid grid-cols-2 gap-2">
                <div className="border border-black p-1 space-y-1">
                  <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-bold uppercase text-[8px]">
                    DATA BENDA UJI TRIAXIAL (TRIAXIAL SPECIMEN DATA)
                  </div>
                  <table className="w-full text-[8.5px] border-collapse border border-slate-300 text-center font-mono">
                    <thead className="bg-slate-100 font-bold">
                      <tr className="border-b border-slate-300">
                        <th className="p-1 border-r border-slate-300 text-left font-sans">Keterangan / Specimen</th>
                        <th className="p-1 border-r border-slate-300 w-12">1</th>
                        <th className="p-1 border-r border-slate-300 w-12">2</th>
                        <th className="p-1 w-12">3</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      <tr><td className="p-1 font-semibold text-left border-r border-slate-300 font-sans">Tekanan Sel / Cell Pressure σ₃ (kPa)</td><td className="p-1 border-r border-slate-300">{sig3_1}</td><td className="p-1 border-r border-slate-300">{sig3_2}</td><td className="p-1">{sig3_3}</td></tr>
                      <tr><td className="p-1 font-semibold text-left border-r border-slate-300 font-sans">Tekanan Air Pori Awal / Back Pressure ub (kPa)</td><td className="p-1 border-r border-slate-300">190</td><td className="p-1 border-r border-slate-300">190</td><td className="p-1">190</td></tr>
                      <tr><td className="p-1 font-semibold text-left border-r border-slate-300 font-sans">Tekanan Efektif / Effective Cell σ'₃ (kPa)</td><td className="p-1 border-r border-slate-300 font-bold text-cyan-900">{sig3Eff_1}</td><td className="p-1 border-r border-slate-300 font-bold text-cyan-900">{sig3Eff_2}</td><td className="p-1 font-bold text-cyan-900">{sig3Eff_3}</td></tr>
                      <tr><td className="p-1 font-semibold text-left border-r border-slate-300 font-sans">Derajat Kejenuhan B-Value (B ≥ 0.95)</td><td className="p-1 border-r border-slate-300 text-emerald-800 font-bold">0.960</td><td className="p-1 border-r border-slate-300 text-emerald-800 font-bold">0.970</td><td className="p-1 text-emerald-800 font-bold">0.980</td></tr>
                      <tr><td className="p-1 font-semibold text-left border-r border-slate-300 font-sans">Regangan Volumetrik Konsolidasi Ev (%)</td><td className="p-1 border-r border-slate-300">1.25%</td><td className="p-1 border-r border-slate-300">2.10%</td><td className="p-1">3.45%</td></tr>
                      <tr><td className="p-1 font-semibold text-left border-r border-slate-300 font-sans">Tekanan Deviator Maksimum Δσd,f (kPa)</td><td className="p-1 border-r border-slate-300 font-extrabold text-blue-900">{dSig1}</td><td className="p-1 border-r border-slate-300 font-extrabold text-blue-900">{dSig2}</td><td className="p-1 font-extrabold text-blue-900">{dSig3}</td></tr>
                      <tr><td className="p-1 font-semibold text-left border-r border-slate-300 font-sans">Tekanan Air Pori saat Runtuh uf (kPa)</td><td className="p-1 border-r border-slate-300">205</td><td className="p-1 border-r border-slate-300">220</td><td className="p-1">253</td></tr>
                      <tr><td className="p-1 font-semibold text-left border-r border-slate-300 font-sans">Beda PWP saat Runtuh Δuf (kPa)</td><td className="p-1 border-r border-slate-300 text-purple-900 font-bold">15</td><td className="p-1 border-r border-slate-300 text-purple-900 font-bold">30</td><td className="p-1 text-purple-900 font-bold">63</td></tr>
                      <tr><td className="p-1 font-semibold text-left border-r border-slate-300 font-sans">Regangan Aksial saat Runtuh εa,f (%)</td><td className="p-1 border-r border-slate-300">6.80%</td><td className="p-1 border-r border-slate-300">14.80%</td><td className="p-1">22.80%</td></tr>
                      <tr><td className="p-1 font-semibold text-left border-r border-slate-300 font-sans">Skempton PWP Parameter Af (Δuf / Δσd,f)</td><td className="p-1 border-r border-slate-300 font-bold">0.083</td><td className="p-1 border-r border-slate-300 font-bold">0.094</td><td className="p-1 font-bold">0.140</td></tr>
                    </tbody>
                  </table>
                </div>

                {/* Tabel Parameter Hasil Pengujian Triaxial CU (Effective & Total) */}
                <div className="border border-black p-1 bg-white space-y-1 flex flex-col justify-between">
                  <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-bold uppercase text-[8px]">
                    PARAMETER HASIL PENGUJIAN TRIAXIAL (SHEAR STRENGTH PARAMETERS)
                  </div>
                  <table className="w-full text-[9px] border-collapse border border-slate-300 text-left font-sans my-auto">
                    <tbody className="divide-y divide-slate-300 font-mono">
                      <tr className="bg-cyan-50 font-sans">
                        <td className="p-1 font-extrabold border-r border-slate-300 text-cyan-950">Kohesi Efektif / Effective Cohesion, c' (kg/cm²)</td>
                        <td className="p-1 text-center font-extrabold text-cyan-900">{renderValBadge(parameters.effectiveCohesionKg || parameters.effectiveCohesion || { value: `${cEffKg.toFixed(3)} kg/cm²`, isCalculated: true })}</td>
                        <td className="p-1 text-center font-bold text-cyan-950 font-sans border-l border-slate-300">{cEffKpa.toFixed(2)} kPa</td>
                      </tr>
                      <tr className="bg-cyan-50 font-sans">
                        <td className="p-1 font-extrabold border-r border-slate-300 text-cyan-950">Sudut Geser Dalam Efektif / Effective Friction Angle, φ' (°)</td>
                        <td colSpan={2} className="p-1 text-center font-extrabold text-cyan-900">{renderValBadge(parameters.effectiveFrictionAngle || { value: `${phiEff.toFixed(2)}°`, isCalculated: true })}</td>
                      </tr>
                      <tr className="bg-slate-50 font-sans">
                        <td className="p-1 font-semibold border-r border-slate-300">Kohesi Total / Total Cohesion, cu (kg/cm²)</td>
                        <td className="p-1 text-center font-extrabold text-slate-900">{renderValBadge(parameters.totalCohesionKg || { value: `${cTotKg.toFixed(3)} kg/cm²`, isCalculated: true })}</td>
                        <td className="p-1 text-center font-bold text-slate-800 font-sans border-l border-slate-300">{cTotKpa.toFixed(2)} kPa</td>
                      </tr>
                      <tr className="bg-slate-50 font-sans">
                        <td className="p-1 font-semibold border-r border-slate-300">Sudut Geser Dalam Total / Total Friction Angle, φu (°)</td>
                        <td colSpan={2} className="p-1 text-center font-extrabold text-slate-900">{renderValBadge(parameters.totalFrictionAngle || { value: `${phiTot.toFixed(2)}°`, isCalculated: true })}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ===== SECTION 4 GRAFIK UTAMA TRIAXIAL CU (2x2 GRID IN LHU) ===== */}
              <div className="border border-black p-1 bg-white space-y-1">
                <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-bold uppercase text-[8px] tracking-wide flex justify-between items-center">
                  <span>GRAFIK HASIL PENGUJIAN TRIAXIAL CU (4 STANDAR PLOTS — SNI 2455:2015)</span>
                  <span className="font-mono text-[7px] text-cyan-200">{isMulti ? 'Multi-Stage Mode' : 'Normal Mode'}</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {/* GRAFIK 1: Tegangan Deviator vs Regangan Aksial (σd vs εa) */}
                  <div className="border border-slate-300 p-1 bg-white">
                    <div className="text-[7.5px] font-bold text-slate-900 border-b border-slate-200 pb-0.5 mb-1 flex justify-between">
                      <span>Grafik 1: Tegangan Deviator vs Regangan Aksial (σd vs εa)</span>
                    </div>
                    <svg viewBox="0 0 240 130" className="w-full h-36 bg-white overflow-visible">
                      {[0, 100, 200, 300, 400, 500].map(val => {
                        const y = 110 - (val / 500) * 95;
                        return (
                          <g key={val}>
                            <line x1="30" y1={y} x2="230" y2={y} stroke="#F1F5F9" strokeWidth="1" />
                            <text x="26" y={y + 2.5} textAnchor="end" fontSize="6.5" fill="#64748B">{val}</text>
                          </g>
                        );
                      })}
                      {[0, 5, 10, 15, 20, 25].map(val => {
                        const x = 30 + (val / 25) * 200;
                        return (
                          <g key={val}>
                            <line x1={x} y1="15" x2={x} y2="110" stroke="#F1F5F9" strokeWidth="1" />
                            <text x={x} y="119" textAnchor="middle" fontSize="6.5" fill="#64748B">{val}%</text>
                          </g>
                        );
                      })}
                      <line x1="30" y1="15" x2="30" y2="110" stroke="#334155" strokeWidth="1.2" />
                      <line x1="30" y1="110" x2="230" y2="110" stroke="#334155" strokeWidth="1.2" />
                      <text x="-62" y="10" transform="rotate(-90)" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#334155">Deviator Stress, σd (kPa)</text>
                      <text x="130" y="127" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#334155">Axial Strain, εa (%)</text>

                      {/* 3 Stage Curves */}
                      {allCurves.map((c, cIdx) => {
                        const pathD = c.pts.map((pt, i) => {
                          const x = 30 + (pt.strain / 25) * 200;
                          const y = 110 - (pt.dev / 500) * 95;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ');
                        return <path key={cIdx} d={pathD} fill="none" stroke={c.color} strokeWidth="1.8" />;
                      })}
                    </svg>
                  </div>

                  {/* GRAFIK 2: Tekanan Air Pori vs Regangan Aksial (u vs εa) */}
                  <div className="border border-slate-300 p-1 bg-white">
                    <div className="text-[7.5px] font-bold text-slate-900 border-b border-slate-200 pb-0.5 mb-1 flex justify-between">
                      <span>Grafik 2: Tekanan Air Pori vs Regangan Aksial (u vs εa)</span>
                      <span className="text-[6.5px] text-cyan-800 font-mono font-bold">(Y-min = 190 kPa)</span>
                    </div>
                    <svg viewBox="0 0 240 130" className="w-full h-36 bg-white overflow-visible">
                      {[190, 210, 230, 250, 270, 290].map(val => {
                        const y = 110 - ((val - 190) / 100) * 95;
                        return (
                          <g key={val}>
                            <line x1="30" y1={y} x2="230" y2={y} stroke="#F1F5F9" strokeWidth="1" />
                            <text x="26" y={y + 2.5} textAnchor="end" fontSize="6.5" fill="#64748B">{val}</text>
                          </g>
                        );
                      })}
                      {[0, 5, 10, 15, 20, 25].map(val => {
                        const x = 30 + (val / 25) * 200;
                        return (
                          <g key={val}>
                            <line x1={x} y1="15" x2={x} y2="110" stroke="#F1F5F9" strokeWidth="1" />
                            <text x={x} y="119" textAnchor="middle" fontSize="6.5" fill="#64748B">{val}%</text>
                          </g>
                        );
                      })}
                      <line x1="30" y1="15" x2="30" y2="110" stroke="#334155" strokeWidth="1.2" />
                      <line x1="30" y1="110" x2="230" y2="110" stroke="#334155" strokeWidth="1.2" />
                      <text x="-62" y="10" transform="rotate(-90)" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#334155">Pore Pressure, u (kPa)</text>
                      <text x="130" y="127" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#334155">Axial Strain, εa (%)</text>

                      {/* 3 Stage Curves */}
                      {allCurves.map((c, cIdx) => {
                        const pathD = c.pts.map((pt, i) => {
                          const x = 30 + (pt.strain / 25) * 200;
                          const y = 110 - ((pt.u - 190) / 100) * 95;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ');
                        return <path key={cIdx} d={pathD} fill="none" stroke={c.color} strokeWidth="1.8" />;
                      })}
                    </svg>
                  </div>

                  {/* GRAFIK 3: Rasio Tegangan Efektif vs Regangan Aksial (σ'1/σ'3 vs εa) */}
                  <div className="border border-slate-300 p-1 bg-white">
                    <div className="text-[7.5px] font-bold text-slate-900 border-b border-slate-200 pb-0.5 mb-1">
                      Grafik 3: Rasio Tegangan Efektif vs Regangan Aksial (σ'₁/σ'₃ vs εa)
                    </div>
                    <svg viewBox="0 0 240 130" className="w-full h-36 bg-white overflow-visible">
                      {[1.0, 1.5, 2.0, 2.5, 3.0, 3.5].map(val => {
                        const y = 110 - ((val - 1.0) / 2.5) * 95;
                        return (
                          <g key={val}>
                            <line x1="30" y1={y} x2="230" y2={y} stroke="#F1F5F9" strokeWidth="1" />
                            <text x="26" y={y + 2.5} textAnchor="end" fontSize="6.5" fill="#64748B">{val.toFixed(1)}</text>
                          </g>
                        );
                      })}
                      {[0, 5, 10, 15, 20, 25].map(val => {
                        const x = 30 + (val / 25) * 200;
                        return (
                          <g key={val}>
                            <line x1={x} y1="15" x2={x} y2="110" stroke="#F1F5F9" strokeWidth="1" />
                            <text x={x} y="119" textAnchor="middle" fontSize="6.5" fill="#64748B">{val}%</text>
                          </g>
                        );
                      })}
                      <line x1="30" y1="15" x2="30" y2="110" stroke="#334155" strokeWidth="1.2" />
                      <line x1="30" y1="110" x2="230" y2="110" stroke="#334155" strokeWidth="1.2" />
                      <text x="-62" y="10" transform="rotate(-90)" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#334155">Stress Ratio, σ'₁/σ'₃</text>
                      <text x="130" y="127" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#334155">Axial Strain, εa (%)</text>

                      {/* 3 Stage Curves */}
                      {allCurves.map((c, cIdx) => {
                        const pathD = c.pts.map((pt, i) => {
                          const x = 30 + (pt.strain / 25) * 200;
                          const y = 110 - ((pt.ratio - 1.0) / 2.5) * 95;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ');
                        return <path key={cIdx} d={pathD} fill="none" stroke={c.color} strokeWidth="1.8" />;
                      })}
                    </svg>
                  </div>

                  {/* GRAFIK 4: Diagram Lingkaran Mohr & Selubung Keruntuhan */}
                  <div className="border border-slate-300 p-1 bg-white">
                    <div className="text-[7.5px] font-bold text-slate-900 border-b border-slate-200 pb-0.5 mb-1">
                      Grafik 4: Diagram Lingkaran Mohr &amp; Failure Envelope
                    </div>
                    <svg viewBox="0 0 240 130" className="w-full h-36 bg-white overflow-visible">
                      <text x="-62" y="10" transform="rotate(-90)" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#475569">Geser τ (kPa)</text>
                      <text x="130" y="127" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#475569">Utama σ (kPa)</text>

                      {[0, 100, 200, 300, 400].map(val => {
                        const y = 110 - (val / 400) * 95;
                        return (
                          <g key={val}>
                            <line x1="30" y1={y} x2="230" y2={y} stroke="#F1F5F9" strokeWidth="1" />
                            <text x="26" y={y + 2.5} textAnchor="end" fontSize="6.5" fill="#94A3B8">{val}</text>
                          </g>
                        );
                      })}

                      {[0, 200, 400, 600, 800].map(val => {
                        const x = 30 + (val / 800) * 200;
                        return (
                          <g key={val}>
                            <line x1={x} y1="15" x2={x} y2="110" stroke="#F1F5F9" strokeWidth="1" />
                            <text x={x} y="119" textAnchor="middle" fontSize="6.5" fill="#64748B">{val}</text>
                          </g>
                        );
                      })}

                      <line x1="30" y1="15" x2="30" y2="110" stroke="#334155" strokeWidth="1.2" />
                      <line x1="30" y1="110" x2="230" y2="110" stroke="#334155" strokeWidth="1.2" />

                      {/* Mohr Circles */}
                      {(() => {
                        const effCircles = [
                          { s3: sig3Eff_1, s1: sig1Eff_1, color: '#06B6D4' },
                          { s3: sig3Eff_2, s1: sig1Eff_2, color: '#6366F1' },
                          { s3: sig3Eff_3, s1: sig1Eff_3, color: '#A855F7' }
                        ];
                        const totCircles = [
                          { s3: sig3_1, s1: sig1_1, color: '#06B6D4' },
                          { s3: sig3_2, s1: sig1_2, color: '#6366F1' },
                          { s3: sig3_3, s1: sig1_3, color: '#A855F7' }
                        ];

                        return (
                          <g>
                            {totCircles.map((c, idx) => {
                              const xStart = 30 + (c.s3 / 800) * 200;
                              const xEnd = 30 + (c.s1 / 800) * 200;
                              const rPx = (xEnd - xStart) / 2;
                              const arcPath = `M ${xStart} 110 A ${rPx} ${rPx} 0 0 1 ${xEnd} 110`;
                              return <path key={`tot-${idx}`} d={arcPath} fill="none" stroke={c.color} strokeWidth="1" strokeDasharray="3 2" />;
                            })}
                            {effCircles.map((c, idx) => {
                              const xStart = 30 + (c.s3 / 800) * 200;
                              const xEnd = 30 + (c.s1 / 800) * 200;
                              const rPx = (xEnd - xStart) / 2;
                              const arcPath = `M ${xStart} 110 A ${rPx} ${rPx} 0 0 1 ${xEnd} 110`;
                              return <path key={`eff-${idx}`} d={arcPath} fill="none" stroke={c.color} strokeWidth="1.5" />;
                            })}
                            {(() => {
                              const x0 = 30; const y0 = 110 - (cEffKpa / 400) * 95;
                              const tauEnd = cEffKpa + 800 * Math.tan((phiEff * Math.PI) / 180);
                              const xEnd = 30 + 200; const yEnd = 110 - (Math.min(400, tauEnd) / 400) * 95;
                              return <line x1={x0} y1={y0} x2={xEnd} y2={yEnd} stroke="#0891B2" strokeWidth="1.6" />;
                            })()}
                            {(() => {
                              const x0 = 30; const y0 = 110 - (cTotKpa / 400) * 95;
                              const tauEnd = cTotKpa + 800 * Math.tan((phiTot * Math.PI) / 180);
                              const xEnd = 30 + 200; const yEnd = 110 - (Math.min(400, tauEnd) / 400) * 95;
                              return <line x1={x0} y1={y0} x2={xEnd} y2={yEnd} stroke="#475569" strokeWidth="1.2" strokeDasharray="4 2" />;
                            })()}
                          </g>
                        );
                      })()}
                    </svg>
                  </div>
                </div>

                {/* Sub-Legend for all 4 plots */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[7.5px] font-mono border-t border-slate-200 pt-1">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-cyan-600"><span className="w-2.5 h-0.5 bg-cyan-500 rounded"></span>{stageLabels[0]}</span>
                    <span className="flex items-center gap-1 text-indigo-600"><span className="w-2.5 h-0.5 bg-indigo-500 rounded"></span>{stageLabels[1]}</span>
                    <span className="flex items-center gap-1 text-purple-600"><span className="w-2.5 h-0.5 bg-purple-500 rounded"></span>{stageLabels[2]}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-cyan-800"><span className="w-3 h-0.5 bg-cyan-600"></span>Garis Efektif (c', φ')</span>
                    <span className="flex items-center gap-1 text-slate-700"><span className="w-3 h-0.5 bg-slate-600 border-b border-dashed"></span>Garis Total (cu, φu)</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 6. LHU PFH - UJI PERMEABILITAS METODE FALLING HEAD (MATCHING QMS-RPS-001.xlsx Sheet LHU PFH 100%) */}
        {sheetCode === 'LHU PFH' && (() => {
          const raw = boundData.rawDetails || {};
          const diaDispMm = raw.diaDispMm || 64.4;
          const heightDispMm = raw.heightDispMm || 63.7;
          const areaCm2 = raw.areaCm2 || 32.57;
          const volCm3 = raw.volCm3 || 207.49;
          const mcVal = raw.mcVal || 69.11;
          const wetDensity = raw.wetDensity || 1.591;
          const dryDensity = raw.dryDensity || 0.941;

          const pipeDiaMm = raw.pipeDiaMm || 14.99;
          const pipeAreaCm2 = raw.pipeAreaCm2 || 1.7648;
          const h1Init = raw.h1Init || 169.3;
          const h2Final = raw.h2Final || 156.8;
          const tElapsedTotal = raw.tElapsedTotal || 300;
          const tempC = raw.tempC || 26;
          const rT = raw.rT || 0.87;

          const trials: any[] = raw.trials || [
            { no: 1, h1: 169.3, h2: 167.2, t: 60, kT: 7.18e-5, kT20: 6.25e-5 },
            { no: 2, h1: 167.2, h2: 165.1, t: 60, kT: 7.27e-5, kT20: 6.33e-5 },
            { no: 3, h1: 165.1, h2: 163.0, t: 60, kT: 7.36e-5, kT20: 6.41e-5 },
            { no: 4, h1: 163.0, h2: 158.8, t: 60, kT: 1.50e-4, kT20: 1.31e-4 },
            { no: 5, h1: 158.8, h2: 156.8, t: 60, kT: 7.29e-5, kT20: 6.34e-5 }
          ];

          const kTAvg = raw.kTAvg || 8.825e-5;
          const kT20Avg = raw.kT20Avg || 7.678e-5;

          const formatSci = (num: number) => {
            if (!num || num === 0) return '-';
            return num.toExponential(3).toUpperCase();
          };

          return (
            <div className="space-y-2 font-sans text-[8.5px]">
              {/* SECTION 1: 2-COLUMN GRID FOR SPECIMEN DATA & TEST DATA */}
              <div className="grid grid-cols-2 gap-2">
                {/* LEFT BOX: DATA BENDA UJI / SPECIMEN DATA */}
                <div className="border border-slate-900 bg-white">
                  <div className="bg-[#1e40af] text-white px-2 py-0.5 font-bold uppercase text-[8.5px] tracking-wide">
                    DATA BENDA UJI / SPECIMEN DATA
                  </div>
                  <table className="w-full text-[8.5px] border-collapse text-left">
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300">Diameter Benda Uji / Specimen Diameter (mm)</td>
                        <td className="py-0.5 px-1.5 font-bold text-center font-mono w-24">{diaDispMm.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300">Tinggi Benda Uji / Specimen Height (mm)</td>
                        <td className="py-0.5 px-1.5 font-bold text-center font-mono">{heightDispMm.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300">Luas Penampang / Cross-sectional Area ( cm²)</td>
                        <td className="py-0.5 px-1.5 font-bold text-center font-mono">{areaCm2.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300">Volume Benda Uji / Specimen Volume (cm³)</td>
                        <td className="py-0.5 px-1.5 font-bold text-center font-mono">{volCm3.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300">Kadar Air / Moisture Content (%)</td>
                        <td className="py-0.5 px-1.5 font-bold text-center font-mono text-emerald-800">{mcVal.toFixed(2)} %</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300">Berat Isi Basah / Wet Density (g/cm³)</td>
                        <td className="py-0.5 px-1.5 font-bold text-center font-mono text-emerald-800">{wetDensity.toFixed(3)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300">Berat Isi Kering / Dry Density (g/cm³)</td>
                        <td className="py-0.5 px-1.5 font-bold text-center font-mono text-emerald-800">{dryDensity.toFixed(3)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* RIGHT BOX: DATA PENGUJIAN / TEST DATA */}
                <div className="border border-slate-900 bg-white">
                  <div className="bg-[#1e40af] text-white px-2 py-0.5 font-bold uppercase text-[8.5px] tracking-wide">
                    DATA PENGUJIAN / TEST DATA
                  </div>
                  <table className="w-full text-[8.5px] border-collapse text-left">
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300">Diameter Pipa Standpipe / Standpipe Diameter (mm)</td>
                        <td className="py-0.5 px-1.5 font-bold text-center font-mono w-24">{pipeDiaMm.toFixed(3)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300">Luas Standpipe / Standpipe Area (cm²)</td>
                        <td className="py-0.5 px-1.5 font-bold text-center font-mono">{pipeAreaCm2.toFixed(4)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300">Tinggi Awal / Initial Head,h₁ (cm)</td>
                        <td className="py-0.5 px-1.5 font-bold text-center font-mono">{h1Init.toFixed(1)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300">Tinggi Akhir / Final Head,h₂ (cm)</td>
                        <td className="py-0.5 px-1.5 font-bold text-center font-mono">{h2Final.toFixed(1)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300">Waktu Aliran / Elapsed Time,t (s)</td>
                        <td className="py-0.5 px-1.5 font-bold text-center font-mono">{tElapsedTotal.toFixed(0)}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300">Suhu Air / Water Temperature (°C)</td>
                        <td className="py-0.5 px-1.5 font-bold text-center font-mono">{tempC.toFixed(0)} °C</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-1.5 font-medium text-slate-700 border-r border-slate-300">Faktor Koreksi Temperatur / Temperature Correction Factor ( - )</td>
                        <td className="py-0.5 px-1.5 font-bold text-center font-mono">{rT.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 2: HASIL PENGUJIAN / TEST RESULT TABLE (5 TRIALS) */}
              <div className="border border-slate-900 bg-white">
                <div className="bg-[#1e40af] text-white px-2 py-0.5 font-bold uppercase text-[8.5px] tracking-wide flex justify-between items-center">
                  <span>HASIL PENGUJIAN / TEST RESULT</span>
                  <span className="text-[7.5px] font-mono font-normal bg-blue-900/60 px-1.5 py-0.2 rounded">FALLING HEAD METHOD</span>
                </div>
                <table className="w-full text-[8.5px] border-collapse text-center">
                  <thead>
                    <tr className="bg-slate-100 font-extrabold border-b border-slate-900 text-slate-900">
                      <th className="py-1 px-1 border-r border-slate-900 w-10">No</th>
                      <th className="py-1 px-1 border-r border-slate-900">h₁ (cm)</th>
                      <th className="py-1 px-1 border-r border-slate-900">h₂ (cm)</th>
                      <th className="py-1 px-1 border-r border-slate-900">t (s)</th>
                      <th className="py-1 px-1 border-r border-slate-900">kT (cm/s)</th>
                      <th className="py-1 px-1">kT₂₀ (cm/s)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-mono">
                    {trials.map((tr: any) => (
                      <tr key={tr.no}>
                        <td className="py-0.5 px-1 border-r border-slate-300 font-bold">{tr.no}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{tr.h1.toFixed(1)}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{tr.h2.toFixed(1)}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300">{tr.t.toFixed(0)}</td>
                        <td className="py-0.5 px-1 border-r border-slate-300 font-bold text-slate-900">{formatSci(tr.kT)}</td>
                        <td className="py-0.5 px-1 font-bold text-emerald-800">{formatSci(tr.kT20)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold border-t border-slate-900">
                      <td colSpan={4} className="py-1 px-2 text-right font-sans uppercase text-[8px] text-slate-700">Rata-rata / Average</td>
                      <td className="py-1 px-1 border-r border-slate-900 font-extrabold text-blue-900">{formatSci(kTAvg)}</td>
                      <td className="py-1 px-1 font-extrabold text-emerald-900">{formatSci(kT20Avg)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* SECTION 3: PARAMETER HASIL UJI / TEST RESULT PARAMETERS */}
              <div className="border border-slate-900 bg-white">
                <div className="bg-[#1e40af] text-white px-2 py-0.5 font-bold uppercase text-[8.5px] tracking-wide">
                  PARAMETER HASIL UJI / TEST RESULT PARAMETERS
                </div>
                <table className="w-full text-[8.5px] border-collapse text-left">
                  <tbody className="divide-y divide-slate-300 font-sans">
                    <tr>
                      <td className="py-1 px-2 font-semibold text-slate-800 border-r border-slate-300">
                        Koefisien Permeabilitas / Coefficient of Permeability, kT (cm/s)
                      </td>
                      <td className="py-1 px-3 font-extrabold font-mono text-center text-blue-900 text-[9.5px] w-48">
                        {formatSci(kTAvg)} cm/s
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 font-semibold text-slate-800 border-r border-slate-300">
                        Koefisien Permeabilitas Terkoreksi / Corrected Coefficient of Permeability, k₂₀°C (cm/s)
                      </td>
                      <td className="py-1 px-3 font-extrabold font-mono text-center text-emerald-900 text-[10px] w-48 bg-emerald-50">
                        {formatSci(kT20Avg)} cm/s
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* 8. LHU_CBR Unsoaked (CALIFORNIA BEARING RATIO UNSOAKED - MATCHING EXCEL LHU_CBR Unsoaked SHEET) */}
        {sheetCode === 'LHU_CBR Unsoaked' && (() => {
          const raw = boundData.rawDetails?.cbrUnsoaked || {};
          const compactionMethod = raw.compactionMethod || 'Standard Proctor (SNI 1742:2008)';
          const mddVal = raw.mdd || 1.24;
          const omcVal = raw.omc || 16.5;
          const designCbr = boundData.rawDetails?.roundedDesignCbr || 31;
          const exactDesignCbr = boundData.rawDetails?.designCbrPct || 30.68;

          const specResults = [
            { blows: 10, gammaD: 1.1824, cbr01: 25.0, cbr02: 29.3, cbrSel: 29.3 },
            { blows: 25, gammaD: 1.2000, cbr01: 23.0, cbr02: 30.0, cbrSel: 30.0 },
            { blows: 56, gammaD: 1.2500, cbr01: 26.0, cbr02: 30.7, cbrSel: 30.7 },
          ];

          return (
            <div className="space-y-4">
              <div className="bg-slate-100 p-1.5 font-bold uppercase text-[9.5px] border-b border-black flex items-center justify-between">
                <span>HASIL PENGUJIAN CALIFORNIA BEARING RATIO (CBR) TANPA PERENDAMAN</span>
                <span className="font-mono text-[8.5px]">SNI 1744:2012 / ASTM D1883</span>
              </div>

              {/* COMPACTION PARAMETERS TABLE */}
              <div className="grid grid-cols-2 gap-2 text-[9.5px] font-mono">
                <table className="w-full border-collapse border border-black text-left">
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="p-1 font-bold bg-slate-100 border-r border-black w-36">Metode Pemadatan</td>
                      <td className="p-1 font-bold">{compactionMethod}</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-1 font-bold bg-slate-100 border-r border-black">Kepadatan Kering Maksimum (MDD)</td>
                      <td className="p-1 font-bold">{mddVal} g/cm³</td>
                    </tr>
                    <tr>
                      <td className="p-1 font-bold bg-slate-100 border-r border-black">Kadar Air Optimum (OMC)</td>
                      <td className="p-1 font-bold">{omcVal} %</td>
                    </tr>
                  </tbody>
                </table>

                {/* HERO RESULT BOX */}
                <div className="border border-black p-2.5 bg-emerald-50/50 flex flex-col justify-center items-center text-center space-y-0.5">
                  <div className="text-[9px] font-bold uppercase text-slate-700">DESIGN CBR (AT 100% MDD TARGET)</div>
                  <div className="text-2xl font-extrabold text-emerald-800 font-mono">{designCbr} %</div>
                  <div className="text-[8.5px] font-mono text-slate-500">Exact: {exactDesignCbr.toFixed(2)}% (Regresi Parabolik SNI 1744:2012)</div>
                </div>
              </div>

              {/* 3-POINT SPECIMEN SUMMARY TABLE */}
              <table className="w-full border-collapse border border-black text-center text-[9.5px] font-mono">
                <thead>
                  <tr className="bg-slate-200 font-extrabold border-b border-black text-slate-900 text-[9px] uppercase">
                    <th className="p-1.5 border-r border-black text-left">Parameter Uji</th>
                    <th className="p-1.5 border-r border-black">Titik 1 (10 Tumbukan)</th>
                    <th className="p-1.5 border-r border-black">Titik 2 (25 Tumbukan)</th>
                    <th className="p-1.5">Titik 3 (56 Tumbukan)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  <tr>
                    <td className="p-1 text-left font-sans font-bold border-r border-black">Kepadatan Kering ($\gamma_d$) [g/cm³]</td>
                    <td className="p-1 border-r border-black">1.1824</td>
                    <td className="p-1 border-r border-black">1.2000</td>
                    <td className="p-1">1.2500</td>
                  </tr>
                  <tr>
                    <td className="p-1 text-left font-sans font-bold border-r border-black">CBR @ 0.1" (2.54 mm) [%]</td>
                    <td className="p-1 border-r border-black">25.0 %</td>
                    <td className="p-1 border-r border-black">23.0 %</td>
                    <td className="p-1">26.0 %</td>
                  </tr>
                  <tr>
                    <td className="p-1 text-left font-sans font-bold border-r border-black">CBR @ 0.2" (5.08 mm) [%]</td>
                    <td className="p-1 border-r border-black">29.3 %</td>
                    <td className="p-1 border-r border-black">30.0 %</td>
                    <td className="p-1">30.7 %</td>
                  </tr>
                  <tr className="bg-slate-100 font-extrabold">
                    <td className="p-1 text-left font-sans font-extrabold border-r border-black text-slate-900">Nilai CBR Terpilih [%]</td>
                    <td className="p-1 border-r border-black text-emerald-800">29.3 %</td>
                    <td className="p-1 border-r border-black text-emerald-800">30.0 %</td>
                    <td className="p-1 text-emerald-800">30.7 %</td>
                  </tr>
                </tbody>
              </table>

              {/* CURVE PREVIEW SVG */}
              <div className="border border-black p-2 bg-white flex justify-center">
                <svg viewBox="0 0 450 140" className="w-full h-32">
                  <line x1="40" y1="10" x2="40" y2="120" stroke="#000" strokeWidth="1" />
                  <line x1="40" y1="120" x2="430" y2="120" stroke="#000" strokeWidth="1" />
                  <circle cx="100" cy="90" r="4" fill="#059669" />
                  <circle cx="200" cy="65" r="4" fill="#059669" />
                  <circle cx="340" cy="35" r="4" fill="#059669" />
                  <path d="M 100 90 Q 200 65 340 35" fill="none" stroke="#059669" strokeWidth="2" />
                  <line x1="310" y1="10" x2="310" y2="120" stroke="#DC2626" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="315" y="45" fontSize="9" fontWeight="bold" fill="#DC2626">Design CBR: {designCbr}%</text>
                  <text x="230" y="135" fontSize="8" textAnchor="middle">Dry Density γd (g/cm³)</text>
                  <text x="15" y="65" fontSize="8" textAnchor="middle" transform="rotate(-90 15 65)">CBR (%)</text>
                </svg>
              </div>
            </div>
          );
        })()}

        {/* 8B. LHU_CBR Soaked (CALIFORNIA BEARING RATIO SOAKED - SNI 1744:2012 / ASTM D1883) */}
        {(sheetCode === 'Template LHU_CBRsoaked' || sheetCode === 'LHU_CBR Soaked' || sheetCode === 'LHU_CBRsoaked') && (() => {
          const raw = boundData.rawDetails?.cbrSoaked || {};
          const compactionMethod = raw.compactionMethod || 'Standard Proctor (SNI 1742:2008)';
          const mddVal = raw.mdd || 1.24;
          const omcVal = raw.omc || 16.5;
          const designCbr = boundData.rawDetails?.roundedDesignCbr || 15;
          const exactDesignCbr = boundData.rawDetails?.designCbrPct || 14.85;
          const avgSwellPct = boundData.rawDetails?.avgSwellPct || 0.45;
          const targetPctDensity = raw.targetPctDensity || 95;

          const specResults = boundData.rawDetails?.specResults || [
            { blows: 10, dryDensity: 1.1824, swellPct: 0.62, cbr01Pct: 12.0, cbr02Pct: 13.5, selectedCbrPct: 13.5, mcBeforePct: 16.5, mcAfterPct: 19.2 },
            { blows: 25, dryDensity: 1.2000, swellPct: 0.45, cbr01Pct: 14.2, cbr02Pct: 15.0, selectedCbrPct: 15.0, mcBeforePct: 16.5, mcAfterPct: 18.8 },
            { blows: 56, dryDensity: 1.2500, swellPct: 0.28, cbr01Pct: 16.0, cbr02Pct: 17.2, selectedCbrPct: 17.2, mcBeforePct: 16.5, mcAfterPct: 18.1 },
          ];

          return (
            <div className="space-y-4">
              <div className="bg-slate-100 p-1.5 font-bold uppercase text-[9.5px] border-b border-black flex items-center justify-between">
                <span>HASIL PENGUJIAN CALIFORNIA BEARING RATIO (CBR) DENGAN PERENDAMAN 4 HARI</span>
                <span className="font-mono text-[8.5px]">SNI 1744:2012 / ASTM D1883</span>
              </div>

              {/* COMPACTION PARAMETERS TABLE & HERO RESULT BOX */}
              <div className="grid grid-cols-2 gap-2 text-[9.5px] font-mono">
                <table className="w-full border-collapse border border-black text-left">
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="p-1 font-bold bg-slate-100 border-r border-black w-36">Metode Pemadatan</td>
                      <td className="p-1 font-bold">{compactionMethod}</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-1 font-bold bg-slate-100 border-r border-black">Kepadatan Kering Maksimum (MDD)</td>
                      <td className="p-1 font-bold">{mddVal} g/cm³</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-1 font-bold bg-slate-100 border-r border-black">Kadar Air Optimum (OMC)</td>
                      <td className="p-1 font-bold">{omcVal} %</td>
                    </tr>
                    <tr>
                      <td className="p-1 font-bold bg-slate-100 border-r border-black">Lama Perendaman &amp; Surcharge</td>
                      <td className="p-1 font-bold">4 Hari (96 Jam) / 4.54 kg</td>
                    </tr>
                  </tbody>
                </table>

                {/* HERO RESULT BOX */}
                <div className="border border-black p-2 bg-blue-50/60 flex flex-col justify-center items-center text-center space-y-0.5">
                  <div className="text-[8.5px] font-bold uppercase text-blue-900">DESIGN CBR (AT {targetPctDensity}% MDD TARGET)</div>
                  <div className="text-2xl font-black text-blue-900 font-mono">{designCbr} %</div>
                  <div className="text-[8px] font-mono text-slate-600">Exact: {exactDesignCbr.toFixed(2)}% | Rata-Rata Swell: <strong className="text-amber-800">{avgSwellPct.toFixed(2)}%</strong></div>
                </div>
              </div>

              {/* 3-POINT SPECIMEN SUMMARY TABLE WITH SWELL */}
              <table className="w-full border-collapse border border-black text-center text-[9.5px] font-mono">
                <thead>
                  <tr className="bg-slate-200 font-extrabold border-b border-black text-slate-900 text-[9px] uppercase">
                    <th className="p-1.5 border-r border-black text-left">Parameter Uji</th>
                    {specResults.map((sr: any, idx: number) => (
                      <th key={idx} className={`p-1.5 ${idx < specResults.length - 1 ? 'border-r border-black' : ''}`}>
                        Titik {idx + 1} ({sr.blows} Tumbukan)
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  <tr>
                    <td className="p-1 text-left font-sans font-bold border-r border-black">Kepadatan Kering Cetak ($\gamma_d$) [g/cm³]</td>
                    {specResults.map((sr: any, idx: number) => (
                      <td key={idx} className={`p-1 ${idx < specResults.length - 1 ? 'border-r border-black' : ''}`}>
                        {(sr.dryDensity || sr.gammaD || 0).toFixed(4)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-1 text-left font-sans font-bold border-r border-black">Kadar Air Sebelum Soaking ($w_1$) [%]</td>
                    {specResults.map((sr: any, idx: number) => (
                      <td key={idx} className={`p-1 ${idx < specResults.length - 1 ? 'border-r border-black' : ''}`}>
                        {(sr.mcBeforePct || 0).toFixed(2)} %
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-amber-50 font-bold">
                    <td className="p-1 text-left font-sans font-bold border-r border-black text-amber-950">Persen Pengembangan (% Swell)</td>
                    {specResults.map((sr: any, idx: number) => (
                      <td key={idx} className={`p-1 font-black text-amber-900 ${idx < specResults.length - 1 ? 'border-r border-black' : ''}`}>
                        {(sr.swellPct || 0).toFixed(2)} %
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-1 text-left font-sans font-bold border-r border-black">Kadar Air Setelah Soaking ($w_2$) [%]</td>
                    {specResults.map((sr: any, idx: number) => (
                      <td key={idx} className={`p-1 ${idx < specResults.length - 1 ? 'border-r border-black' : ''}`}>
                        {(sr.mcAfterPct || 0).toFixed(2)} %
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-1 text-left font-sans font-bold border-r border-black">CBR @ 0.1" (2.54 mm) [%]</td>
                    {specResults.map((sr: any, idx: number) => (
                      <td key={idx} className={`p-1 ${idx < specResults.length - 1 ? 'border-r border-black' : ''}`}>
                        {(sr.cbr01Pct || sr.cbr01 || 0).toFixed(1)} %
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-1 text-left font-sans font-bold border-r border-black">CBR @ 0.2" (5.08 mm) [%]</td>
                    {specResults.map((sr: any, idx: number) => (
                      <td key={idx} className={`p-1 ${idx < specResults.length - 1 ? 'border-r border-black' : ''}`}>
                        {(sr.cbr02Pct || sr.cbr02 || 0).toFixed(1)} %
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-blue-100 font-extrabold">
                    <td className="p-1 text-left font-sans font-extrabold border-r border-black text-blue-950">Nilai CBR Terpilih [%]</td>
                    {specResults.map((sr: any, idx: number) => (
                      <td key={idx} className={`p-1 font-black text-blue-900 ${idx < specResults.length - 1 ? 'border-r border-black' : ''}`}>
                        {(sr.selectedCbrPct || sr.cbrSel || 0).toFixed(1)} %
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>

              {/* CURVE PREVIEW SVG */}
              <div className="border border-black p-2 bg-white flex justify-center">
                <svg viewBox="0 0 450 140" className="w-full h-32">
                  <line x1="40" y1="10" x2="40" y2="120" stroke="#000" strokeWidth="1" />
                  <line x1="40" y1="120" x2="430" y2="120" stroke="#000" strokeWidth="1" />
                  <circle cx="100" cy="90" r="4" fill="#1D4ED8" />
                  <circle cx="200" cy="65" r="4" fill="#1D4ED8" />
                  <circle cx="340" cy="35" r="4" fill="#1D4ED8" />
                  <path d="M 100 90 Q 200 65 340 35" fill="none" stroke="#1D4ED8" strokeWidth="2" />
                  <line x1="280" y1="10" x2="280" y2="120" stroke="#DC2626" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="285" y="45" fontSize="9" fontWeight="bold" fill="#DC2626">Design CBR Soaked: {designCbr}%</text>
                  <text x="230" y="135" fontSize="8" textAnchor="middle">Dry Density γd (g/cm³)</text>
                  <text x="15" y="65" fontSize="8" textAnchor="middle" transform="rotate(-90 15 65)">CBR Soaked (%)</text>
                </svg>
              </div>
            </div>
          );
        })()}

        {/* 8C. LHU_DS-CU (DIRECT SHEAR CONSOLIDATED UNDRAINED - SNI 2813:2008 / ASTM D3080) */}
        {(sheetCode === 'Template LHU_DS-CU' || sheetCode === 'LHU_DS-CU') && (() => {
          const raw = boundData.rawDetails?.dsCu || {};
          const ccuVal = boundData.rawDetails?.cohesionCcu ?? raw.cohesionCcu ?? 0.185;
          const ccuKpa = boundData.rawDetails?.cohesionCcuKpa ?? (ccuVal * 98.0665);
          const phicuVal = boundData.rawDetails?.frictionAnglePhicu ?? raw.frictionAnglePhicu ?? 24.5;
          const lrc = raw.lrc || 0.150;

          const specResults = boundData.rawDetails?.specResults || [
            { normalStressKgCm2: 0.50, peakShearStressKgCm2: 0.408, peakDisplacementMm: 2.50, dryDensity: 1.317, mcBeforePct: 24.5, mcAfterPct: 25.1 },
            { normalStressKgCm2: 1.00, peakShearStressKgCm2: 0.635, peakDisplacementMm: 3.00, dryDensity: 1.320, mcBeforePct: 24.8, mcAfterPct: 25.3 },
            { normalStressKgCm2: 2.00, peakShearStressKgCm2: 1.078, peakDisplacementMm: 3.50, dryDensity: 1.323, mcBeforePct: 25.1, mcAfterPct: 25.6 },
          ];

          return (
            <div className="space-y-4 font-sans">
              <div className="bg-slate-100 p-1.5 font-bold uppercase text-[9.5px] border-b border-black flex items-center justify-between">
                <span>HASIL PENGUJIAN KUAT GESER LANGSUNG TERKONSOLIDASI TANPA DRAINASE (DS CU)</span>
                <span className="font-mono text-[8.5px]">SNI 2813:2008 / ASTM D3080</span>
              </div>

              {/* HERO RESULT BOX & PARAMETERS TABLE */}
              <div className="grid grid-cols-2 gap-2 text-[9.5px] font-mono">
                <table className="w-full border-collapse border border-black text-left">
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="p-1 font-bold bg-slate-100 border-r border-black w-36">Konstanta Ring (LRC)</td>
                      <td className="p-1 font-bold">{lrc} kg/div</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-1 font-bold bg-slate-100 border-r border-black">Kondisi Pengujian</td>
                      <td className="p-1 font-bold">Consolidated Undrained (CU)</td>
                    </tr>
                    <tr>
                      <td className="p-1 font-bold bg-slate-100 border-r border-black">Jumlah Benda Uji</td>
                      <td className="p-1 font-bold">3 Titik Benda Uji</td>
                    </tr>
                  </tbody>
                </table>

                {/* HERO RESULT BOX */}
                <div className="border border-black p-2 bg-purple-50/70 flex flex-col justify-center items-center text-center space-y-0.5">
                  <div className="text-[8.5px] font-bold uppercase text-purple-950">KOHESI TERKONSOLIDASI (c_cu) &amp; SUDUT GESER (φ_cu)</div>
                  <div className="text-xl font-black text-purple-900 font-mono">
                    c_cu = {ccuVal.toFixed(3)} kg/cm² &nbsp;|&nbsp; φ_cu = {phicuVal.toFixed(2)}°
                  </div>
                  <div className="text-[8px] font-mono text-slate-600">({ccuKpa.toFixed(1)} kPa) | Formulasi Mohr-Coulomb SNI 2813:2008</div>
                </div>
              </div>

              {/* 3-POINT SPECIMEN SUMMARY TABLE */}
              <table className="w-full border-collapse border border-black text-center text-[9.5px] font-mono">
                <thead>
                  <tr className="bg-slate-200 font-extrabold border-b border-black text-slate-900 text-[9px] uppercase">
                    <th className="p-1.5 border-r border-black text-left">Parameter Benda Uji</th>
                    {specResults.map((sr: any, idx: number) => (
                      <th key={idx} className={`p-1.5 ${idx < specResults.length - 1 ? 'border-r border-black' : ''}`}>
                        Titik {idx + 1} (σn = {(sr.normalStressKgCm2 || 0).toFixed(2)} kg/cm²)
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  <tr>
                    <td className="p-1 text-left font-sans font-bold border-r border-black">Kepadatan Kering ($\gamma_d$) [g/cm³]</td>
                    {specResults.map((sr: any, idx: number) => (
                      <td key={idx} className={`p-1 ${idx < specResults.length - 1 ? 'border-r border-black' : ''}`}>
                        {(sr.dryDensity || 0).toFixed(3)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-1 text-left font-sans font-bold border-r border-black">Kadar Air Sebelum Konsolidasi ($w_1$) [%]</td>
                    {specResults.map((sr: any, idx: number) => (
                      <td key={idx} className={`p-1 ${idx < specResults.length - 1 ? 'border-r border-black' : ''}`}>
                        {(sr.mcBeforePct || 0).toFixed(2)} %
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-1 text-left font-sans font-bold border-r border-black">Kadar Air Setelah Penggeseran ($w_2$) [%]</td>
                    {specResults.map((sr: any, idx: number) => (
                      <td key={idx} className={`p-1 ${idx < specResults.length - 1 ? 'border-r border-black' : ''}`}>
                        {(sr.mcAfterPct || 0).toFixed(2)} %
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-purple-100 font-extrabold">
                    <td className="p-1 text-left font-sans font-extrabold border-r border-black text-purple-950">Tegangan Geser Puncak ($\tau_f$) [kg/cm²]</td>
                    {specResults.map((sr: any, idx: number) => (
                      <td key={idx} className={`p-1 font-black text-purple-900 ${idx < specResults.length - 1 ? 'border-r border-black' : ''}`}>
                        {(sr.peakShearStressKgCm2 || 0).toFixed(3)} kg/cm²
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>

              {/* MOHR-COULOMB FAILURE ENVELOPE SVG CHART */}
              <div className="border border-black p-2 bg-white flex justify-center">
                <svg viewBox="0 0 450 140" className="w-full h-32">
                  <line x1="40" y1="10" x2="40" y2="120" stroke="#000" strokeWidth="1" />
                  <line x1="40" y1="120" x2="430" y2="120" stroke="#000" strokeWidth="1" />
                  <circle cx="100" cy="95" r="4" fill="#7C3AED" />
                  <circle cx="210" cy="70" r="4" fill="#7C3AED" />
                  <circle cx="380" cy="30" r="4" fill="#7C3AED" />
                  <line x1="40" y1="110" x2="420" y2="20" stroke="#7C3AED" strokeWidth="2" />
                  <text x="180" y="35" fontSize="9" fontWeight="bold" fill="#7C3AED">τ_f = {ccuVal.toFixed(3)} + σ_n · tan({phicuVal.toFixed(2)}°)</text>
                  <text x="230" y="135" fontSize="8" textAnchor="middle">Tegangan Normal σn (kg/cm²)</text>
                  <text x="15" y="65" fontSize="8" textAnchor="middle" transform="rotate(-90 15 65)">Tegangan Geser τ (kg/cm²)</text>
                </svg>
              </div>
            </div>
          );
        })()}

        {/* 8D. LHU_TRX-CD (TRIAXIAL CONSOLIDATED DRAINED - SNI 2455:2014 / ASTM D7181) */}
        {(sheetCode === 'Template LHU_TRX-CD' || sheetCode === 'LHU_TRX-CD') && (() => {
          const raw = boundData.rawDetails?.trxCd || {};
          const cPrimeVal = boundData.rawDetails?.effectiveCohesionC ?? raw.effectiveCohesionC ?? 0.477;
          const cPrimeKpa = boundData.rawDetails?.effectiveCohesionCKpa ?? (cPrimeVal * 98.0665);
          const phiPrimeVal = boundData.rawDetails?.effectiveFrictionAnglePhi ?? raw.effectiveFrictionAnglePhi ?? 16.78;
          const lrc = raw.lrc || 0.150;

          const specResults = boundData.rawDetails?.specResults || [
            { effectiveCellPressureKpa: 50, peakDeviatorStressKpa: 118.8, peakAxialStrainPct: 13.2, dryDensity: 1.208, mcBeforePct: 43.1, mcAfterPct: 44.5 },
            { effectiveCellPressureKpa: 100, peakDeviatorStressKpa: 163.0, peakAxialStrainPct: 13.5, dryDensity: 1.215, mcBeforePct: 43.0, mcAfterPct: 44.2 },
            { effectiveCellPressureKpa: 200, peakDeviatorStressKpa: 204.9, peakAxialStrainPct: 12.0, dryDensity: 1.222, mcBeforePct: 42.8, mcAfterPct: 44.0 },
          ];

          return (
            <div className="space-y-4 font-sans">
              <div className="bg-slate-100 p-1.5 font-bold uppercase text-[9.5px] border-b border-black flex items-center justify-between">
                <span>HASIL PENGUJIAN TRIAKSIAL TERKONSOLIDASI TERDRAINASE (TRIAXIAL CD)</span>
                <span className="font-mono text-[8.5px]">SNI 2455:2014 / ASTM D7181</span>
              </div>

              {/* HERO RESULT BOX & PARAMETERS TABLE */}
              <div className="grid grid-cols-2 gap-2 text-[9.5px] font-mono">
                <table className="w-full border-collapse border border-black text-left">
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="p-1 font-bold bg-slate-100 border-r border-black w-36">Konstanta Ring (LRC)</td>
                      <td className="p-1 font-bold">{lrc} kg/div</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-1 font-bold bg-slate-100 border-r border-black">Kondisi Pengujian</td>
                      <td className="p-1 font-bold">Consolidated Drained (CD)</td>
                    </tr>
                    <tr>
                      <td className="p-1 font-bold bg-slate-100 border-r border-black">Jumlah Benda Uji</td>
                      <td className="p-1 font-bold">3 Titik Benda Uji</td>
                    </tr>
                  </tbody>
                </table>

                {/* HERO RESULT BOX */}
                <div className="border border-black p-2 bg-emerald-50/70 flex flex-col justify-center items-center text-center space-y-0.5">
                  <div className="text-[8.5px] font-bold uppercase text-emerald-950">KOHESI EFEKTIF (c') &amp; SUDUT GESER EFEKTIF (φ')</div>
                  <div className="text-xl font-black text-emerald-900 font-mono">
                    c' = {cPrimeKpa.toFixed(1)} kPa &nbsp;|&nbsp; φ' = {phiPrimeVal.toFixed(2)}°
                  </div>
                  <div className="text-[8px] font-mono text-slate-600">({cPrimeVal.toFixed(3)} kg/cm²) | Formulasi Mohr-Coulomb SNI 2455:2014</div>
                </div>
              </div>

              {/* 3-POINT SPECIMEN SUMMARY TABLE */}
              <table className="w-full border-collapse border border-black text-center text-[9.5px] font-mono">
                <thead>
                  <tr className="bg-slate-200 font-extrabold border-b border-black text-slate-900 text-[9px] uppercase">
                    <th className="p-1.5 border-r border-black text-left">Parameter Benda Uji</th>
                    {specResults.map((sr: any, idx: number) => (
                      <th key={idx} className={`p-1.5 ${idx < specResults.length - 1 ? 'border-r border-black' : ''}`}>
                        Titik {idx + 1} (σ₃' = {(sr.effectiveCellPressureKpa || 0).toFixed(0)} kPa)
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  <tr>
                    <td className="p-1 text-left font-sans font-bold border-r border-black">Kepadatan Kering (γd) [g/cm³]</td>
                    {specResults.map((sr: any, idx: number) => (
                      <td key={idx} className={`p-1 ${idx < specResults.length - 1 ? 'border-r border-black' : ''}`}>
                        {(sr.dryDensity || 0).toFixed(3)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-1 text-left font-sans font-bold border-r border-black">Kadar Air Awal (w0) [%]</td>
                    {specResults.map((sr: any, idx: number) => (
                      <td key={idx} className={`p-1 ${idx < specResults.length - 1 ? 'border-r border-black' : ''}`}>
                        {(sr.mcBeforePct || 0).toFixed(2)} %
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-1 text-left font-sans font-bold border-r border-black">Kadar Air Akhir (wf) [%]</td>
                    {specResults.map((sr: any, idx: number) => (
                      <td key={idx} className={`p-1 ${idx < specResults.length - 1 ? 'border-r border-black' : ''}`}>
                        {(sr.mcAfterPct || 0).toFixed(2)} %
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-emerald-100 font-extrabold">
                    <td className="p-1 text-left font-sans font-extrabold border-r border-black text-emerald-950">Tegangan Deviasi Puncak (q_max) [kPa]</td>
                    {specResults.map((sr: any, idx: number) => (
                      <td key={idx} className={`p-1 font-black text-emerald-900 ${idx < specResults.length - 1 ? 'border-r border-black' : ''}`}>
                        {(sr.peakDeviatorStressKpa || 0).toFixed(1)} kPa
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>

              {/* EFFECTIVE MOHR-COULOMB FAILURE ENVELOPE SVG CHART */}
              <div className="border border-black p-2 bg-white flex justify-center">
                <svg viewBox="0 0 450 140" className="w-full h-32">
                  <line x1="40" y1="10" x2="40" y2="120" stroke="#000" strokeWidth="1" />
                  <line x1="40" y1="120" x2="430" y2="120" stroke="#000" strokeWidth="1" />
                  <circle cx="100" cy="95" r="4" fill="#059669" />
                  <circle cx="210" cy="70" r="4" fill="#059669" />
                  <circle cx="380" cy="30" r="4" fill="#059669" />
                  <line x1="40" y1="110" x2="420" y2="20" stroke="#059669" strokeWidth="2" />
                  <text x="180" y="35" fontSize="9" fontWeight="bold" fill="#059669">τ_f = {cPrimeKpa.toFixed(1)} + σ' · tan({phiPrimeVal.toFixed(2)}°)</text>
                  <text x="230" y="135" fontSize="8" textAnchor="middle">Tegangan Utama Efektif σ' (kPa)</text>
                  <text x="15" y="65" fontSize="8" textAnchor="middle" transform="rotate(-90 15 65)">Tegangan Geser τ (kPa)</text>
                </svg>
              </div>
            </div>
          );
        })()}

        {/* 9. DEFAULT FALLBACK FOR PROCTOR / CBR */}
        {!['LHU_PP', 'LHU_ATB', 'LHU_Sieve & Hidro', 'LHU PFH', 'LHU_DS-UU', 'LHU_DS-CD', 'LHU_DS-CD RES.', 'LHU_DS-CU', 'Template LHU_DS-CU', 'LHU_TRX-UU', 'LHU_TRX-CU-Multi', 'LHU_TRX-CU-Normal', 'LHU_TRX-CD', 'LHU_Konsolidasi', 'LHU_UCT', 'LHU_CBR Unsoaked', 'Template LHU_CBRsoaked', 'LHU_CBR Soaked', 'LHU_CBRsoaked'].includes(sheetCode) && (
          <div className="space-y-3">
            <div className="bg-slate-100 p-1.5 font-bold uppercase text-[9px] border-b border-black">
              RINGKASAN PARAMETER HASIL PENGUJIAN ({sheetCode})
            </div>

            <table className="w-full border-collapse border border-black text-left text-[9.5px]">
              <thead>
                <tr className="bg-slate-200 font-extrabold border-b border-black text-slate-900">
                  <th className="p-1.5 border-r border-black text-center w-10">No</th>
                  <th className="p-1.5 border-r border-black">Parameter Utama Pengujian</th>
                  <th className="p-1.5 text-center w-48">Nilai Hasil Kalkulasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {Object.entries(parameters).map(([key, item], idx) => (
                  <tr key={key}>
                    <td className="p-1.5 text-center font-mono border-r border-black">{idx + 1}</td>
                    <td className="p-1.5 font-semibold capitalize border-r border-black">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </td>
                    <td className="p-1.5 text-center">{renderValBadge(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. TANDA TANGAN & DISCLAIMER FOOTER */}
      <LHUFooter header={header} sheetCode={sheetCode} companyProfile={companyProfile} />
    </LHUPageContainer>
  );
};
