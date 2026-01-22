import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const BRAND_NAME = "SOLOAIDE";
const COMPANY_NAME = "Soloaide Technologies";

export default function Terms() {
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

        <h1 className="text-4xl font-bold text-foreground mb-2">Terms & Conditions</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            Please read these Terms and Conditions ("Terms", "Terms and Conditions") carefully before using the website operated by {COMPANY_NAME}.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">1. Conditions of Use</h2>
          <p className="text-muted-foreground leading-relaxed">
            By using this website, you certify that you have read and reviewed this Agreement and that you agree to comply with its terms.
            If you do not want to be bound by the terms of this Agreement, you are advised to leave the website accordingly.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">2. User Accounts</h2>
          <p className="text-muted-foreground leading-relaxed">
            As a user of this website, you may be asked to register with us and provide private information.
            You are responsible for ensuring the accuracy of this information, and you are responsible for maintaining the safety and security of your identifying information.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">3. Intellectual Property</h2>
          <p className="text-muted-foreground leading-relaxed">
            You agree that all materials, products, and services provided on this website are the property of {COMPANY_NAME}, its affiliates, directors, officers, employees, agents, suppliers, or licensors including all copyrights, trade secrets, trademarks, patents, and other intellectual property.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">4. Applicable Law</h2>
          <p className="text-muted-foreground leading-relaxed">
            By visiting this website, you agree that the laws of India, without regard to principles of conflict laws, will govern these terms and conditions.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">5. Disputes</h2>
          <p className="text-muted-foreground leading-relaxed">
            Any dispute related in any way to your visit to this website or to products you purchase from us shall be arbitrated by state or federal court in India and you consent to exclusive jurisdiction and venue of such courts.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">6. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            {BRAND_NAME} is an AI-powered tool designed to assist founders. While we strive to provide helpful guidance, the advice and suggestions provided should not be considered as professional legal, financial, or business advice. Users should consult with qualified professionals for specific decisions.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">7. Modifications</h2>
          <p className="text-muted-foreground leading-relaxed">
            {COMPANY_NAME} reserves the right to modify these terms at any time. We will notify users of any material changes via email or through a prominent notice on our website.
          </p>
        </div>
      </div>
    </div>
  );
}
