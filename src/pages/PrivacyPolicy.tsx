import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const BRAND_NAME = "SOLOAIDE";
const COMPANY_NAME = "Soloaide Technologies";
const SUPPORT_EMAIL = "support@soloaide.in";

export default function PrivacyPolicy() {
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

        <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            {COMPANY_NAME} ("we", "us", or "our") operates the {BRAND_NAME} website.
            This page informs you of our policies regarding the collection, use, and disclosure of Personal Information we receive from users of the Site.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">1. Information Collection</h2>
          <p className="text-muted-foreground leading-relaxed">
            While using our Site, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you.
            Personally identifiable information may include, but is not limited to:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Name</li>
            <li>Email Address</li>
            <li>Phone Number</li>
            <li>Payment Information (processed securely by Razorpay)</li>
          </ul>

          <h2 className="text-2xl font-semibold text-foreground mt-8">2. Log Data</h2>
          <p className="text-muted-foreground leading-relaxed">
            Like many site operators, we collect information that your browser sends whenever you visit our Site ("Log Data").
            This Log Data may include information such as your computer's Internet Protocol ("IP") address, browser type, and pages visited.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">3. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use "cookies" to collect information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            However, if you do not accept cookies, you may not be able to use some portions of our Site.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">4. Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            The security of your Personal Information is important to us, but remember that no method of transmission over the Internet is 100% secure.
            We strive to use commercially acceptable means to protect your Personal Information.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8">5. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
