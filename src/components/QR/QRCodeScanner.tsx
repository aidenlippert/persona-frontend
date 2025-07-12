import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import {
  CameraIcon,
  StopIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface QRScanResult {
  success: boolean;
  data?: unknown;
  error?: string;
  rawData?: string;
}

interface QRCodeScannerProps {
  onScan: (result: QRScanResult) => void;
  onClose?: () => void;
  className?: string;
  expectedDataSchema?: string[]; // Array of required fields to validate
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  onScan,
  onClose,
  className = "",
  expectedDataSchema = [],
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [lastResult, setLastResult] = useState<QRScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string>('');

  useEffect(() => {
    initializeScanner();
    return () => {
      stopScanning();
    };
  }, []);

  const initializeScanner = async () => {
    if (!videoRef.current) return;

    try {
      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        setHasCamera(false);
        setCameraError('No camera found on this device');
        return;
      }

      // Create scanner instance
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => handleScanSuccess(result.data),
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Back camera on mobile
          maxScansPerSecond: 1, // Slower scanning for better mobile compatibility
          calculateScanRegion: (video) => {
            // Better scan region calculation for mobile
            const smallestDimension = Math.min(video.videoWidth, video.videoHeight);
            const scanRegionSize = Math.round(0.6 * smallestDimension);
            return {
              x: Math.round((video.videoWidth - scanRegionSize) / 2),
              y: Math.round((video.videoHeight - scanRegionSize) / 2),
              width: scanRegionSize,
              height: scanRegionSize,
            };
          },
        }
      );

      setScanner(qrScanner);
    } catch (error) {
      console.error('Scanner initialization failed:', error);
      setCameraError('Failed to access camera. Please check permissions.');
    }
  };

  const handleScanSuccess = (rawData: string) => {
    console.log('🔍 Scanned QR code:', rawData);
    
    try {
      let parsedData;
      
      // Handle different QR code formats
      if (rawData.startsWith('http') || rawData.includes('/scan-verify?data=')) {
        // URL format - extract data parameter
        try {
          const url = new URL(rawData);
          const dataParam = url.searchParams.get('data');
          if (dataParam) {
            parsedData = JSON.parse(decodeURIComponent(dataParam));
          } else {
            throw new Error('No data parameter in URL');
          }
        } catch {
          throw new Error('Invalid URL format in QR code');
        }
      } else {
        // Direct JSON format
        parsedData = JSON.parse(rawData);
      }
      
      // Validate against expected schema if provided
      if (expectedDataSchema.length > 0) {
        const missingFields = expectedDataSchema.filter(field => !(field in parsedData));
        if (missingFields.length > 0) {
          const result: QRScanResult = {
            success: false,
            error: `Missing required fields: ${missingFields.join(', ')}`,
            rawData,
          };
          setLastResult(result);
          onScan(result);
          return;
        }
      }

      // Success!
      const result: QRScanResult = {
        success: true,
        data: parsedData,
        rawData,
      };
      setLastResult(result);
      onScan(result);

    } catch {
      // Not valid format
      const result: QRScanResult = {
        success: false,
        error: 'QR code does not contain valid proof data',
        rawData,
      };
      setLastResult(result);
      onScan(result);
    }
  };

  const startScanning = async () => {
    if (!scanner) return;

    try {
      setCameraError('');
      setLastResult(null);
      await scanner.start();
      setIsScanning(true);
    } catch (error) {
      console.error('Failed to start scanner:', error);
      setCameraError('Failed to start camera. Please check permissions and try again.');
    }
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.stop();
      scanner.destroy();
    }
    setIsScanning(false);
  };

  const resetScanner = () => {
    setLastResult(null);
    setCameraError('');
    if (isScanning) {
      stopScanning();
      setTimeout(() => {
        initializeScanner();
      }, 100);
    }
  };

  if (!hasCamera) {
    return (
      <div className={`text-center p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">No Camera Available</h3>
          <p className="text-red-800 text-sm mb-4">
            This device doesn't have a camera or camera access is not supported.
          </p>
          {onClose && (
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      {/* Camera Controls */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Scan QR Code</h3>
            <div className="flex space-x-2">
              <button
                onClick={resetScanner}
                className="p-2 text-gray-600 hover:text-gray-800"
                title="Reset scanner"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 text-gray-600 hover:text-gray-800"
                  title="Close scanner"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Camera View */}
        <div className="relative bg-black">
          <video
            ref={videoRef}
            className="w-full aspect-square object-cover"
            playsInline
            muted
          />
          
          {/* Scan overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-50"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm">
                Position QR code in the frame
              </div>
            </div>
          </div>

          {/* Status overlay */}
          {lastResult && (
            <div className="absolute top-4 left-4 right-4">
              {lastResult.success ? (
                <div className="bg-green-500 text-white px-3 py-2 rounded-lg flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Scan successful!</span>
                </div>
              ) : (
                <div className="bg-red-500 text-white px-3 py-2 rounded-lg flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <div className="text-sm">
                    <div className="font-medium">Scan failed</div>
                    <div className="text-xs opacity-90">{lastResult.error}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 bg-gray-50">
          {cameraError ? (
            <div className="text-center">
              <p className="text-red-600 text-sm mb-3">{cameraError}</p>
              <button onClick={resetScanner} className="btn-primary text-sm">
                Try Again
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              {!isScanning ? (
                <button
                  onClick={startScanning}
                  className="btn-primary flex items-center space-x-2"
                >
                  <CameraIcon className="h-5 w-5" />
                  <span>Start Camera</span>
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <StopIcon className="h-5 w-5" />
                  <span>Stop Camera</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Scanning Tips:</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Hold your device steady</li>
          <li>• Ensure good lighting</li>
          <li>• Keep the QR code within the frame</li>
          <li>• Move closer if the code is small</li>
        </ul>
      </div>
    </div>
  );
};

export default QRCodeScanner;