import Link from "next/link";
import { Container } from "@/components/layout/container";
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center">
      <Container className="text-center">
        <p className="font-mono text-xs uppercase tracking-label text-pulso-signal">404</p>
        <h1 className="mt-6 text-6xl font-semibold">Talvez exista outro caminho.</h1>
        <Link
          href="/"
          className="mt-10 inline-flex rounded-control bg-pulso-carbon px-5 py-3 text-white"
        >
          Voltar
        </Link>
      </Container>
    </main>
  );
}
