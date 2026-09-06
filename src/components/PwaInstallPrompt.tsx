import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare, Check } from 'lucide-react';

interface PwaInstallPromptProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const PwaInstallPrompt: React.FC<PwaInstallPromptProps> = ({
  isOpen = false,
  onClose,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isRunningStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture Chrome/Android install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Auto-show banner after 2 seconds if not standalone
      if (!isRunningStandalone) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also show banner on iOS if not installed
    if (isIosDevice && !isRunningStandalone) {
      const dismissed = sessionStorage.getItem('piggybank_install_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowBanner(false);
        if (onClose) onClose();
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('piggybank_install_dismissed', 'true');
    if (onClose) onClose();
  };

  if (isStandalone) return null;
  if (!isOpen && !showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/icon.png"
              alt="PiggyBank Pixel Art"
              className="w-10 h-10 rounded-xl shadow-md border border-slate-700 bg-pink-100 p-0.5 object-cover"
            />
            <div>
              <h4 className="font-bold text-sm text-white flex items-center">
                <span>Installer PiggyBank</span>
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  App Mobile
                </span>
              </h4>
              <p className="text-xs text-slate-300">
                Ajoutez l'application sur votre écran d'accueil pour l'ouvrir en plein écran
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instructions depending on OS */}
        {isIOS ? (
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-2 text-xs text-slate-200">
            <p className="font-semibold text-emerald-400 flex items-center">
              <Smartphone className="w-3.5 h-3.5 mr-1" />
              Installation sur iPhone / iPad :
            </p>
            <div className="space-y-1.5 text-[11px] text-slate-300 pl-1">
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                <span>Appuyez sur le bouton <strong>Partager</strong> en bas de Safari</span>
                <Share className="w-3.5 h-3.5 text-sky-400 inline ml-1" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                <span>Faites défiler et choisissez <strong>Sur l'écran d'accueil</strong></span>
                <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline ml-1" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              Fonctionne hors-ligne et s'ouvre comme une vraie appli
            </span>
            <button
              onClick={handleInstallClick}
              disabled={!deferredPrompt}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Installer l'app</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
