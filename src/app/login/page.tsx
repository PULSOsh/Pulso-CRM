"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        setError(error.message || "Erro ao realizar login");
      } else {
        router.push("/crm");
        router.refresh();
      }
    } catch (_err) {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-brand">
        <Image
          className="login-brand-logo"
          src="/brand/pulso_horizontal_signal_white.svg"
          alt="PULSO"
          width={180}
          height={48}
          priority
        />
        <div className="login-copy">
          <p className="eyebrow">OPERAÇÃO COMERCIAL</p>
          <h1>
            Do primeiro contato
            <br />à entrega.
          </h1>
          <p>Leads, propostas, contratos, projetos e recebimentos conectados em um único fluxo.</p>
        </div>
        <footer className="login-footer">
          <span>Tecnologia para novas possibilidades.</span>
          <span>PULSO / INTERNAL</span>
        </footer>
      </section>
      <section className="login-form-side">
        <form className="login-form" onSubmit={handleLogin}>
          <div>
            <p className="eyebrow">ACESSO SEGURO</p>
            <h2>Entre no PULSO CRM</h2>
            <p className="muted">Autenticação centralizada.</p>
          </div>
          {error && <div style={{ color: "red", fontSize: "14px" }}>{error}</div>}
          <label className="field">
            <span>E-mail</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </label>
          <label className="field">
            <span>Senha</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </label>
          <button type="submit" className="primary-button login-button" disabled={loading}>
            {loading ? "Entrando..." : "Entrar no sistema"}
          </button>
          <div className="security-line">Acesso restrito.</div>
        </form>
      </section>
    </main>
  );
}
