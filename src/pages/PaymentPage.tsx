import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPayments, payPayment } from "@/lib/api";
import { ArrowLeft, HelpCircle, CreditCard, Building2, Smartphone, Landmark, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PaymentPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [method, setMethod] = useState("upi");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const { data: payments = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: getPayments,
  });

  const pendingPayments = payments.filter(p => p.status === "Pending");
  const total = pendingPayments.reduce((s, p) => s + p.amount, 0);

  const mutation = useMutation({
    mutationFn: async () => {
      const txId = `TRX-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const paymentDate = new Date().toLocaleString();
      const paymentMethod =
        method === "upi" ? "UPI" : method === "card" ? `•••• ${cardNumber.slice(-4)}` : "Net Banking";

      await Promise.all(
        pendingPayments.map(p =>
          payPayment(p.id, { status: "Paid", transaction_id: txId, payment_date: paymentDate, payment_method: paymentMethod })
        )
      );

      return {
        txId,
        amount: total,
        method: paymentMethod,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      navigate("/payment/success", {
        state: { txId: result.txId, amount: result.amount, method: result.method },
      });
    },
    onError: () => {
      toast({ title: "Payment failed", description: "Could not process payment. Try again.", variant: "destructive" });
    },
  });

  const handlePay = () => {
    if (method === "card" && (!cardName || !cardNumber || !expiry || !cvv)) {
      toast({ title: "Missing card details", variant: "destructive" });
      return;
    }
    if (total === 0) {
      toast({ title: "No pending payments", variant: "destructive" });
      return;
    }
    mutation.mutate();
  };

  const methods = [
    { id: "upi", icon: Smartphone, label: "UPI", sub: "GPay, PhonePe, Paytm" },
    { id: "card", icon: CreditCard, label: "Credit / Debit Card", sub: "Visa, Mastercard, Amex" },
    { id: "netbanking", icon: Landmark, label: "Net Banking", sub: "Directly from your bank" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card px-4 py-3 flex items-center justify-between border-b border-border">
        <button onClick={() => navigate(-1)} className="text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <span className="font-semibold text-card-foreground">Maintenance Payment</span>
        <HelpCircle className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Payment Summary */}
        <div>
          <h2 className="font-bold text-foreground text-lg">Payment Summary</h2>
          <div className="bg-card rounded-xl p-4 mt-3 shadow-sm border border-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-primary uppercase">
                  Due by {pendingPayments[0]?.due_date || "N/A"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Total Outstanding</p>
                <p className="text-3xl font-bold text-foreground">
                  ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Unit {user?.unit}, Building B
                </p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <h2 className="font-bold text-foreground text-lg">Select Payment Method</h2>
          <div className="mt-3 space-y-2">
            {methods.map(m => (
              <button key={m.id} onClick={() => setMethod(m.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors ${method === m.id ? "border-primary bg-primary/5" : "border-input bg-card"}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === m.id ? "border-primary" : "border-muted-foreground"}`}>
                  {method === m.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <m.icon className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Card Details */}
        {method === "card" && (
          <div className="bg-card rounded-xl p-5 border border-border space-y-4">
            <h3 className="font-bold text-foreground">Card Details</h3>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Cardholder Name</label>
              <input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="John Doe"
                className="w-full mt-1 px-4 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Card Number</label>
              <div className="relative">
                <input value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="XXXX XXXX XXXX XXXX"
                  className="w-full mt-1 px-4 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring pr-10" />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground mt-0.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Expiry Date</label>
                <input value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM/YY"
                  className="w-full mt-1 px-4 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">CVV</label>
                <input value={cvv} onChange={e => setCvv(e.target.value)} placeholder="***" type="password"
                  className="w-full mt-1 px-4 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          </div>
        )}

        <button onClick={handlePay} disabled={mutation.isPending || total === 0}
          className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
          {mutation.isPending ? "Processing..." : "Confirm Payment"}{!mutation.isPending && <Lock className="w-4 h-4" />}
        </button>
        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" /> Secure 256-bit SSL encrypted payment
        </p>
      </div>
    </div>
  );
};

export default PaymentPage;
