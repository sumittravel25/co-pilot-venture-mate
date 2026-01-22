import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

const BRAND_NAME = "SOLOAIDE";
const SUPPORT_EMAIL = "support@soloaide.in";
const SUPPORT_PHONE = "+91 9439044619";

export default function RefundPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-4xl font-bold text-foreground mb-2">Cancellation & Refund Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            At {BRAND_NAME}, we strive to ensure our AI tools provide value to your founder journey.
            However, we understand that things don't always work out. Please read our policy below carefully.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">1. Cancellation</h2>
          <p className="text-muted-foreground leading-relaxed">
            You may cancel your subscription at any time via your account settings.
            Cancellation will be effective at the end of your current billing cycle. You will retain access to premium features until that time.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">2. Refunds</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>
              <strong>7-Day Money-Back Guarantee:</strong> If you are unhappy with the service, you may request a full refund within 7 days of your initial purchase.
            </li>
            <li>
              To request a refund, please contact us at{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
                {SUPPORT_EMAIL}
              </a>{" "}
              with your order details.
            </li>
            <li>
              Refund requests made after the 7-day window will be handled on a case-by-case basis and are not guaranteed.
            </li>
          </ul>

          <h2 className="text-2xl font-semibold text-foreground mt-8">3. Processing Time</h2>
          <p className="text-muted-foreground leading-relaxed">
            Once your refund is approved, we will initiate a refund to your original method of payment (Credit Card, UPI, etc.).
          </p>
          <Card className="bg-muted/50 border-border">
            <CardContent className="p-4">
              <p className="text-muted-foreground">
                You will receive the credit within 5 to 7 working days, depending on your card issuer's policies.
              </p>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold text-foreground mt-8">4. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about our Refunds & Cancellation Policy, please contact us:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>
              By email:{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
                {SUPPORT_EMAIL}
              </a>
            </li>
            <li>By phone: {SUPPORT_PHONE}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
