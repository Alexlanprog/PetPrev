import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { PawPrint, ArrowRight, RotateCcw, ShieldCheck, UserCheck, Stethoscope, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { DEMO_USERS, useAuth, type AuthUser, type UserRole } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Login · PetPrev" },
      { name: "description", content: "Acesse o painel PetPrev com seu número de telefone." },
    ],
  }),
});

const ROLE_META: Record<UserRole, { icon: typeof ShieldCheck; color: string; bg: string; border: string }> = {
  rt: {
    icon: ShieldCheck,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
  },
  tutor: {
    icon: UserCheck,
    color: "text-chart-2",
    bg: "bg-chart-2/10",
    border: "border-chart-2/30",
  },
  vet: {
    icon: Stethoscope,
    color: "text-chart-4",
    bg: "bg-chart-4/10",
    border: "border-chart-4/30",
  },
};

const QUICK_ACCESS = [
  { phone: "(71) 9 0000-0001", label: "Admin / RT", sublabel: "Dra. Helena Braga", role: "rt" as UserRole },
  { phone: "(71) 9 0000-0002", label: "Tutor", sublabel: "Ana Ribeiro", role: "tutor" as UserRole },
  { phone: "(71) 9 0000-0003", label: "Veterinário", sublabel: "Dr. Caio Menezes", role: "vet" as UserRole },
];

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
  return raw;
}

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pendingUser, setPendingUser] = useState<(AuthUser & { otp: string; phone: string }) | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Se já autenticado ou tiver autoLogin, redireciona
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const autoRole = params.get("autoLogin");
    
    if (autoRole) {
      const userEntry = QUICK_ACCESS.find(q => q.role === autoRole);
      if (userEntry) {
        window.history.replaceState({}, document.title, window.location.pathname);
        const user = DEMO_USERS[userEntry.phone];
        if (user) {
          const { otp: _otp, phone: _phone, ...u } = user;
          login(u);
          toast.success(`Bem-vindo(a), ${u.name}!`, {
            description: `Auto-login realizado (origem: mobile).`,
          });
          navigate({ to: "/" });
          return;
        }
      }
    }

    if (isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate, login]);

  const handlePhoneSubmit = async (phoneValue?: string) => {
    const target = phoneValue ?? phone;
    const user = DEMO_USERS[target];

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);

    if (!user) {
      toast.error("Número não encontrado", {
        description: "Use um dos atalhos de demonstração abaixo.",
      });
      return;
    }

    setPendingUser(user);
    setStep("otp");
    toast.success(`Código enviado para ${target}`, {
      description: "Use 123456 para acessar a demonstração.",
    });
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    if (newOtp.every((d) => d !== "") && newOtp.join("") === pendingUser?.otp) {
      handleVerifyOtp(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (code?: string) => {
    const entered = code ?? otp.join("");
    if (entered.length < 6 || !pendingUser) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));

    if (entered !== pendingUser.otp) {
      setLoading(false);
      toast.error("Código incorreto", { description: "Use 123456 para a demonstração." });
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      return;
    }

    setSuccess(true);
    await new Promise((r) => setTimeout(r, 600));

    const { otp: _otp, phone: _phone, ...user } = pendingUser;
    login(user);

    toast.success(`Bem-vindo(a), ${user.name}!`, {
      description: `Você entrou como ${user.roleLabel}.`,
    });

    if (user.role === "rt") {
      navigate({ to: "/" });
    } else if (user.role === "tutor") {
      navigate({ to: "/tutor" });
    } else {
      navigate({ to: "/vet" });
    }
  };

  const handleQuickAccess = (entry: (typeof QUICK_ACCESS)[0]) => {
    setPhone(entry.phone);
    handlePhoneSubmit(entry.phone);
  };

  const otpFilled = otp.every((d) => d !== "");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 size-[600px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, oklch(0.55 0.11 190) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 size-[500px] rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, oklch(0.65 0.14 165) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
            <PawPrint className="size-8 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">PetPrev</h1>
            <p className="mt-1 text-sm text-muted-foreground">Plataforma de saúde preventiva para pets</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/60 bg-card/80 p-8 shadow-2xl backdrop-blur-sm">
          {step === "phone" ? (
            <PhoneStep
              phone={phone}
              setPhone={setPhone}
              onSubmit={() => handlePhoneSubmit()}
              loading={loading}
              onQuickAccess={handleQuickAccess}
            />
          ) : (
            <OtpStep
              phone={phone}
              otp={otp}
              otpRefs={otpRefs}
              loading={loading}
              success={success}
              otpFilled={otpFilled}
              onOtpChange={handleOtpChange}
              onOtpKeyDown={handleOtpKeyDown}
              onVerify={() => handleVerifyOtp()}
              onBack={() => {
                setStep("phone");
                setOtp(["", "", "", "", "", ""]);
                setSuccess(false);
              }}
              pendingUser={pendingUser}
            />
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ambiente de demonstração · Dados fictícios · v0.9.0-beta
        </p>
      </div>
    </div>
  );
}

/* ─── Phone step ──────────────────────────────────────────── */
function PhoneStep({
  phone,
  setPhone,
  onSubmit,
  loading,
  onQuickAccess,
}: {
  phone: string;
  setPhone: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  onQuickAccess: (entry: (typeof QUICK_ACCESS)[0]) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-foreground">Bem-vindo(a) de volta</h2>
      <p className="mt-1 text-sm text-muted-foreground">Informe seu número de telefone para receber o código de acesso.</p>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="phone-input" className="mb-1.5 block text-sm font-medium text-foreground">
            Telefone
          </label>
          <input
            id="phone-input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            placeholder="(71) 9 0000-0000"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            autoComplete="tel"
            autoFocus
          />
        </div>

        <button
          id="btn-send-otp"
          onClick={onSubmit}
          disabled={loading || phone.replace(/\D/g, "").length < 10}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Enviar código <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </div>

      {/* Quick access */}
      <div className="mt-6">
        <div className="relative flex items-center">
          <div className="flex-1 border-t border-border" />
          <span className="mx-3 text-xs text-muted-foreground">Acesso rápido — demonstração</span>
          <div className="flex-1 border-t border-border" />
        </div>
        <div className="mt-4 grid gap-2">
          {QUICK_ACCESS.map((entry) => {
            const meta = ROLE_META[entry.role];
            const Icon = meta.icon;
            return (
              <button
                key={entry.phone}
                id={`quick-access-${entry.role}`}
                onClick={() => onQuickAccess(entry)}
                disabled={loading}
                className={`flex items-center gap-3 rounded-xl border ${meta.border} ${meta.bg} px-4 py-3 text-left transition-all hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm`}>
                  <Icon className={`size-4 ${meta.color}`} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{entry.label}</p>
                  <p className="text-xs text-muted-foreground">{entry.sublabel}</p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── OTP step ────────────────────────────────────────────── */
function OtpStep({
  phone,
  otp,
  otpRefs,
  loading,
  success,
  otpFilled,
  onOtpChange,
  onOtpKeyDown,
  onVerify,
  onBack,
  pendingUser,
}: {
  phone: string;
  otp: string[];
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  loading: boolean;
  success: boolean;
  otpFilled: boolean;
  onOtpChange: (i: number, v: string) => void;
  onOtpKeyDown: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onVerify: () => void;
  onBack: () => void;
  pendingUser: (AuthUser & { otp: string; phone: string }) | null;
}) {
  const meta = pendingUser ? ROLE_META[pendingUser.role] : null;
  const Icon = meta?.icon;

  return (
    <div>
      {/* User preview */}
      {pendingUser && meta && Icon && (
        <div className={`mb-5 flex items-center gap-3 rounded-xl border ${meta.border} ${meta.bg} p-3`}>
          <span className={`flex size-9 items-center justify-center rounded-lg bg-background shadow-sm`}>
            <Icon className={`size-5 ${meta.color}`} />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">{pendingUser.name}</p>
            <p className="text-xs text-muted-foreground">{pendingUser.roleLabel} · {pendingUser.credential}</p>
          </div>
        </div>
      )}

      <h2 className="font-display text-xl font-semibold text-foreground">Código de verificação</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enviamos um código para <span className="font-medium text-foreground">{phone}</span>.
        <br />
        <span className="text-xs text-primary font-medium">Demo: use 123456</span>
      </p>

      <div className="mt-6">
        <div className="flex justify-center gap-2">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { otpRefs.current[i] = el; }}
              id={`otp-input-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => onOtpChange(i, e.target.value)}
              onKeyDown={(e) => onOtpKeyDown(i, e)}
              disabled={loading || success}
              className={`size-12 rounded-xl border text-center text-lg font-bold text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20
                ${success
                  ? "border-chart-2 bg-chart-2/10 text-chart-2"
                  : digit
                    ? "border-primary bg-primary/5"
                    : "border-input bg-background hover:border-primary/50"
                }`}
            />
          ))}
        </div>

        <button
          id="btn-verify-otp"
          onClick={onVerify}
          disabled={!otpFilled || loading || success}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {success ? (
            <>
              <Check className="size-4" /> Acesso liberado!
            </>
          ) : loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Verificar código <ArrowRight className="size-4" />
            </>
          )}
        </button>

        <button
          id="btn-back-to-phone"
          onClick={onBack}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
        >
          <RotateCcw className="size-3.5" /> Trocar número
        </button>
      </div>
    </div>
  );
}
