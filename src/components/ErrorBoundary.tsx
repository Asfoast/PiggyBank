import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PiggyBank uncaught render error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => caches.delete(key));
        });
      }
    } catch (e) {
      console.warn('Storage clear error:', e);
    }
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h1 className="text-lg font-bold text-slate-900">
              Un problème est survenu
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Une erreur inattendue est survenue lors du chargement de l'application.
            </p>
            {this.state.error && (
              <div className="bg-slate-100 p-3 rounded-xl text-[11px] font-mono text-slate-700 text-left overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Recharger l'application
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                Réinitialiser le cache local
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
