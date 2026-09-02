import React, { useState } from 'react';
import { DocumentItem } from '../types';
import { formatBytes, formatDate } from '../utils/helpers';
import { 
  Folder, 
  FolderPlus, 
  FileText, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  File, 
  Upload, 
  Grid, 
  List, 
  Search, 
  ChevronRight, 
  Download, 
  Trash2, 
  Edit2, 
  Eye, 
  Scissors, 
  Copy, 
  Clipboard, 
  ArrowLeft,
  X,
  HardDrive,
  FolderTree,
  FileCheck
} from 'lucide-react';

interface FileExplorerViewProps {
  documents: DocumentItem[];
  onAddFolder: (name: string, parentId: string | null, poId?: string) => void;
  onAddFile: (file: File, parentId: string | null, poId?: string) => void;
  onRenameItem: (id: string, newName: string) => void;
  onDeleteItem: (id: string) => void;
  onMoveItem: (id: string, targetParentId: string | null) => void;
}

export const FileExplorerView: React.FC<FileExplorerViewProps> = ({
  documents,
  onAddFolder,
  onAddFile,
  onRenameItem,
  onDeleteItem,
  onMoveItem
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>('f-2026');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [clipboardItem, setClipboardItem] = useState<{ id: string; action: 'cut' | 'copy' } | null>(null);

  // Modals state
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [renameModalItem, setRenameModalItem] = useState<DocumentItem | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const [previewItem, setPreviewItem] = useState<DocumentItem | null>(null);

  // Helper to get breadcrumb path
  const getBreadcrumbs = () => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: 'Root Explorer' }];
    let curr = documents.find(d => d.id === currentFolderId);
    const stack: { id: string; name: string }[] = [];
    while (curr) {
      stack.unshift({ id: curr.id, name: curr.name });
      curr = documents.find(d => d.id === curr?.parentId);
    }
    return [...crumbs, ...stack];
  };

  // Get current folder items
  const currentFolder = documents.find(d => d.id === currentFolderId);
  const currentItems = documents.filter(d => {
    const matchesParent = searchQuery ? true : d.parentId === currentFolderId;
    const matchesSearch = searchQuery ? d.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchesParent && matchesSearch;
  });

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onAddFolder(newFolderName.trim(), currentFolderId, currentFolder?.poId);
    setNewFolderName('');
    setIsNewFolderModalOpen(false);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameModalItem || !renameInput.trim()) return;
    onRenameItem(renameModalItem.id, renameInput.trim());
    setRenameModalItem(null);
  };

  const handleFileUploadSimulated = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      onAddFile(file, currentFolderId, currentFolder?.poId);
    });
  };

  const handlePaste = () => {
    if (!clipboardItem) return;
    onMoveItem(clipboardItem.id, currentFolderId);
    setClipboardItem(null);
  };

  const renderFileIcon = (doc: DocumentItem) => {
    if (doc.type === 'folder') return <Folder className="w-8 h-8 text-amber-400 fill-amber-400/20" />;
    const ext = doc.fileExtension?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-8 h-8 text-red-400" />;
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return <FileSpreadsheet className="w-8 h-8 text-emerald-400" />;
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') return <ImageIcon className="w-8 h-8 text-cyan-400" />;
    return <File className="w-8 h-8 text-slate-400" />;
  };

  return (
    <div className="w-full max-w-full p-3 sm:p-3.5 space-y-3 font-sans bg-slate-950/40 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-3.5 rounded-xl border border-slate-800/90 shadow-xl relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-800 text-[10px] font-black uppercase tracking-wider">
              Project Document Repository
            </span>
            <span className="text-slate-400 font-mono text-xs">• Windows 11 Enterprise GUI</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <FolderTree className="w-6 h-6 text-emerald-400" />
            <span>Windows File Explorer (Manajemen Berkas Project)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manajemen dokumen, surat berita acara, log pengujian, dan draft laporan PO dalam struktur folder hierarkis.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-right space-y-0.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Item Repository</div>
            <div className="text-sm font-black font-mono text-emerald-400">{documents.length} Berkas &amp; Folder</div>
          </div>
        </div>
      </div>

      {/* WINDOWS EXPLORER CONTAINER GUI (MAXIMIZED FULL WIDTH & DYNAMIC HEIGHT) */}
      <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[calc(100vh-170px)] w-full">
        {/* EXPLORER TOP TOOLBAR */}
        <div className="bg-slate-950 p-3.5 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Action Tools */}
          <div className="flex items-center gap-2">
            <label className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold flex items-center gap-1.5 cursor-pointer transition shadow-md shadow-emerald-950">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Berkas</span>
              <input type="file" multiple className="hidden" onChange={handleFileUploadSimulated} />
            </label>

            <button
              onClick={() => setIsNewFolderModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>Folder Baru</span>
            </button>

            {clipboardItem && (
              <button
                onClick={handlePaste}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 font-bold flex items-center gap-1.5 transition animate-pulse cursor-pointer"
              >
                <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
                <span>Paste Ke Sini</span>
              </button>
            )}
          </div>

          {/* Search & View Mode Switcher */}
          <div className="flex items-center gap-3">
            <div className="relative w-56 sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berkas / folder..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900/90 text-slate-200 rounded-xl border border-slate-700/80 focus:outline-none focus:border-emerald-500 text-xs font-semibold"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'grid' ? 'bg-slate-800 text-emerald-400 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'list' ? 'bg-slate-800 text-emerald-400 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* BREADCRUMB ADDRESS BAR */}
        <div className="bg-slate-950/70 px-4 py-2 border-b border-slate-800/90 flex items-center gap-2 text-xs overflow-x-auto">
          {currentFolderId && (
            <button
              onClick={() => {
                const parent = documents.find(d => d.id === currentFolderId)?.parentId;
                setCurrentFolderId(parent || null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 mr-1 transition cursor-pointer"
              title="Ke Folder Atas"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-1.5 text-slate-400">
            <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
            {getBreadcrumbs().map((crumb, idx, arr) => (
              <React.Fragment key={crumb.id || 'root'}>
                <button
                  onClick={() => setCurrentFolderId(crumb.id)}
                  className={`hover:underline font-mono text-xs cursor-pointer ${
                    idx === arr.length - 1 ? 'text-white font-extrabold' : 'text-slate-400 font-semibold'
                  }`}
                >
                  {crumb.name}
                </button>
                {idx < arr.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* MAIN EXPLORER CONTENT (EXPANDED SIDEBAR TREE + EXPANDED MAIN PANEL) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar Directory Tree (Expanded to w-64 / w-72) */}
          <div className="w-64 sm:w-72 bg-slate-950/80 border-r border-slate-800/90 p-3.5 overflow-y-auto hidden md:block space-y-1.5 text-xs shrink-0">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 px-1">
              Struktur Direktori Folder
            </div>
            
            <button
              onClick={() => setCurrentFolderId(null)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                currentFolderId === null ? 'bg-emerald-950/80 text-emerald-300 font-extrabold border border-emerald-800/80 shadow-md' : 'text-slate-400 hover:bg-slate-900/90 hover:text-slate-200'
              }`}
            >
              <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">Root Explorer</span>
            </button>

            {(() => {
              const uniqueFolders = documents
                .filter(d => d.type === 'folder')
                .reduce<DocumentItem[]>((acc, current) => {
                  const normCurrent = (current.name || '').trim().toLowerCase();
                  const isDup = acc.some(item =>
                    item.id === current.id ||
                    (item.name || '').trim().toLowerCase() === normCurrent ||
                    (item.poId && current.poId && item.poId === current.poId)
                  );
                  if (!isDup) acc.push(current);
                  return acc;
                }, []);

              return uniqueFolders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setCurrentFolderId(folder.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left transition cursor-pointer truncate ${
                    currentFolderId === folder.id ? 'bg-slate-800 text-emerald-400 font-extrabold border border-slate-700 shadow-md' : 'text-slate-400 hover:bg-slate-900/90 hover:text-slate-200'
                  }`}
                  style={{ paddingLeft: folder.parentId ? '1.75rem' : '0.625rem' }}
                >
                  <Folder className="w-4 h-4 text-amber-400 shrink-0 fill-amber-400/20" />
                  <span className="truncate">{folder.name}</span>
                </button>
              ));
            })()}
          </div>

          {/* Main Files View (Expanded Grid Columns) */}
          <div className="flex-1 p-5 overflow-y-auto bg-slate-900/40">
            {currentItems.length === 0 ? (
              <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-slate-500 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center shadow-lg">
                  <Folder className="w-8 h-8 stroke-[1.5] text-slate-500" />
                </div>
                <div className="text-sm font-extrabold text-slate-300">Folder ini masih kosong</div>
                <p className="text-xs text-slate-500 max-w-sm text-center">Gunakan tombol "Upload Berkas" atau "Folder Baru" di atas untuk menambahkan dokumen project.</p>
              </div>
            ) : viewMode === 'grid' ? (
              /* EXPANDED GRID VIEW (Up to 8-10 cols on wide screens!) */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9 gap-3.5">
                {currentItems.map(doc => (
                  <div
                    key={doc.id}
                    onDoubleClick={() => {
                      if (doc.type === 'folder') setCurrentFolderId(doc.id);
                      else setPreviewItem(doc);
                    }}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-800/60 transition group relative flex flex-col items-center text-center cursor-pointer select-none"
                  >
                    <div className="mb-2 p-2 rounded-lg bg-slate-900/80 group-hover:scale-110 transition-transform">
                      {renderFileIcon(doc)}
                    </div>
                    <span className="text-xs font-medium text-slate-200 w-full truncate" title={doc.name}>
                      {doc.name}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      {doc.type === 'folder' ? 'Folder' : formatBytes(doc.fileSize)}
                    </span>

                    {/* Quick Action Overlay on Hover */}
                    <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 bg-slate-900/90 backdrop-blur p-1 rounded-lg border border-slate-700 shadow-lg">
                      {doc.type === 'file' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setPreviewItem(doc); }}
                          className="p-1 text-slate-300 hover:text-emerald-400"
                          title="Preview File"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setClipboardItem({ id: doc.id, action: 'cut' }); }}
                        className="p-1 text-slate-300 hover:text-cyan-400"
                        title="Cut (Move)"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setRenameModalItem(doc); setRenameInput(doc.name); }}
                        className="p-1 text-slate-300 hover:text-amber-400"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteItem(doc.id); }}
                        className="p-1 text-slate-300 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Nama Berkas / Folder</th>
                      <th className="py-2.5 px-3">Tipe</th>
                      <th className="py-2.5 px-3">Ukuran</th>
                      <th className="py-2.5 px-3">Tanggal Modifikasi</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {currentItems.map(doc => (
                      <tr 
                        key={doc.id}
                        onDoubleClick={() => {
                          if (doc.type === 'folder') setCurrentFolderId(doc.id);
                          else setPreviewItem(doc);
                        }}
                        className="hover:bg-slate-800/50 transition cursor-pointer"
                      >
                        <td className="py-2.5 px-3 flex items-center gap-2.5 font-medium text-slate-200">
                          {renderFileIcon(doc)}
                          <span>{doc.name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {doc.type === 'folder' ? 'Folder' : doc.fileExtension?.toUpperCase() || 'File'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono">
                          {doc.type === 'folder' ? '-' : formatBytes(doc.fileSize)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {formatDate(doc.updatedAt)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {doc.type === 'file' && (
                              <button
                                onClick={() => setPreviewItem(doc)}
                                className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                                title="Preview"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => { setRenameModalItem(doc); setRenameInput(doc.name); }}
                              className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800"
                              title="Rename"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteItem(doc.id)}
                              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: FOLDER BARU */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-400" />
                Buat Folder Baru
              </h3>
              <button onClick={() => setIsNewFolderModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nama Folder</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. 04_Sertifikat_Kalibrasi"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-slate-800 text-slate-200 p-2 rounded-lg border border-slate-700 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewFolderModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Buat Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RENAME */}
      {renameModalItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                Rename Item
              </h3>
              <button onClick={() => setRenameModalItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nama Baru</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  className="w-full bg-slate-800 text-slate-200 p-2 rounded-lg border border-slate-700 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameModalItem(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Simpan Nama
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FILE PREVIEW SIMULATION */}
      {previewItem && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-3xl w-full h-[520px] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {renderFileIcon(previewItem)}
                <div>
                  <h3 className="text-sm font-bold text-white">{previewItem.name}</h3>
                  <p className="text-[10px] text-slate-400">
                    Ukuran: {formatBytes(previewItem.fileSize)} | Modifikasi: {formatDate(previewItem.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`#download-${previewItem.id}`}
                  onClick={(e) => { e.preventDefault(); alert(`Simulasi Download: ${previewItem.name}`); }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Berkas</span>
                </a>
                <button onClick={() => setPreviewItem(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Simulated Content Reader */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-950/80 flex flex-col items-center justify-center text-center space-y-4">
              <FileCheck className="w-16 h-16 text-emerald-400 stroke-1" />
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Preview Dokumen Laboratorium</h4>
                <p className="text-xs text-slate-400 max-w-md">
                  Dokumen <span className="text-slate-200 font-mono font-semibold">{previewItem.name}</span> siap diverifikasi untuk laporan pengujian mekanika tanah.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs space-y-2 w-full max-w-md">
                <div className="flex justify-between border-b border-slate-800 pb-1 text-slate-400">
                  <span>Tipe Mime:</span>
                  <span className="text-slate-200 font-mono">{previewItem.mimeType || 'application/octet-stream'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1 text-slate-400">
                  <span>Status Dokumen:</span>
                  <span className="text-emerald-400 font-semibold">Tersimpan Aman di Server</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Enkripsi Hash:</span>
                  <span className="text-slate-200 font-mono text-[10px]">SHA256: 8f92b4c10aef...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
