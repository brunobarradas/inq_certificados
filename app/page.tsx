import { redirect } from 'next/navigation';

// A raiz redireciona para o painel admin
export default function Home() {
  redirect('/admin');
}
