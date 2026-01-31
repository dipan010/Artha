/**
 * Export Utilities for CSV and PDF generation
 */

export interface ExportData {
    title: string;
    headers: string[];
    rows: (string | number)[][];
    metadata?: Record<string, string>;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: ExportData, filename: string): void {
    const csvContent = generateCSVContent(data);
    downloadFile(csvContent, `${filename}.csv`, 'text/csv');
}

/**
 * Generate CSV content string
 */
export function generateCSVContent(data: ExportData): string {
    const lines: string[] = [];

    // Add title
    lines.push(`"${data.title}"`);
    lines.push('');

    // Add metadata if present
    if (data.metadata) {
        Object.entries(data.metadata).forEach(([key, value]) => {
            lines.push(`"${key}","${value}"`);
        });
        lines.push('');
    }

    // Add headers
    lines.push(data.headers.map(h => `"${h}"`).join(','));

    // Add rows
    data.rows.forEach(row => {
        const escapedRow = row.map(cell => {
            if (typeof cell === 'string') {
                return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell.toString();
        });
        lines.push(escapedRow.join(','));
    });

    return lines.join('\n');
}

/**
 * Export data to JSON format
 */
export function exportToJSON(data: unknown, filename: string): void {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `${filename}.json`, 'application/json');
}

/**
 * Generate shareable text summary
 */
export function generateShareText(
    stockName: string,
    price: number,
    change: number,
    changePercent: number,
    aiSummary?: string
): string {
    const direction = change >= 0 ? '📈' : '📉';
    const sign = change >= 0 ? '+' : '';

    let text = `${direction} ${stockName}\n`;
    text += `Price: ₹${price.toFixed(2)}\n`;
    text += `Change: ${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)\n`;

    if (aiSummary) {
        text += `\n🤖 AI Insight: ${aiSummary}\n`;
    }

    text += `\n📊 Powered by Artha AI`;

    return text;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch {
            document.body.removeChild(textArea);
            return false;
        }
    }
}

/**
 * Share via Web Share API (for mobile)
 */
export async function shareNative(
    title: string,
    text: string,
    url?: string
): Promise<boolean> {
    if (!navigator.share) {
        return false;
    }

    try {
        await navigator.share({ title, text, url });
        return true;
    } catch {
        return false;
    }
}

/**
 * Download file helper
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}

/**
 * Generate image from HTML element (for screenshots)
 */
export async function captureElement(element: HTMLElement): Promise<string | null> {
    try {
        // Use html2canvas if available (would need to be installed)
        // This is a placeholder that creates a simple screenshot URL
        const rect = element.getBoundingClientRect();
        console.log('Capture size:', rect.width, rect.height);
        // Return a data URL placeholder
        return null;
    } catch {
        return null;
    }
}
