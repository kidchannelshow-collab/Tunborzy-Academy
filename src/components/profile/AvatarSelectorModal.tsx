import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Camera, ZoomIn, RotateCw, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import Cropper, { Area } from 'react-easy-crop';
import { supabase } from '../../supabaseClient';
import { refreshProfile } from '../../lib/useProfile';
import imageCompression from 'browser-image-compression';

interface AvatarSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string | null;
  userId: string;
}

const getCroppedImg = async (imageSrc: string, pixelCrop: Area, rotation = 0): Promise<Blob> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (error) => reject(error));
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));
  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(image, safeArea / 2 - image.width / 2, safeArea / 2 - image.height / 2);

  const data = ctx.getImageData(0, 0, safeArea, safeArea);
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width / 2 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height / 2 - pixelCrop.y)
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) resolve(file);
      else reject(new Error('Canvas is empty'));
    }, 'image/webp', 0.9);
  });
};

export default function AvatarSelectorModal({ isOpen, onClose, currentAvatar, userId }: AvatarSelectorModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    setError(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a JPG, PNG, or WEBP image.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('Image is too large. Maximum size is 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => setImageSrc(reader.result?.toString() || null));
    reader.readAsDataURL(file);
  };

  const handleSaveUpload = async () => {
    if (!imageSrc || !croppedAreaPixels || !userId) return;
    
    try {
      setIsSaving(true);
      setError(null);
      
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      
      const compressedFile = await imageCompression(new File([croppedImageBlob], 'profile.webp', { type: 'image/webp' }), {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 512,
        useWebWorker: true,
      });

      const fileName = `${userId}_${Date.now()}.webp`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile, { upsert: true, contentType: 'image/webp' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });
      if (updateError) throw updateError;

      const { error: dbError } = await supabase
        .from('avatars')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);
        
      if (dbError) throw dbError;

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
      
    } catch (err: any) {
      console.error('Error saving profile photo:', err);
      setError(err.message || 'Failed to save profile photo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md"
            onClick={handleClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <Camera className="text-emerald-500" /> Update Profile Photo
              </h2>
              <button onClick={handleClose} className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 min-h-[400px] flex flex-col">
              
              {error && (
                <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
                  <AlertCircle className="text-rose-500 shrink-0" size={20} />
                  <p className="text-sm text-rose-200">{error}</p>
                </div>
              )}
              
              {success && (
                <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                  <p className="text-sm text-emerald-200">Profile photo updated successfully!</p>
                </div>
              )}

              {!imageSrc ? (
                <div 
                  className="flex-1 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center p-8 transition-colors hover:border-emerald-500 hover:bg-slate-800/30 cursor-pointer min-h-[300px]"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png,image/webp" className="hidden" />
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Upload className="text-slate-400" size={32} />
                  </div>
                  <p className="text-white font-semibold mb-2 text-lg">Click or drag image here</p>
                  <p className="text-sm text-slate-500">Supports JPG, PNG, WEBP (Max 5MB)</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="relative w-full h-64 sm:h-80 bg-slate-900 rounded-2xl overflow-hidden mb-6">
                    <Cropper
                      image={imageSrc}
                      crop={crop}
                      zoom={zoom}
                      rotation={rotation}
                      aspect={1}
                      cropShape="round"
                      showGrid={false}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      onRotationChange={setRotation}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center justify-between text-sm text-slate-400 mb-2">
                        <span className="flex items-center gap-2"><ZoomIn size={16}/> Zoom</span>
                        <span className="text-emerald-400">{Math.round(zoom * 100)}%</span>
                      </label>
                      <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="flex items-center justify-between text-sm text-slate-400 mb-2">
                        <span className="flex items-center gap-2"><RotateCw size={16}/> Rotation</span>
                        <span className="text-emerald-400">{rotation}°</span>
                      </label>
                      <input
                        type="range"
                        value={rotation}
                        min={0}
                        max={360}
                        step={1}
                        aria-labelledby="Rotation"
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-center">
                    <button onClick={() => setImageSrc(null)} className="text-sm text-slate-400 hover:text-white underline">
                      Choose a different image
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-800 bg-[#0f172a] flex justify-end gap-3">
              <button 
                onClick={handleClose}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                disabled={isSaving || !imageSrc}
                onClick={handleSaveUpload}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-900 font-bold hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving && <RefreshCw className="animate-spin" size={18} />}
                {isSaving ? 'Saving...' : 'Save Profile Photo'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
