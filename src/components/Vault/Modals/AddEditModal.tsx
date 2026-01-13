import React, { useState, useEffect } from 'react';
import { X, Globe, CreditCard, StickyNote, FileText, Folder, Calendar, User, Shield, Lock, Plus, Paperclip, Download } from 'lucide-react';
import { Credential, Category, Language, Attachment, GeneratorSettings } from '../../../types';
import { TRANSLATIONS, convertFileToBase64, generatePasswordFromSettings, downloadAttachment } from '../../../utils';
import { validateURL } from '../../../utils/validation';

interface AddEditModalProps {
    editingId: string | null;
    initialData?: Credential;
    categories: Category[];
    onClose: () => void;
    onAdd: (cred: Omit<Credential, 'id' | 'updatedAt'>) => void;
    onUpdate: (id: string, updates: Partial<Credential>) => void;
    lang: Language;
    generatorSettings: GeneratorSettings;
    mode?: 'VAULT' | 'DOCUMENTS';
}

const AddEditModal: React.FC<AddEditModalProps> = ({
    editingId, initialData, categories, onClose, onAdd, onUpdate, lang, generatorSettings, mode
}) => {
    const t = TRANSLATIONS[lang];
    const [activeTab, setActiveTab] = useState<'LOGIN' | 'CARD' | 'NOTE' | 'DOCUMENT'>(mode === 'DOCUMENTS' ? 'DOCUMENT' : 'LOGIN');

    // Form States
    const [newSite, setNewSite] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newAlias, setNewAlias] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [targetCategory, setTargetCategory] = useState('General');
    const [bankName, setBankName] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [docDescription, setDocDescription] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [attachmentError, setAttachmentError] = useState('');
    const [newTotpSecret, setNewTotpSecret] = useState('');
    const [newCustomFields, setNewCustomFields] = useState<{ label: string; value: string }[]>([]);
    const [siteNameError, setSiteNameError] = useState<string | null>(null);

    useEffect(() => {
        if (editingId && initialData) {
            setActiveTab(initialData.type || 'LOGIN');
            setTargetCategory(initialData.category);
            setAttachments(initialData.attachments || []);
            setNewTotpSecret(initialData.totpSecret || '');
            setNewCustomFields(initialData.customFields || []);

            if (initialData.type === 'CARD') {
                setBankName(initialData.siteName);
                setCardHolder(initialData.cardHolder || '');
                setCardNumber(initialData.cardNumber || '');
                setExpiry(initialData.expiry || '');
                setCvv(initialData.cvv || '');
            } else if (initialData.type === 'NOTE') {
                setNoteTitle(initialData.siteName);
                setNoteContent(initialData.notes || '');
            } else if (initialData.type === 'DOCUMENT') {
                setNoteTitle(initialData.siteName);
                setDocDescription(initialData.notes || '');
            } else {
                setNewSite(initialData.siteName);
                setNewUsername(initialData.username || '');
                setNewAlias(initialData.alias || '');
                setNewPassword(initialData.passwordValue || '');
            }
        }
    }, [editingId, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const commonData = { category: targetCategory, attachments, totpSecret: newTotpSecret, customFields: newCustomFields };
        let specificData: any = {};

        if (activeTab === 'LOGIN') {
            specificData = { type: 'LOGIN', siteName: newSite, username: newUsername, alias: newAlias, passwordValue: newPassword };
        } else if (activeTab === 'CARD') {
            specificData = { type: 'CARD', siteName: bankName, cardHolder, cardNumber, expiry, cvv };
        } else if (activeTab === 'NOTE') {
            specificData = { type: 'NOTE', siteName: noteTitle, notes: noteContent };
        } else if (activeTab === 'DOCUMENT') {
            specificData = { type: 'DOCUMENT', siteName: noteTitle, notes: docDescription };
        }

        if (editingId) {
            onUpdate(editingId, { ...commonData, ...specificData });
        } else {
            onAdd({ ...commonData, ...specificData });
        }
        onClose();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        if (file.size > 5 * 1024 * 1024) { setAttachmentError(t.fileTooLarge); return; }
        setAttachmentError('');
        try {
            const base64Data = await convertFileToBase64(file);
            const newAttachment: Attachment = { id: Math.random().toString(36).substring(2, 9), name: file.name, type: file.type, size: file.size, data: base64Data, uploadedAt: Date.now() };
            setAttachments(prev => [...prev, newAttachment]);
        } catch (err) { setAttachmentError('File read error'); }
        e.target.value = '';
    };

    const generateRandomForInput = () => { setNewPassword(generatePasswordFromSettings(generatorSettings)); };

    const formatCardNumber = (val: string) => {
        const digits = val.replace(/\D/g, '');
        const groups = [];
        for (let i = 0; i < digits.length; i += 4) { groups.push(digits.slice(i, i + 4)); }
        return groups.join(' ');
    };

    const handleCardInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCardNumber(e.target.value);
        if (formatted.length <= 19) { setCardNumber(formatted); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-6" onMouseDown={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-0 w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex border-b border-slate-200 dark:border-slate-800">
                    <button type="button" onClick={() => !editingId && setActiveTab('LOGIN')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center space-x-2 transition-colors ${activeTab === 'LOGIN' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500 dark:bg-blue-600/10 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:text-slate-300 dark:hover:bg-slate-800/50'} ${editingId ? 'cursor-default opacity-50' : ''}`}><Globe className="w-4 h-4" /><span>{t.tabLogin}</span></button>
                    <button type="button" onClick={() => !editingId && setActiveTab('CARD')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center space-x-2 transition-colors ${activeTab === 'CARD' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-500 dark:bg-indigo-600/10 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:text-slate-300 dark:hover:bg-slate-800/50'} ${editingId ? 'cursor-default opacity-50' : ''}`}><CreditCard className="w-4 h-4" /><span>{t.tabCard}</span></button>
                    <button type="button" onClick={() => !editingId && setActiveTab('NOTE')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center space-x-2 transition-colors ${activeTab === 'NOTE' ? 'bg-amber-50 text-amber-600 border-b-2 border-amber-500 dark:bg-amber-600/10 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:text-slate-300 dark:hover:bg-slate-800/50'} ${editingId ? 'cursor-default opacity-50' : ''}`}><StickyNote className="w-4 h-4" /><span>{t.tabNote}</span></button>
                    <button type="button" onClick={() => !editingId && setActiveTab('DOCUMENT')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center space-x-2 transition-colors ${activeTab === 'DOCUMENT' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500 dark:bg-blue-600/10 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:text-slate-300 dark:hover:bg-slate-800/50'} ${editingId ? 'cursor-default opacity-50' : ''}`}><FileText className="w-4 h-4" /><span>{t.documents}</span></button>
                </div>
                <div className="p-8 relative">
                    <button type="button" onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white p-2">✕</button>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{editingId ? t.editAccount : t.addAccount}</h3>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div><label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 ml-1">{t.selectCategory}</label><div className="relative"><Folder className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" /><select value={targetCategory} onChange={(e) => setTargetCategory(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-base text-slate-900 dark:text-white focus:border-blue-600 outline-none transition-colors appearance-none">{categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}</select></div></div>

                        {activeTab === 'LOGIN' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 ml-1">{t.siteName}</label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                                        <input
                                            type="text"
                                            required
                                            data-testid="site-name-input"
                                            value={newSite}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setNewSite(val);
                                                if (val.startsWith('http') || val.startsWith('www.')) {
                                                    const res = validateURL(val);
                                                    setSiteNameError(res.isValid ? null : 'Invalid URL format');
                                                } else {
                                                    setSiteNameError(null);
                                                }
                                            }}
                                            className={`w-full pl-12 bg-slate-50 dark:bg-slate-950 border ${siteNameError ? 'border-red-500' : 'border-slate-300 dark:border-slate-800'} rounded-xl py-3 text-base text-slate-900 dark:text-white focus:border-blue-600 outline-none transition-colors select-text cursor-text`}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            placeholder={t.placeholderSiteName}
                                        />
                                    </div>
                                    {siteNameError && <p className="text-xs text-red-500 mt-1 ml-1">{siteNameError}</p>}
                                </div>
                                <div><label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 ml-1">{t.username}</label><input type="text" required value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full px-4 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl py-3 text-base text-slate-900 dark:text-white focus:border-blue-600 outline-none transition-colors select-text cursor-text" onMouseDown={(e) => e.stopPropagation()} placeholder={t.placeholderUsername} /></div>
                                <div><label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 ml-1">{t.alias}</label><input type="text" value={newAlias} onChange={(e) => setNewAlias(e.target.value)} className="w-full px-4 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl py-3 text-base text-slate-900 dark:text-white focus:border-blue-600 outline-none transition-colors select-text cursor-text" onMouseDown={(e) => e.stopPropagation()} placeholder={t.placeholderAlias} /></div>
                                <div><label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 ml-1">{t.password}</label><div className="relative"><input type="text" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl py-3 text-base text-slate-900 dark:text-white focus:border-blue-600 font-mono outline-none transition-colors select-text cursor-text" onMouseDown={(e) => e.stopPropagation()} /><button type="button" onClick={generateRandomForInput} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 px-3 py-1.5 rounded text-blue-600 dark:text-blue-400 transition-colors">{t.random}</button></div></div>
                            </>
                        )}
                        {activeTab === 'CARD' && (
                            <>
                                <div><label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 ml-1">{t.bankName}</label><div className="relative"><CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" /><input type="text" required value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full pl-12 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl py-3 text-base text-slate-900 dark:text-white focus:border-indigo-600 outline-none transition-colors select-text cursor-text" onMouseDown={(e) => e.stopPropagation()} placeholder={t.placeholderBankName} /></div></div>
                                <div><label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 ml-1">{t.cardHolder}</label><div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" /><input type="text" required value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} className="w-full pl-12 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl py-3 text-base text-slate-900 dark:text-white focus:border-indigo-600 outline-none transition-colors select-text cursor-text" onMouseDown={(e) => e.stopPropagation()} placeholder={t.placeholderCardHolder} /></div></div>
                                <div><label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 ml-1">{t.cardNumber}</label><input type="text" required value={cardNumber} onChange={handleCardInput} className="w-full px-4 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl py-3 text-lg font-mono text-slate-900 dark:text-white focus:border-indigo-600 outline-none transition-colors tracking-widest placeholder:tracking-normal select-text cursor-text" onMouseDown={(e) => e.stopPropagation()} placeholder="0000 0000 0000 0000" /></div>
                                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 ml-1">{t.expiry}</label><div className="relative"><Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" /><input type="text" required value={expiry} onChange={(e) => setExpiry(e.target.value)} maxLength={5} className="w-full pl-10 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl py-3 text-base text-slate-900 dark:text-white focus:border-indigo-600 outline-none transition-colors text-center select-text cursor-text" onMouseDown={(e) => e.stopPropagation()} placeholder={t.placeholderExpiry} /></div></div><div><label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 ml-1">{t.cvv}</label><div className="relative"><Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" /><input type="text" required value={cvv} onChange={(e) => setCvv(e.target.value)} maxLength={4} className="w-full pl-10 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl py-3 text-base text-slate-900 dark:text-white focus:border-indigo-600 outline-none transition-colors text-center select-text cursor-text" onMouseDown={(e) => e.stopPropagation()} placeholder="123" /></div></div></div>
                            </>
                        )}
                        {activeTab === 'NOTE' && (
                            <>
                                <div><label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 ml-1">{t.noteTitle}</label><div className="relative"><StickyNote className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" /><input type="text" required value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} className="w-full pl-12 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl py-3 text-base text-slate-900 dark:text-white focus:border-amber-600 outline-none transition-colors select-text cursor-text" onMouseDown={(e) => e.stopPropagation()} placeholder={t.placeholderNoteTitle} /></div></div>
                                <div><label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 ml-1">{t.noteContent}</label><textarea required value={noteContent} onChange={(e) => setNoteContent(e.target.value)} className="w-full px-4 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl py-3 text-base text-slate-900 dark:text-white focus:border-amber-600 outline-none transition-colors h-40 resize-none custom-scrollbar select-text cursor-text" onMouseDown={(e) => e.stopPropagation()} placeholder="..." /></div>
                            </>
                        )}
                        {activeTab === 'DOCUMENT' && (
                            <>
                                <div><label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 ml-1">{t.docTitle}</label><div className="relative"><FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" /><input type="text" required value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} className="w-full pl-12 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl py-3 text-base text-slate-900 dark:text-white focus:border-blue-600 outline-none transition-colors select-text cursor-text" onMouseDown={(e) => e.stopPropagation()} placeholder={t.docTitle} /></div></div>
                                <div><label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 ml-1">{t.docDesc}</label><textarea value={docDescription} onChange={(e) => setDocDescription(e.target.value)} className="w-full px-4 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl py-3 text-base text-slate-900 dark:text-white focus:border-blue-600 outline-none transition-colors h-32 resize-none custom-scrollbar select-text cursor-text" onMouseDown={(e) => e.stopPropagation()} placeholder={t.docDesc} /></div>
                            </>
                        )}

                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> {t.advancedFeatures}</h4>
                            {(activeTab === 'LOGIN') && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 ml-1">TOTP Secret (Base32)</label>
                                    <input type="text" value={newTotpSecret} onChange={(e) => setNewTotpSecret(e.target.value)} className="w-full px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:border-blue-500 outline-none" placeholder="JBSWY3DPEHPK3PXP" />
                                </div>
                            )}
                            <div className="space-y-3">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1">{t.customFields}</label>
                                {newCustomFields.map((field, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <input type="text" placeholder="Label" value={field.label} onChange={(e) => { const updated = [...newCustomFields]; updated[idx].label = e.target.value; setNewCustomFields(updated); }} className="flex-1 min-w-0 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 outline-none" />
                                        <input type="text" placeholder="Value" value={field.value} onChange={(e) => { const updated = [...newCustomFields]; updated[idx].value = e.target.value; setNewCustomFields(updated); }} className="flex-1 min-w-0 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 outline-none" />
                                        <button type="button" onClick={() => setNewCustomFields(prev => prev.filter((_, i) => i !== idx))} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex-shrink-0"><X className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => setNewCustomFields(prev => [...prev, { label: '', value: '' }])} className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 hover:text-blue-500 hover:border-blue-500 transition-colors flex items-center justify-center gap-2"><Plus className="w-3.5 h-3.5" /> {t.addCustomField}</button>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{t.attachments}</label>
                            {attachments.length > 0 && (<div className="space-y-2 mb-3">{attachments.map(att => (<div key={att.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800"><div className="flex items-center space-x-2 overflow-hidden"><div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded flex items-center justify-center text-slate-500 flex-shrink-0">{att.type.startsWith('image/') ? <img src={att.data} alt="thumb" className="w-full h-full object-cover rounded" /> : <FileText className="w-4 h-4" />}</div><span className="text-xs text-slate-600 dark:text-slate-300 truncate">{att.name}</span></div><div className="flex items-center gap-1"><button type="button" onClick={(e) => { e.preventDefault(); downloadAttachment(att.data, att.name, att.type); }} className="text-blue-400 hover:text-blue-500 p-1" title={t.download}><Download className="w-4 h-4" /></button><button type="button" onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="text-red-400 hover:text-red-500 p-1"><X className="w-4 h-4" /></button></div></div>))}</div>)}
                            <label className="flex items-center justify-center w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group"><input type="file" className="hidden" onChange={handleFileUpload} /><div className="flex flex-col items-center"><div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors"><Paperclip className="w-4 h-4" /><span className="text-sm font-medium">{t.addFile}</span></div><span className="text-[10px] text-slate-400 mt-1">{t.fileSizeLimit}</span></div></label>
                            {attachmentError && <p className="text-xs text-red-500 mt-1">{attachmentError}</p>}
                        </div>

                        <button type="submit" className={`w-full py-4 text-white rounded-xl text-base font-semibold transition-colors shadow-lg mt-4 ${activeTab === 'LOGIN' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30' : activeTab === 'CARD' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/30' : activeTab === 'NOTE' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/30' : 'bg-blue-700 hover:bg-blue-600 shadow-blue-900/40'}`}>{editingId ? t.updateBtn : t.save}</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddEditModal;
