import {getStoreSettings} from '@/lib/store-settings';
import { Cart } from '@/components/cart';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi pedido' };
export default async function CartPage() { const settings=await getStoreSettings(); return <div className="container-page"><h1 className="text-3xl font-medium tracking-tight">Mi pedido</h1><Cart whatsapp={settings.whatsapp} conditions={settings.condicionesEnvio}/></div>; }
