import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Download, Building2 } from "lucide-react";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { txId, amount, method } = (location.state as { txId: string; amount: number; method: string }) || { txId: "N/A", amount: 0, method: "N/A" };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card px-4 py-3 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate("/dashboard")} className="text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <span className="font-semibold text-card-foreground">Payment Confirmation</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Payment Successful</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">Your monthly rent for Unit 402 has been processed and confirmed.</p>

        <div className="bg-card rounded-xl p-5 mt-8 w-full shadow-sm border border-border">
          <div className="space-y-3 text-sm">
            {[
              ["Transaction ID", `#${txId}`],
              ["Payment Date", new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) + " • " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })],
              ["Payment Method", `💳 ${method}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground">{value}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="font-medium text-foreground">Total Amount</span>
              <span className="font-bold text-primary text-lg">${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 w-full space-y-3">
          <button className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> Download Receipt
          </button>
          <button onClick={() => navigate("/dashboard")} className="w-full py-3.5 border border-input text-foreground rounded-xl font-medium text-sm flex items-center justify-center gap-2">
            <Building2 className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">Need help with your payment? <button className="text-primary font-medium underline">Contact Support</button></p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
