'use client';

import { useState } from 'react';
import {
    Share2,
    Copy,
    Download,
    FileSpreadsheet,
    FileJson,
    Twitter,
    Linkedin,
    MessageCircle,
    Check,
    X
} from 'lucide-react';
import {
    exportToCSV,
    exportToJSON,
    copyToClipboard,
    shareNative,
    generateShareText,
    type ExportData
} from '@/utils/export';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    stockData?: {
        symbol: string;
        name: string;
        price: number;
        change: number;
        changePercent: number;
        aiSummary?: string;
    };
    exportData?: ExportData;
    title?: string;
}

export default function ShareModal({
    isOpen,
    onClose,
    stockData,
    exportData,
    title = 'Share & Export'
}: ShareModalProps) {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'share' | 'export'>('share');

    if (!isOpen) return null;

    const shareText = stockData
        ? generateShareText(
            stockData.name,
            stockData.price,
            stockData.change,
            stockData.changePercent,
            stockData.aiSummary
        )
        : '';

    const handleCopy = async () => {
        const success = await copyToClipboard(shareText);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleNativeShare = async () => {
        if (stockData) {
            await shareNative(
                `${stockData.name} Analysis`,
                shareText,
                window.location.href
            );
        }
    };

    const handleTwitterShare = () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'width=550,height=420');
    };

    const handleLinkedInShare = () => {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
        window.open(url, '_blank', 'width=550,height=420');
    };

    const handleWhatsAppShare = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank');
    };

    const handleExportCSV = () => {
        if (exportData) {
            exportToCSV(exportData, exportData.title.replace(/\s/g, '_'));
        } else if (stockData) {
            const data: ExportData = {
                title: `${stockData.name} Summary`,
                headers: ['Metric', 'Value'],
                rows: [
                    ['Symbol', stockData.symbol],
                    ['Price', `₹${stockData.price.toFixed(2)}`],
                    ['Change', `${stockData.change >= 0 ? '+' : ''}${stockData.change.toFixed(2)}`],
                    ['Change %', `${stockData.changePercent >= 0 ? '+' : ''}${stockData.changePercent.toFixed(2)}%`],
                ],
                metadata: {
                    'Generated At': new Date().toLocaleString('en-IN'),
                    'Source': 'Artha AI',
                },
            };
            if (stockData.aiSummary) {
                data.rows.push(['AI Summary', stockData.aiSummary]);
            }
            exportToCSV(data, `${stockData.symbol}_summary`);
        }
    };

    const handleExportJSON = () => {
        if (exportData) {
            exportToJSON(exportData, exportData.title.replace(/\s/g, '_'));
        } else if (stockData) {
            exportToJSON(
                {
                    ...stockData,
                    exportedAt: new Date().toISOString(),
                    source: 'Artha AI',
                },
                `${stockData.symbol}_data`
            );
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content share-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="share-tabs">
                    <button
                        className={`share-tab ${activeTab === 'share' ? 'active' : ''}`}
                        onClick={() => setActiveTab('share')}
                    >
                        <Share2 size={16} />
                        Share
                    </button>
                    <button
                        className={`share-tab ${activeTab === 'export' ? 'active' : ''}`}
                        onClick={() => setActiveTab('export')}
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>

                <div className="modal-body">
                    {activeTab === 'share' && (
                        <div className="share-content">
                            {/* Preview */}
                            {shareText && (
                                <div className="share-preview">
                                    <div className="share-preview-text">{shareText}</div>
                                    <button
                                        className={`share-copy-btn ${copied ? 'copied' : ''}`}
                                        onClick={handleCopy}
                                    >
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            )}

                            {/* Share Options */}
                            <div className="share-options">
                                <button className="share-option-btn native" onClick={handleNativeShare}>
                                    <Share2 size={20} />
                                    <span>Share</span>
                                </button>
                                <button className="share-option-btn twitter" onClick={handleTwitterShare}>
                                    <Twitter size={20} />
                                    <span>Twitter</span>
                                </button>
                                <button className="share-option-btn linkedin" onClick={handleLinkedInShare}>
                                    <Linkedin size={20} />
                                    <span>LinkedIn</span>
                                </button>
                                <button className="share-option-btn whatsapp" onClick={handleWhatsAppShare}>
                                    <MessageCircle size={20} />
                                    <span>WhatsApp</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'export' && (
                        <div className="export-content">
                            <div className="export-options">
                                <button className="export-option-btn" onClick={handleExportCSV}>
                                    <FileSpreadsheet size={24} />
                                    <div className="export-option-info">
                                        <span className="export-option-title">CSV Spreadsheet</span>
                                        <span className="export-option-desc">Compatible with Excel, Google Sheets</span>
                                    </div>
                                </button>
                                <button className="export-option-btn" onClick={handleExportJSON}>
                                    <FileJson size={24} />
                                    <div className="export-option-info">
                                        <span className="export-option-title">JSON Data</span>
                                        <span className="export-option-desc">Raw data for developers</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
