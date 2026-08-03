import { supabase } from '../supabaseClient';

export const uploadFileToSupabase = async (file: File, courseId: string, messageId: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${messageId}_${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `chat_files/${courseId}/${fileName}`;
  
  // Try course_materials bucket
  const bucketName = 'course_materials';
  
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Upload error with Supabase:", error);
    throw error;
  }
};

export const getFileTypeCategory = (file: File) => {
  const mime = file.type;
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'pdf';
  if (
    mime.includes('word') || 
    mime.includes('document') ||
    file.name.endsWith('.doc') || 
    file.name.endsWith('.docx')
  ) return 'doc';
  if (
    mime.includes('excel') || 
    mime.includes('spreadsheet') ||
    file.name.endsWith('.xls') || 
    file.name.endsWith('.xlsx') ||
    file.name.endsWith('.csv')
  ) return 'excel';
  if (
    mime.includes('presentation') || 
    mime.includes('powerpoint') ||
    file.name.endsWith('.ppt') || 
    file.name.endsWith('.pptx')
  ) return 'ppt';
  if (mime.includes('zip') || mime.includes('compressed') || mime.includes('rar')) return 'zip';
  return 'file';
};

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
