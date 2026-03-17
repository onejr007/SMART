/**
 * Helper untuk mengelola OffscreenCanvas untuk tugas rendering latar belakang.
 * Memungkinkan pembuatan tekstur atau thumbnail tanpa membebani main thread.
 * 
 * @recommendation Performance #6 - OffscreenCanvas
 */
export class OffscreenRenderer {
    private canvas: OffscreenCanvas;
    private context: OffscreenCanvasRenderingContext2D | null;

    constructor(width: number, height: number) {
        this.canvas = new OffscreenCanvas(width, height);
        this.context = this.canvas.getContext('2d');
    }

    /**
     * Menggambar sesuatu ke OffscreenCanvas.
     * @param drawCallback Callback untuk menggambar menggunakan context 2D.
     */
    public draw(drawCallback: (ctx: OffscreenCanvasRenderingContext2D) => void) {
        if (!this.context) return;
        drawCallback(this.context);
    }

    /**
     * Mendapatkan hasil gambar sebagai ImageBitmap.
     */
    public async getImageBitmap(): Promise<ImageBitmap> {
        return this.canvas.transferToImageBitmap();
    }

    /**
     * Mendapatkan hasil gambar sebagai Blob (misal untuk upload).
     */
    public async toBlob(type: string = 'image/png', quality?: number): Promise<Blob> {
        return this.canvas.convertToBlob({ type, quality });
    }

    public resize(width: number, height: number) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
}
