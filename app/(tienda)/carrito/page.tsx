import { Cart } from '@/components/cart';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi pedido' };
export default function CartPage() { return <div className="container-page"><h1 className="text-3xl font-medium tracking-tight">Mi pedido</h1><Cart whatsapp={process.env.WHATSAPP_NUMBER ?? ''}/></div>; }
