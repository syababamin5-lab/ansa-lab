import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 m-6 bg-white rounded-2xl border border-red-200 shadow-lg space-y-4 max-w-2xl mx-auto text-slate-800 font-sans">
          <div className="flex items-center gap-3 text-red-600">
            <div className="p-2.5 bg-red-100 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Terjadi Kesalahan Tampilan (Runtime Exception)</h3>
              <p className="text-xs text-slate-500 font-medium">Sistem menangkap error saat merender komponen ini.</p>
            </div>
          </div>

          <div className="bg-slate-900 text-red-400 p-3 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
            {this.state.error?.toString() || 'Unknown Error'}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">Silakan klik muat ulang di bawah ini untuk memulihkan tampilan.</span>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang Tampilan</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
