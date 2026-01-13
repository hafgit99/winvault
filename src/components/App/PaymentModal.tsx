import React, { useEffect, useRef } from 'react';
import { X, Copy, Mail, AlertTriangle, CreditCard } from 'lucide-react';
import QRCode from 'qrcode';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../utils';

const WALLETS: { [key: string]: string } = {
    'BTC': 'bc1qqsuljwzs32ckkqdrsdus7wgqzuetty3g0x47l7',
    'TRX (TRC20)': 'TQBz3q8Ddjap3K8QdFQHtJKBxbvXMCi62E',
    'BCH': 'qzfd46kp4tguu8pxrs6gnux0qxndhnqk8sa83q08wm',
    'XTZ': 'tz1Tij1ujzkEyvA949x1q7EW17s6pUNbEUdV',
    'ETH (ERC20)': '0x4bd17Cc073D08E3E021Fd315d840554c840843E1',
    'LTC': 'LZC3egqj1K9aZ3i42HbsRWK7m1SbUgXmak',
    'SOL': '81H1rKZHjpSsnr6Epumw9XVTfqAnqSHcTKm7D3VsEd74'
};

interface PaymentModalProps {
    onPaymentNotification: () => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ onPaymentNotification, addToast }) => {
    const { lang, isPaymentModalOpen, setPaymentModalOpen, selectedCoin, setSelectedCoin } = useAppStore();
    const t = TRANSLATIONS[lang];
    const paymentCanvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (isPaymentModalOpen && paymentCanvasRef.current) {
            QRCode.toCanvas(paymentCanvasRef.current, WALLETS[selectedCoin], { width: 200, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
        }
    }, [selectedCoin, isPaymentModalOpen]);

    if (!isPaymentModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-0 w-full max-w-lg shadow-2xl animate-fade-in overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-500" /> {t.cryptoPayment}</h3>
                    <button onClick={() => setPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex gap-4 mb-6 overflow-x-auto pb-2 custom-scrollbar">
                        {Object.keys(WALLETS).map(coin => (
                            <button key={coin} onClick={() => setSelectedCoin(coin)} className={`flex-shrink-0 px-4 py-2 rounded-lg border text-sm font-bold transition-all ${selectedCoin === coin ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                                {coin}
                            </button>
                        ))}
                    </div>

                    <div className="text-center mb-6">
                        <h4 className="text-slate-900 dark:text-white font-bold text-xl mb-2">{t.paymentTitle(selectedCoin)}</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{t.paymentInstruction}</p>
                        <div className="bg-white p-4 rounded-xl inline-block shadow-md mb-4">
                            <canvas ref={paymentCanvasRef} className="w-48 h-48"></canvas>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                            <code className="text-xs font-mono text-slate-800 dark:text-blue-300 break-all text-left select-text cursor-text" onMouseDown={(e) => e.stopPropagation()}>{WALLETS[selectedCoin]}</code>
                            <button onClick={() => { navigator.clipboard.writeText(WALLETS[selectedCoin]); addToast(t.copied, 'info'); }} className="p-2 bg-white dark:bg-slate-700 rounded-lg hover:text-blue-500"><Copy className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-900/50 flex gap-3 items-start mb-6">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-700 dark:text-yellow-200/80">{t.paymentWarning}</p>
                    </div>

                    <button onClick={onPaymentNotification} className="w-full bg-green-600 hover:bg-green-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-900/20">
                        <Mail className="w-5 h-5" /> {t.paymentButton}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
