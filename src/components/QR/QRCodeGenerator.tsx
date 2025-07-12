import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { 
  DocumentDuplicateIcon as CopyIcon,
  ArrowDownTrayIcon as DownloadIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface QRCodeGeneratorProps {
  data: object;
  title?: string;
  subtitle?: string;
  size?: number;
  className?: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  data,
  title = "QR Code",
  subtitle,
  size = 256,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    generateQRCode();
  }, [data, size]);

  const generateQRCode = async () => {
    if (!canvasRef.current) return;
    
    try {
      setError('');
      const jsonString = JSON.stringify(data);
      
      // Generate QR code on canvas
      await QRCode.toCanvas(canvasRef.current, jsonString, {
        width: size,
        margin: 2,
        color: {
          dark: '#1f2937', // gray-800
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });

      // Also get data URL for download
      const dataUrl = await QRCode.toDataURL(jsonString, {
        width: size,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });
      
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('QR Code generation failed:', err);
      setError('Failed to generate QR code. Data might be too large.');
    }
  };

  const copyToClipboard = async () => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadQRCode = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-qr-code.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <div className={`text-center p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      )}
      {subtitle && (
        <p className="text-sm text-gray-600 mb-4">{subtitle}</p>
      )}
      
      <div className="bg-white p-6 rounded-lg border-2 border-gray-200 inline-block mb-4">
        <canvas 
          ref={canvasRef}
          className="block mx-auto"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      <div className="flex justify-center space-x-3">
        <button
          onClick={copyToClipboard}
          className="btn-secondary flex items-center space-x-2 text-sm"
          title="Copy JSON data"
        >
          {copied ? (
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
          ) : (
            <CopyIcon className="h-4 w-4" />
          )}
          <span>{copied ? 'Copied!' : 'Copy Data'}</span>
        </button>

        <button
          onClick={downloadQRCode}
          className="btn-primary flex items-center space-x-2 text-sm"
          disabled={!qrDataUrl}
          title="Download QR code as PNG"
        >
          <DownloadIcon className="h-4 w-4" />
          <span>Download</span>
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Scan this QR code to share or verify the data
      </div>
    </div>
  );
};

export default QRCodeGenerator;