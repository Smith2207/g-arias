import { LoginForm } from '@/components/login-form';
export const metadata = { title: 'Acceso administrativo', robots: { index: false, follow: false } };
export default function LoginPage() { return <div className="container-page"><div className="card mx-auto my-8 max-w-md p-8"><p className="eyebrow">Espacio de administración</p><h1 className="mb-8 mt-3 font-serif text-3xl">Bienvenido de nuevo</h1><LoginForm/></div></div>; }
