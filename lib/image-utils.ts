/**
 * Helper untuk mengompres gambar di sisi browser (client-side) menggunakan Canvas
 * sebelum dikirim ke server / AI, agar proses upload cepat dan hemat kuota.
 */
export async function compressAndConvertToBase64(
  file: File,
  maxDimension = 1280,
  quality = 0.8
): Promise<{ base64Data: string; mimeType: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Resize jika melebihi maxDimension dengan menjaga aspek rasio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Gagal menginisialisasi canvas untuk kompresi gambar."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Kompres ke JPEG untuk efisiensi ukuran token
        const mimeType = "image/jpeg";
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const base64Data = dataUrl.split(",")[1];

        resolve({
          base64Data,
          mimeType,
          previewUrl: dataUrl,
        });
      };

      img.onerror = () => {
        reject(new Error("Gagal membaca format gambar struk."));
      };

      if (event.target?.result) {
        img.src = event.target.result as string;
      } else {
        reject(new Error("File gambar kosong."));
      }
    };

    reader.onerror = () => {
      reject(new Error("Gagal membaca file gambar."));
    };

    reader.readAsDataURL(file);
  });
}
