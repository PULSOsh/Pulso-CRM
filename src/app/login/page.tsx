import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
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
        <form className="login-form">
          <div>
            <p className="eyebrow">ACESSO SEGURO</p>
            <h2>Entre no PULSO CRM</h2>
            <p className="muted">
              Interface inicial do starter. A autenticação real entra na Fase 1.
            </p>
          </div>
          <label className="field">
            <span>E-mail</span>
            <input type="email" defaultValue="gustavo@pulso.cloud" />
          </label>
          <label className="field">
            <span>Senha</span>
            <input type="password" defaultValue="pulso123" />
          </label>
          <Link
            href="/crm"
            className="primary-button login-button"
            style={{ display: "grid", placeItems: "center", textDecoration: "none" }}
          >
            Entrar no sistema
          </Link>
          <div className="security-line">Starter front-end sem autenticação de produção.</div>
        </form>
      </section>
    </main>
  );
}
