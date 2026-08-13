"use client";

import { useState } from "react";
import { Loader2, Plus, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registrarTransaccion } from "@/services/transactions";
import { METODOS_PAGO, type MetodoPago } from "@/types/transaction";

interface TransactionFormProps {
  tasaBCV: number;
  onRegistrada: () => void;
}

export function TransactionForm({ tasaBCV, onRegistrada }: TransactionFormProps) {
  const [tipo, setTipo] = useState<"INGRESO" | "EGRESO">("INGRESO");
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("");
  const [metodo, setMetodo] = useState<MetodoPago>("EFECTIVO");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const montoNumerico = Number(monto);

  const manejarEnvio = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError("");

    if (!monto || Number.isNaN(montoNumerico) || montoNumerico <= 0) {
      setError("Ingresa un monto válido en USD.");
      return;
    }
    if (!concepto.trim()) {
      setError("Escribe un concepto para la transacción.");
      return;
    }

    setGuardando(true);
    try {
      await registrarTransaccion(
        {
          type: tipo,
          amount: montoNumerico,
          concept: concepto.trim(),
          paymentMethod: metodo,
        },
        tasaBCV
      );
      toast.success(
        tipo === "INGRESO"
          ? "Ingreso registrado correctamente"
          : "Egreso registrado correctamente"
      );
      setMonto("");
      setConcepto("");
      onRegistrada();
    } catch {
      setError("No se pudo registrar la transacción.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
      className="rounded-2xl border border-border/60 bg-white p-5 sm:p-6"
    >
      <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Registrar transacción
      </h2>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant={tipo === "INGRESO" ? "default" : "outline"}
          className="h-12"
          onClick={() => setTipo("INGRESO")}
          aria-pressed={tipo === "INGRESO"}
        >
          <ArrowDownCircle className="mr-2 h-4 w-4" aria-hidden="true" />
          Ingreso
        </Button>
        <Button
          type="button"
          variant={tipo === "EGRESO" ? "default" : "outline"}
          className="h-12"
          onClick={() => setTipo("EGRESO")}
          aria-pressed={tipo === "EGRESO"}
        >
          <ArrowUpCircle className="mr-2 h-4 w-4" aria-hidden="true" />
          Egreso
        </Button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="transaccion-monto">Monto (USD) *</Label>
          <Input
            id="transaccion-monto"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={monto}
            onChange={(evento) => setMonto(evento.target.value)}
            placeholder="5.00"
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transaccion-metodo">Método de pago</Label>
          <Select value={metodo} onValueChange={(v) => setMetodo(v as MetodoPago)}>
            <SelectTrigger id="transaccion-metodo" className="h-12 text-base">
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              {METODOS_PAGO.map((metodoPago) => (
                <SelectItem key={metodoPago.valor} value={metodoPago.valor}>
                  {metodoPago.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="transaccion-concepto">Concepto *</Label>
        <Input
          id="transaccion-concepto"
          value={concepto}
          onChange={(evento) => setConcepto(evento.target.value)}
          placeholder={
            tipo === "INGRESO"
              ? "Ej. Venta directa caja 1"
              : "Ej. Compra de leche"
          }
          className="h-12 text-base"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="mt-5 h-12 w-full"
        disabled={guardando}
      >
        {guardando ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
        )}
        Registrar
      </Button>
    </form>
  );
}
