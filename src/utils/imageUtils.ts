import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  // Solo comprimir si es imagen
  if (!file.type.startsWith('image/')) return file;

  const options = {
    maxSizeMB: 1,            // Máximo 1MB
    maxWidthOrHeight: 1280,  // Máximo 1280px
    useWebWorker: true,
    fileType: 'image/webp'   // Forzar formato WebP
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    // Convertir Blob de vuelta a File con extensión .webp si es necesario
    const fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
    return new File([compressedBlob], fileName, { type: 'image/webp' });
  } catch (error) {
    console.error('Error comprimiendo imagen:', error);
    return file; // Si falla, devolvemos original para no bloquear el flujo
  }
}
