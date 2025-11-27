import { LojistaFinancials } from "@/lib/types"
import clsx from "clsx"
import { AlertTriangle, PiggyBank } from "lucide-react"
import { ReactNode } from "react"

type FinancialWalletWidgetProps = {
  financials?: LojistaFinancials | null
  isSandbox?: boolean
  isLoading?: boolean
  className?: string
  footerSlot?: ReactNode
}

const PLAN_LABEL: Record<LojistaFinancials["plan_tier"], string> = {
  micro: "Plano Impulso",
  growth: "Plano Lojista",
  enterprise: "Plano Enterprise",
}

const BILLING_STATUS_LABEL: Record<LojistaFinancials["billing_status"], string> = {
  active: "Carteira em dia",
  frozen: "Cobrança pendente",
}

function formatCredits(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function FinancialWalletWidget({
  financials,
  isSandbox = false,
  isLoading = false,
  className,
  footerSlot,
}: FinancialWalletWidgetProps) {
  if (isLoading) {
    return (
      <div
        className={clsx(
          "rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-sm animate-pulse",
          className
        )}
      >
        <div className="h-4 w-28 rounded-full bg-white/20" />
        <div className="mt-4 h-10 w-3/5 rounded-xl bg-white/10" />
        <div className="mt-8 h-4 w-full rounded-full bg-white/10" />
      </div>
    )
  }

  if (!financials) {
    return (
      <div
        className={clsx(
          "rounded-3xl border border-dashed border-white/20 bg-gradient-to-br from-slate-900 via-slate-900/70 to-slate-800 p-6 text-white shadow-2xl backdrop-blur",
          className
        )}
      >
        <p className="text-lg font-semibold">Carteira financeira não configurada</p>
        <p className="mt-2 text-sm text-white/70">
          Cadastre o saldo inicial no painel administrativo para liberar a geração de looks.
        </p>
      </div>
    )
  }

  const sandboxLabel = isSandbox ? "Sandbox" : PLAN_LABEL[financials.plan_tier]
  const lowBalanceThreshold = Math.max(10, Math.round(financials.overdraft_limit * 0.25))

  const status =
    financials.billing_status === "frozen"
      ? "blocked"
      : financials.credits_balance <= 0
      ? "overdraft"
      : financials.credits_balance <= lowBalanceThreshold
      ? "low"
      : "healthy"

  const statusConfig: Record<
    "healthy" | "low" | "overdraft" | "blocked",
    { label: string; description: string; badgeClass: string }
  > = {
    healthy: {
      label: "Saldo saudável",
      description: "Você está pronto para gerar looks ilimitadamente.",
      badgeClass: "bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-500/30",
    },
    low: {
      label: "Saldo baixo",
      description: "Recarregue em breve para evitar interrupções.",
      badgeClass: "bg-amber-400/20 text-amber-100 ring-1 ring-amber-400/40",
    },
    overdraft: {
      label: "Usando Overdraft",
      description: "Você está usando crédito emergencial.",
      badgeClass: "bg-rose-500/20 text-rose-100 ring-1 ring-rose-500/40",
    },
    blocked: {
      label: "Cobrança pendente",
      description: "Regularize o pagamento para liberar novas gerações.",
      badgeClass: "bg-rose-600/20 text-rose-50 ring-1 ring-rose-500/40",
    },
  }

  const statusData = statusConfig[status]
  const totalCapacity = Math.max(financials.credits_balance + financials.overdraft_limit, 1)
  const availablePercent = Math.min(100, Math.max(0, (financials.credits_balance / totalCapacity) * 100))
  const overdraftUsage =
    financials.credits_balance >= 0 || financials.overdraft_limit === 0
      ? 0
      : Math.min(100, (Math.abs(financials.credits_balance) / financials.overdraft_limit) * 100)

  return (
    <div
      className={clsx(
        "rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/70 to-slate-800 p-6 text-white shadow-2xl backdrop-blur",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">Carteira de Créditos</p>
          <p className="mt-1 text-4xl font-semibold leading-tight">{formatCredits(financials.credits_balance)} créditos</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-sm">
          <span className="rounded-full bg-white/10 px-4 py-1 font-medium text-white/70">{sandboxLabel}</span>
          <span className={clsx("rounded-full px-4 py-1 text-xs font-semibold", statusData.badgeClass)}>
            {statusData.label}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-6 text-sm text-white/70">
        <Metric label="Overdraft" value={`${formatCredits(financials.overdraft_limit)} créditos`} />
        <Metric label="Status de cobrança" value={BILLING_STATUS_LABEL[financials.billing_status]} />
        <Metric
          label="Overdraft em uso"
          value={
            overdraftUsage === 0
              ? "Nenhum"
              : `${overdraftUsage.toFixed(0)}% (${formatCredits(Math.abs(financials.credits_balance))} créditos)`
          }
        />
      </div>

      <div className="mt-6 h-1.5 rounded-full bg-white/10">
        <div
          className={clsx("h-full rounded-full", {
            "bg-emerald-400": status === "healthy",
            "bg-amber-400": status === "low",
            "bg-rose-500": status === "overdraft" || status === "blocked",
          })}
          style={{ width: `${availablePercent}%` }}
        />
      </div>

      {(status === "overdraft" || status === "blocked") && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
          <div>
            <p className="font-semibold text-white">{statusData.label}</p>
            <p>{statusData.description}</p>
          </div>
        </div>
      )}

      {footerSlot ? (
        <div className="mt-6">{footerSlot}</div>
      ) : (
        <div className="mt-6 flex items-center gap-2 text-sm text-white/70">
          <PiggyBank className="h-4 w-4 text-white/50" />
          {isSandbox ? (
            <span>Sandbox ativo. Créditos não serão consumidos durante os testes.</span>
          ) : (
            <span>{statusData.description}</span>
          )}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-white/40">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  )
}

