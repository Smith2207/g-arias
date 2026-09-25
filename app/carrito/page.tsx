import { Cart } from '@/components/cart';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi pedido' };
export default function CartPage() { return <div className="container-page"><p className="eyebrow mb-3">Un paso más para tu negocio</p><h1 className="font-serif text-4xl">Mi pedido</h1><Cart whatsapp={process.env.WHATSAPP_NUMBER ?? ''}/></div>; }
