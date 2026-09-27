'use server';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { productSchema, FormState } from '@/lib/validation';

export async function saveProduct(id: string | null, _: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  let images: unknown;
  try { images = JSON.parse(String(form.get('imagenes') ?? '[]')); } catch { return { error: 'Lista de imágenes inválida.' }; }
  const parsed = productSchema.safeParse({ ...Object.fromEntries(form), activo: form.get('activo') === 'on', imagenes: images });
  if (!parsed.success) return { error: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(' · ') };
  const { imagenes, ...data } = parsed.data;
  const schema=z.array(z.object({id:z.string().optional(),color:z.string().trim().max(50),talla:z.string().trim().max(50)}).refine(v=>v.color||v.talla,'Indica color o talla.')).max(30);
  let variants;
  try {variants=schema.parse(JSON.parse(String(form.get('variantes')??'[]')));} catch {return {error:'Revisa las variantes: indica color o talla (máximo 30).'};}
  const keys=variants.map(v=>JSON.stringify([v.color.toLowerCase(),v.talla.toLowerCase()]));
  if(new Set(keys).size!==keys.length) return {error:'Hay variantes repetidas.'};
  try {
    const nestedImages = imagenes.map((url, orden) => ({ url, orden }));
    await db.$transaction(async tx=>{
      if(id){
        const existing=await tx.variante.findMany({where:{productoId:id}});
        if(variants.some(v=>v.id&&!existing.some(e=>e.id===v.id))) throw new Error('Variante inválida');
        await tx.producto.update({where:{id},data:{...data,imagenes:{deleteMany:{},create:nestedImages}}});
        await tx.variante.updateMany({where:{productoId:id,id:{notIn:variants.flatMap(v=>v.id?[v.id]:[])}},data:{activo:false}});
        for(const v of variants) {if(v.id) await tx.variante.update({where:{id:v.id},data:{color:v.color,talla:v.talla,activo:true}});else await tx.variante.create({data:{productoId:id,color:v.color,talla:v.talla}});}
      }else await tx.producto.create({data:{...data,imagenes:{create:nestedImages},variantes:{create:variants.map(v=>({color:v.color,talla:v.talla}))}}});
    }, {maxWait:10000,timeout:20000});
  } catch { return { error: 'No se pudo guardar el producto. Inténtalo nuevamente.' }; }
  revalidatePath('/admin/inventario'); revalidatePath('/admin'); revalidatePath('/'); revalidatePath('/admin/productos');
  if (id) revalidatePath(`/producto/${id}`);
  redirect('/admin/productos');
}
export async function changeProduct(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(form.get('id') ?? '');
  const action = String(form.get('action') ?? '');
  try {
    if (action === 'delete') await db.producto.delete({ where: { id } });
    else if (action === 'activate' || action === 'deactivate') await db.producto.update({ where: { id }, data: { activo: action === 'activate' } });
    else return { error: 'Operación inválida.' };
  } catch { return { error: 'No se pudo actualizar. Si tiene pedidos asociados, ocúltalo en lugar de eliminarlo.' }; }
  revalidatePath('/admin/inventario'); revalidatePath('/admin'); revalidatePath('/'); revalidatePath('/admin/productos'); revalidatePath(`/producto/${id}`);
  return {};
}
