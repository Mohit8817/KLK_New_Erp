import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface CameraBarcodeScannerModalProps {
  open: boolean;
  fieldName: string;
  fieldLabel: string;
  onScan: (value: string) => void;
  onClose: () => void;
}

export function CameraBarcodeScannerModal({
  open,
  fieldName: _fieldName,
  fieldLabel,
  onScan,
  onClose,
}: CameraBarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [manualCode, setManualCode] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [scannedSuccess, setScannedSuccess] = useState<string | null>(null);

  // Play audio chime or vibrate on successful scan
  const playBeep = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([80, 40, 80]);
      }
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {}
  }, []);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  }, []);

  const handleDetected = useCallback(
    (code: string) => {
      const clean = String(code).trim();
      if (!clean) return;
      playBeep();
      setScannedSuccess(clean);
      stopCamera();
      setTimeout(() => {
        onScan(clean);
        onClose();
      }, 500);
    },
    [onScan, onClose, playBeep, stopCamera]
  );

  // Start video stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage(null);
    setScannedSuccess(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Camera access is not supported by your browser or connection. You can enter or upload the barcode image instead.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setCameraActive(true);

      // Check if torch is available
      const track = stream.getVideoTracks()[0];
      const capabilities = (track?.getCapabilities?.() as any) || {};
      setHasTorch(Boolean(capabilities.torch));

      // Barcode detection loop
      const BarcodeDetectorClass = (window as any).BarcodeDetector;
      if (BarcodeDetectorClass) {
        try {
          const detector = new BarcodeDetectorClass({
            formats: [
              'code_128',
              'code_39',
              'code_93',
              'ean_13',
              'ean_8',
              'qr_code',
              'upc_a',
              'upc_e',
              'data_matrix',
              'itf',
              'codabar',
            ],
          });

          const scanLoop = async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) {
              animFrameRef.current = requestAnimationFrame(scanLoop);
              return;
            }
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                handleDetected(barcodes[0].rawValue);
                return;
              }
            } catch {}
            animFrameRef.current = requestAnimationFrame(scanLoop);
          };

          animFrameRef.current = requestAnimationFrame(scanLoop);
        } catch (detectorErr) {
          console.warn('[BarcodeDetector] init failed:', detectorErr);
        }
      }
    } catch (err: any) {
      console.warn('[Camera] getUserMedia failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera permission was denied. Please allow camera permissions in your browser or enter number manually.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera hardware was detected on this device.');
      } else {
        setErrorMessage(err.message || 'Unable to open camera on this device.');
      }
    }
  }, [facingMode, handleDetected, stopCamera]);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  // Toggle Torch
  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      } catch (err) {
        console.warn('Torch toggle failed:', err);
      }
    }
  };

  // Flip camera (front/back)
  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Image upload barcode detection fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const BarcodeDetectorClass = (window as any).BarcodeDetector;
    if (BarcodeDetectorClass) {
      try {
        const detector = new BarcodeDetectorClass({
          formats: [
            'code_128',
            'code_39',
            'code_93',
            'ean_13',
            'ean_8',
            'qr_code',
            'upc_a',
            'upc_e',
            'data_matrix',
          ],
        });
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = async () => {
          try {
            const results = await detector.detect(img);
            if (results && results.length > 0 && results[0].rawValue) {
              handleDetected(results[0].rawValue);
              return;
            }
            alert('No barcode detected in uploaded image. Please enter number manually.');
          } catch {
            alert('Could not decode barcode from image. Please enter manually.');
          } finally {
            URL.revokeObjectURL(img.src);
          }
        };
        return;
      } catch {}
    }

    // Fallback: prompt or filename
    const stripped = file.name.replace(/\.[^/.]+$/, '');
    setManualCode(stripped);
  };

  if (!open) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scanner-modal-title"
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
          }}
        >
          <div>
            <h3
              id="scanner-modal-title"
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Scan {fieldLabel}
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#64748b' }}>
              Align the barcode or QR label inside the viewfinder
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close scanner"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: '#e2e8f0',
              color: '#334155',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        {/* Viewfinder / Video Stage */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 300,
            background: '#090d16',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
              display: cameraActive ? 'block' : 'none',
            }}
          />

          {/* Viewfinder Target Frame */}
          {cameraActive && !scannedSuccess && (
            <div
              style={{
                position: 'absolute',
                width: 240,
                height: 160,
                border: '2px solid rgba(255, 255, 255, 0.45)',
                borderRadius: 12,
                boxShadow: '0 0 0 4000px rgba(0, 0, 0, 0.45)',
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 6,
              }}
            >
              {/* Corner markers */}
              <div
                style={{
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  width: 20,
                  height: 20,
                  borderTop: '4px solid #3b82f6',
                  borderLeft: '4px solid #3b82f6',
                  borderRadius: '6px 0 0 0',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 20,
                  height: 20,
                  borderTop: '4px solid #3b82f6',
                  borderRight: '4px solid #3b82f6',
                  borderRadius: '0 6px 0 0',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: -2,
                  left: -2,
                  width: 20,
                  height: 20,
                  borderBottom: '4px solid #3b82f6',
                  borderLeft: '4px solid #3b82f6',
                  borderRadius: '0 0 0 6px',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 20,
                  height: 20,
                  borderBottom: '4px solid #3b82f6',
                  borderRight: '4px solid #3b82f6',
                  borderRadius: '0 0 6px 0',
                }}
              />

              {/* Animated Laser Scan Line */}
              <div
                style={{
                  width: '100%',
                  height: 2,
                  background: 'linear-gradient(90deg, transparent, #22c55e, #3b82f6, transparent)',
                  boxShadow: '0 0 8px 1px #3b82f6',
                  animation: 'scannerLaser 1.8s infinite ease-in-out',
                }}
              />
            </div>
          )}

          {/* Success Overlay */}
          {scannedSuccess && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(16, 185, 129, 0.92)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                padding: 20,
                textAlign: 'center',
                zIndex: 20,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: '#ffffff',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Scanned Successfully!</div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginTop: 6,
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '4px 12px',
                  borderRadius: 6,
                  fontFamily: 'monospace',
                  letterSpacing: '0.05em',
                }}
              >
                {scannedSuccess}
              </div>
            </div>
          )}

          {/* Camera Error Message */}
          {errorMessage && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: '#0f172a',
                color: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                textAlign: 'center',
              }}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f87171"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginBottom: 10 }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div style={{ fontSize: 13, color: '#e2e8f0', marginBottom: 12 }}>{errorMessage}</div>
              <button
                type="button"
                onClick={startCamera}
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Retry Camera
              </button>
            </div>
          )}

          {/* Camera Controls Bar */}
          {cameraActive && !scannedSuccess && (
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                display: 'flex',
                gap: 12,
                zIndex: 10,
              }}
            >
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    background: torchOn ? '#f59e0b' : 'rgba(0, 0, 0, 0.55)',
                    color: '#ffffff',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  ⚡ Flash {torchOn ? 'ON' : 'OFF'}
                </button>
              )}

              <button
                type="button"
                onClick={flipCamera}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  background: 'rgba(0, 0, 0, 0.55)',
                  color: '#ffffff',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                🔄 Flip Camera
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  background: 'rgba(0, 0, 0, 0.55)',
                  color: '#ffffff',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                📁 Upload Photo
              </button>
            </div>
          )}
        </div>

        {/* Hidden file input for photo upload */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {/* Manual Fallback Input */}
        <div style={{ padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <label
            htmlFor="manual-scanner-input"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#475569',
              marginBottom: 6,
              display: 'block',
            }}
          >
            Or Enter / Edit Number Manually
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              id="manual-scanner-input"
              type="text"
              placeholder={`Enter ${fieldLabel}`}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && manualCode.trim()) {
                  e.preventDefault();
                  handleDetected(manualCode.trim());
                }
              }}
              style={{
                flex: 1,
                height: 38,
                padding: '0 12px',
                fontSize: 13,
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                background: '#ffffff',
                color: '#0f172a',
                fontFamily: 'monospace',
              }}
            />
            <button
              type="button"
              disabled={!manualCode.trim()}
              onClick={() => handleDetected(manualCode.trim())}
              style={{
                height: 38,
                padding: '0 16px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                border: 'none',
                background: manualCode.trim() ? '#2563eb' : '#94a3b8',
                color: '#ffffff',
                cursor: manualCode.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Fill Field
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scannerLaser {
          0% { transform: translateY(0px); opacity: 0.3; }
          50% { transform: translateY(154px); opacity: 1; }
          100% { transform: translateY(0px); opacity: 0.3; }
        }
      `}</style>
    </div>,
    document.body
  );
}

export default CameraBarcodeScannerModal;
