import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { currentAdmin } from '@/lib/auth';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    const body = await request.json() as HandleUploadBody;
    const response = await handleUpload({ body, request,
      onBeforeGenerateToken: async pathname => {
        const origin = request.headers.get('origin');
        if (!origin || new URL(origin).host !== new URL(request.url).host) throw new Error('Origen no válido.');
        if (!await currentAdmin()) throw new Error('No autorizado.');
        if (!/^productos\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|avif)$/.test(pathname)) throw new Error('Ruta no válida.');
        return { allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'], maximumSizeInBytes: 5 * 1024 * 1024, addRandomSuffix: true };
      },
      // El callback está firmado por Blob y no lleva la cookie del navegador.
      onUploadCompleted: async () => {},
    });
    return Response.json(response);
  } catch { return Response.json({ error: 'No se pudo autorizar la subida.' }, { status: 400 }); }
}
