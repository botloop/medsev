/**
 * Medical Result Upload Component
 * Upload medical result images/PDFs for completed steps
 * Features: multiple files, camera capture, image thumbnails, success toasts, combined PDF download
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import type { MedicalResultFile } from '@shared/types/personnel.types';
import api from '../../services/api';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';

interface MedicalResultUploadProps {
  personnelId: string;
  step: number;
  stepTitle: string;
  existingFiles: MedicalResultFile[];
  onUploadSuccess: () => void;
  /** When false, hides file-picker and camera buttons (view/delete still available). Defaults to true. */
  canUpload?: boolean;
}

/** Insert Cloudinary transformation params after /upload/ in a URL */
function cloudinaryTransform(url: string, transform: string): string {
  return url.replace('/upload/', `/upload/${transform}/`);
}

export const MedicalResultUpload: React.FC<MedicalResultUploadProps> = ({
  personnelId, step, stepTitle, existingFiles, onUploadSuccess, canUpload = true,
}) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [expandedImg, setExpandedImg] = useState<string | null>(null);
  const [optimisticEmpty, setOptimisticEmpty] = useState(false);

  // Camera state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [captures, setCaptures] = useState<{ blob: Blob; url: string }[]>([]);
  const [cameraReady, setCameraReady] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Reset optimistic flag once parent confirms files are gone
  useEffect(() => {
    if (existingFiles.length === 0) setOptimisticEmpty(false);
  }, [existingFiles]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => stopStream();
  }, []);

  const displayFiles = optimisticEmpty ? [] : existingFiles;
  const imageFiles   = displayFiles.filter(f => f.fileType.startsWith('image/'));

  // ─── File Upload ───────────────────────────────────────────────────────────

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length === 0) return;

    for (const file of selected) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 10 MB limit`);
        if (inputRef.current) inputRef.current.value = '';
        return;
      }
      const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowed.includes(file.type)) {
        toast.error(`"${file.name}": only JPEG, PNG, GIF, or PDF allowed`);
        if (inputRef.current) inputRef.current.value = '';
        return;
      }
    }

    await uploadFiles(selected, `${selected.length} file${selected.length > 1 ? 's' : ''}`);
    if (inputRef.current) inputRef.current.value = '';
  };

  const uploadFiles = async (files: (File | Blob)[], label: string) => {
    setUploading(true);
    const toastId = toast.loading(`Uploading ${label}…`);
    try {
      const formData = new FormData();
      files.forEach((f, i) => {
        const name = f instanceof File ? f.name : `camera_${Date.now()}_${i + 1}.jpg`;
        formData.append('files', f, name);
      });

      await api.post(`/upload/medical-result/${personnelId}/${step}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300_000,
      });

      toast.success(`${label} uploaded successfully`, { id: toastId });
      onUploadSuccess();
    } catch (err: any) {
      if (err.response) {
        toast.error(err.response.data?.error || 'Failed to upload', { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } finally {
      setUploading(false);
    }
  };

  // ─── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (fileName: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    setDeleting(fileName);
    try {
      await api.delete(`/upload/medical-result/${personnelId}/${step}/${encodeURIComponent(fileName)}`);
      toast.success('File deleted');
      if (expandedImg === fileName) setExpandedImg(null);
      onUploadSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete file');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Delete all ${existingFiles.length} file(s) for this step? This cannot be undone.`)) return;
    setDeletingAll(true);
    const toastId = toast.loading(`Deleting ${existingFiles.length} file(s)…`);
    try {
      await api.delete(`/upload/medical-result/${personnelId}/${step}`);
      setExpandedImg(null);
      setOptimisticEmpty(true);
      toast.success('All files deleted', { id: toastId });
      onUploadSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete all files', { id: toastId });
    } finally {
      setDeletingAll(false);
    }
  };

  // ─── Camera ────────────────────────────────────────────────────────────────

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  };

  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    stopStream();
    setCameraError(null);
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
        };
      }
    } catch (err: any) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera access denied. Please allow camera permission.'
        : err.name === 'NotFoundError'
        ? 'No camera found on this device.'
        : 'Could not open camera.';
      setCameraError(msg);
    }
  }, []);

  const openCamera = async () => {
    setCaptures([]);
    setCameraOpen(true);
    await startCamera(facingMode);
  };

  const closeCamera = () => {
    stopStream();
    setCameraOpen(false);
    // Revoke preview URLs to free memory
    captures.forEach(c => URL.revokeObjectURL(c.url));
    setCaptures([]);
  };

  const flipCamera = async () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    await startCamera(next);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !cameraReady) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setCaptures(prev => [...prev, { blob, url }]);
    }, 'image/jpeg', 0.92);
  };

  const removeCapture = (index: number) => {
    setCaptures(prev => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadCaptures = async () => {
    if (captures.length === 0) return;
    const blobs = captures.map(c => c.blob);
    closeCamera();
    await uploadFiles(blobs, `${blobs.length} photo${blobs.length > 1 ? 's' : ''}`);
  };

  // ─── Combined PDF ──────────────────────────────────────────────────────────

  const generateCombinedPDF = async () => {
    if (imageFiles.length < 2) return;
    setGeneratingPDF(true);
    const toastId = toast.loading('Generating combined PDF…');
    try {
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableW = pageW - margin * 2;
      const usableH = pageH - margin * 2;
      let isFirst = true;

      for (const file of imageFiles) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload  = () => resolve();
          img.onerror = () => reject(new Error(`Could not load ${file.fileName}`));
          img.src = cloudinaryTransform(file.fileURL, 'q_auto,f_auto');
        });

        const canvas = document.createElement('canvas');
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

        if (!isFirst) pdf.addPage();

        const imgRatio = img.naturalWidth / img.naturalHeight;
        let drawW = usableW;
        let drawH = usableW / imgRatio;
        if (drawH > usableH) { drawH = usableH; drawW = usableH * imgRatio; }

        pdf.addImage(dataUrl, 'JPEG',
          margin + (usableW - drawW) / 2,
          margin + (usableH - drawH) / 2,
          drawW, drawH);
        isFirst = false;
      }

      pdf.save(`medical-results-step${step}.pdf`);
      toast.success('Combined PDF downloaded', { id: toastId });
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF', { id: toastId });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Paper elevation={0} sx={{ bgcolor: '#eff6ff', border: 1, borderColor: '#bfdbfe', p: 2, mt: 2 }}>
      {/* Header */}
      <Typography variant="subtitle2" fontWeight={700} color="primary.dark" mb={1.5}>
        📤 Medical Results — {stepTitle}
      </Typography>

      {/* Action buttons row — hidden when canUpload=false */}
      {canUpload && (
        <>
          <Box display="flex" gap={1} flexWrap="wrap" mb={0.5}>
            {/* File picker */}
            <label>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              <Button
                component="span"
                variant="contained"
                size="small"
                disabled={uploading}
                startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : undefined}
              >
                {uploading ? 'Uploading…' : '📤 Choose Files'}
              </Button>
            </label>

            {/* Camera button */}
            <Button
              variant="outlined"
              size="small"
              onClick={openCamera}
              disabled={uploading}
            >
              📷 Camera
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
            JPEG · PNG · GIF · PDF · Max 10 MB per file · Multiple files supported
          </Typography>
        </>
      )}

      {/* Image thumbnail strip */}
      {imageFiles.length > 0 && (
        <Box display="flex" gap={1} flexWrap="wrap" mb={1.5}>
          {imageFiles.map((file, i) => (
            <Tooltip key={i} title={file.fileName} arrow>
              <Box
                component="img"
                src={cloudinaryTransform(file.fileURL, 'w_80,h_80,c_fill,q_auto')}
                alt={file.fileName}
                onClick={() => setExpandedImg(expandedImg === file.fileName ? null : file.fileName)}
                sx={{
                  width: 64, height: 64, objectFit: 'cover',
                  borderRadius: 1, cursor: 'pointer', border: 2,
                  borderColor: expandedImg === file.fileName ? 'primary.main' : 'transparent',
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: 'primary.light' },
                }}
              />
            </Tooltip>
          ))}
        </Box>
      )}

      {/* Expanded image preview */}
      {expandedImg && (() => {
        const f = displayFiles.find(f => f.fileName === expandedImg);
        if (!f) return null;
        return (
          <Collapse in={!!expandedImg}>
            <Box mb={1.5} sx={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
              <Box
                component="img"
                src={cloudinaryTransform(f.fileURL, 'w_600,c_limit,q_auto')}
                alt={f.fileName}
                sx={{ maxWidth: '100%', maxHeight: 300, borderRadius: 1, display: 'block' }}
              />
              <Button
                size="small"
                sx={{ position: 'absolute', top: 4, right: 4, minWidth: 0, px: 1, bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                onClick={() => setExpandedImg(null)}
              >✕</Button>
            </Box>
          </Collapse>
        );
      })()}

      {/* File list */}
      {displayFiles.length > 0 && (
        <Box>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.75}>
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              Uploaded Files ({displayFiles.length})
            </Typography>
            <Button
              size="small" color="error" variant="outlined"
              onClick={handleDeleteAll}
              disabled={deletingAll || deleting !== null}
              sx={{ py: 0, px: 1, fontSize: 11, minWidth: 0 }}
            >
              {deletingAll ? <CircularProgress size={12} color="inherit" /> : '🗑 Delete All'}
            </Button>
          </Box>

          {displayFiles.map((file, index) => (
            <Paper
              key={index} variant="outlined"
              sx={{ p: 1, mb: 0.75, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              {file.fileType.startsWith('image/') ? (
                <Box
                  component="img"
                  src={cloudinaryTransform(file.fileURL, 'w_40,h_40,c_fill,q_auto')}
                  alt={file.fileName}
                  onClick={() => setExpandedImg(expandedImg === file.fileName ? null : file.fileName)}
                  sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 0.5, flexShrink: 0, cursor: 'pointer', border: 1, borderColor: 'divider' }}
                />
              ) : (
                <Typography fontSize={28} sx={{ flexShrink: 0, lineHeight: 1 }}>📄</Typography>
              )}

              <Box flex={1} minWidth={0}>
                <Typography variant="body2" fontWeight={600} noWrap title={file.fileName}>
                  {file.fileName}
                </Typography>
                <Box display="flex" gap={0.5} alignItems="center" flexWrap="wrap">
                  <Chip
                    label={file.fileType.startsWith('image/') ? 'Image' : 'PDF'}
                    size="small"
                    color={file.fileType.startsWith('image/') ? 'info' : 'default'}
                    sx={{ height: 18, fontSize: 10 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {formatSize(file.fileSize)} · {new Date(file.uploadedAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" gap={0.5} flexShrink={0}>
                <Button size="small" href={file.fileURL} target="_blank" rel="noopener noreferrer" sx={{ minWidth: 0, px: 1 }}>View</Button>
                <Button size="small" color="error" onClick={() => handleDelete(file.fileName)} disabled={deleting === file.fileName} sx={{ minWidth: 0, px: 1 }}>
                  {deleting === file.fileName ? <CircularProgress size={12} color="inherit" /> : 'Del'}
                </Button>
              </Box>
            </Paper>
          ))}

          {imageFiles.length >= 2 && (
            <Box mt={1}>
              <Button
                variant="outlined" size="small" fullWidth
                onClick={generateCombinedPDF} disabled={generatingPDF}
                startIcon={generatingPDF ? <CircularProgress size={14} color="inherit" /> : undefined}
                sx={{ borderStyle: 'dashed' }}
              >
                {generatingPDF ? 'Generating PDF…' : `📑 Download Combined PDF (${imageFiles.length} images)`}
              </Button>
            </Box>
          )}
        </Box>
      )}

      {displayFiles.length === 0 && (
        <Typography variant="caption" color="text.secondary" fontStyle="italic">
          No files uploaded yet.
        </Typography>
      )}

      {/* ── Camera Dialog ─────────────────────────────────────────────────── */}
      <Dialog
        open={cameraOpen}
        onClose={closeCamera}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#0a0a0a', color: '#fff', borderRadius: 2 } }}
      >
        {/* Toolbar */}
        <Box display="flex" alignItems="center" justifyContent="space-between" px={2} pt={1.5}>
          <Typography variant="subtitle2" fontWeight={700} color="#fff">
            📷 Camera — Step {step}
          </Typography>
          <Box display="flex" gap={1}>
            {/* Flip camera */}
            <Tooltip title="Flip camera" arrow>
              <IconButton size="small" onClick={flipCamera} sx={{ color: '#fff' }}>
                🔄
              </IconButton>
            </Tooltip>
            {/* Close */}
            <IconButton size="small" onClick={closeCamera} sx={{ color: '#fff' }}>✕</IconButton>
          </Box>
        </Box>

        <DialogContent sx={{ p: 1.5 }}>
          {/* Live viewfinder */}
          <Box sx={{ position: 'relative', bgcolor: '#111', borderRadius: 1, overflow: 'hidden', aspectRatio: '16/9' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {!cameraReady && !cameraError && (
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress sx={{ color: '#fff' }} />
              </Box>
            )}
            {cameraError && (
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                <Typography color="error" variant="body2" textAlign="center">{cameraError}</Typography>
              </Box>
            )}

            {/* Capture count badge */}
            {captures.length > 0 && (
              <Box sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'primary.main', color: '#fff', borderRadius: 99, px: 1.2, py: 0.2, fontSize: 12, fontWeight: 700 }}>
                {captures.length} captured
              </Box>
            )}
          </Box>

          {/* Capture button */}
          <Box display="flex" justifyContent="center" mt={1.5}>
            <Tooltip title="Capture photo" arrow>
              <Box
                onClick={capturePhoto}
                sx={{
                  width: 64, height: 64, borderRadius: '50%',
                  border: '4px solid #fff',
                  bgcolor: cameraReady ? '#fff' : '#555',
                  cursor: cameraReady ? 'pointer' : 'not-allowed',
                  transition: 'transform 0.1s, background 0.1s',
                  '&:active': { transform: 'scale(0.92)', bgcolor: '#ddd' },
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              />
            </Tooltip>
          </Box>

          {/* Captured thumbnails strip */}
          {captures.length > 0 && (
            <Box mt={1.5}>
              <Typography variant="caption" color="grey.400" display="block" mb={0.75}>
                Captured ({captures.length}) — tap to remove
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {captures.map((c, i) => (
                  <Badge
                    key={i}
                    badgeContent="✕"
                    color="error"
                    onClick={() => removeCapture(i)}
                    sx={{ cursor: 'pointer', '& .MuiBadge-badge': { fontSize: 10, minWidth: 16, height: 16, cursor: 'pointer' } }}
                  >
                    <Box
                      component="img"
                      src={c.url}
                      alt={`capture ${i + 1}`}
                      sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1, border: '2px solid #444' }}
                    />
                  </Badge>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
          <Button variant="outlined" onClick={closeCamera} sx={{ color: '#aaa', borderColor: '#555', flex: 1 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={uploadCaptures}
            disabled={captures.length === 0 || uploading}
            startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{ flex: 1 }}
          >
            {uploading ? 'Uploading…' : `Upload ${captures.length > 0 ? captures.length : ''} Photo${captures.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
