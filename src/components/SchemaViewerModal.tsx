import React from 'react';
import { Database, X, Code, CheckCircle2, FileJson } from 'lucide-react';

interface SchemaViewerModalProps {
  onClose: () => void;
}

export const SchemaViewerModal: React.FC<SchemaViewerModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Arsitektur Skema Database Standar Form Lab</h3>
              <p className="text-xs text-slate-400">PostgreSQL / SQLite DDL & JSONB Schema (Matching Form PO-GQT-19)</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-cyan-300">Prinsip Rancangan Skema Berita Acara & Laporan Lab</div>
              <p className="text-slate-300">
                Skema telah disesuaikan 100% dengan kebutuhan formulir pengujian tanah: mencakup nomor PO (Job Number), alamat client, lokasi proyek, alur tanggal (Datang, List Diterima, Preparasi, Awal Uji, Pelaporan), checked/computed by, ID Lab, lithology, tipe tanah, dan katalog warna 1-19.
              </p>
            </div>
          </div>

          {/* Database DDL SQL View */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              Skema DDL PostgreSQL (Termasuk All Required Fields)
            </h4>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`-- 1. PURCHASE ORDERS / JOB NUMBER
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) UNIQUE NOT NULL, -- Job Number (e.g. PO-GQT-19)
    client_name VARCHAR(255) NOT NULL,    -- Nama Client (e.g. PT Itamatra Nusantara)
    client_address TEXT NOT NULL,         -- Alamat Client (e.g. Ganda Ganda Morowali)
    project_name VARCHAR(255) NOT NULL,   -- Nama Project
    project_location VARCHAR(255),        -- Lokasi Project (e.g. Morowali Utara)
    status VARCHAR(20) DEFAULT 'Running' CHECK (status IN ('Draft', 'Running', 'On Hold', 'Completed')),
    
    -- ALUR TANGGAL ADMINISTRASI & PIC
    sample_arrival_date TIMESTAMPTZ,      -- Tanggal Sampel Datang
    list_received_date TIMESTAMPTZ,       -- Diterima List Uji Tanggal
    preparation_start_date TIMESTAMPTZ,   -- PREPARASI DI MULAI
    testing_start_date TIMESTAMPTZ,       -- Awal Pengujian
    report_date TIMESTAMPTZ,              -- Tanggal Pelaporan
    checked_by VARCHAR(150),              -- Checked By (e.g. AS Sumartadji)
    computed_by VARCHAR(150),             -- Computed By
    place VARCHAR(100) DEFAULT 'Bandung',  -- Tempat/Kota (e.g. Bandung)
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SAMPLES (DETAIL PER KODE SAMPEL & KATALOG WARNA)
CREATE TABLE samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    sample_number VARCHAR(100) NOT NULL,   -- Sample Number (e.g. BH-01 1.5-2.0m)
    report_number VARCHAR(100),            -- Report Number
    id_lab VARCHAR(100) NOT NULL,          -- Id Lab (e.g. LAB-GQT-001)
    depth_start NUMERIC(5,2),
    depth_end NUMERIC(5,2),
    lithology VARCHAR(50),                 -- Lithology (NP, USCS)
    soil_type VARCHAR(150),                -- Soil Type / Tipe Tanah
    colour_code INT CHECK (colour_code BETWEEN 1 AND 19), -- Kode Warna Tanah (1-19)
    colour_name VARCHAR(100),              -- Nama Warna (e.g. Cokelat / Brown)
    sample_type VARCHAR(100) DEFAULT 'Undisturbed Sample / UDS',
    tested_by VARCHAR(150),                -- Tested By / Penguji (Rizki, Noval, Rafly)
    sample_description TEXT,               -- Deskripsi Sampel
    location_tag VARCHAR(100),             -- Rak Cold Room Storage
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SAMPLE TESTS (MONITORING & FUTURE-PROOF CALCULATION SLOTS)
CREATE TABLE sample_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id UUID REFERENCES samples(id) ON DELETE CASCADE,
    test_type_id UUID REFERENCES test_types(id),
    technician_name VARCHAR(150),
    status VARCHAR(30) DEFAULT 'Belum Diuji',
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    estimated_duration_hours NUMERIC(6,2) NOT NULL,
    calculation_status VARCHAR(30) DEFAULT 'Not Started',
    calculation_data JSONB DEFAULT '{}'::jsonb,
    calculation_summary JSONB DEFAULT '{}'::jsonb
);`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs"
          >
            Tutup Preview Skema
          </button>
        </div>
      </div>
    </div>
  );
};
