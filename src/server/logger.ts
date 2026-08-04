const LEVELS = ["debug", "info", "warn", "error"] as const;
type LogLevel = (typeof LEVELS)[number];

const configuredLevel: LogLevel = LEVELS.includes(process.env.LOG_LEVEL as LogLevel)
  ? (process.env.LOG_LEVEL as LogLevel)
  : "info";
const configuredIndex = LEVELS.indexOf(configuredLevel);

/**
 * Logger estruturado mínimo (sem dependência nova - docs/ARCHITECTURE_AND_STANDARDS.md
 * §11 já documenta LOG_LEVEL em .env.example, mas nenhum código lia essa
 * variável antes desta story). Emite uma linha JSON por chamada em stdout/
 * stderr, capturada pelo `docker service logs` já usado nos runbooks deste
 * projeto - sem introduzir um serviço de log externo.
 *
 * Nunca passar segredo/senha/token em `meta` (mesma regra de writeAuditLog/
 * logActivity - quem chama é responsável por isso).
 */
function emit(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (LEVELS.indexOf(level) < configuredIndex) return;

  const line = JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...meta });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => emit("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => emit("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => emit("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => emit("error", message, meta),
};
