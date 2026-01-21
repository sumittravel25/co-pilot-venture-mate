import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { SubscriptionGate } from "@/components/subscription/SubscriptionGate";

export default function Chat() {
  return (
    <DashboardLayout>
      <SubscriptionGate>
        <div className="h-screen flex flex-col">
          <header className="p-6 border-b border-border">
            <h1 className="text-2xl font-semibold text-foreground">Co-Founder Chat</h1>
            <p className="text-muted-foreground mt-1">
              Get direct, honest feedback on your startup challenges
            </p>
          </header>
          <div className="flex-1 overflow-hidden">
            <ChatInterface contextType="general" />
          </div>
        </div>
      </SubscriptionGate>
    </DashboardLayout>
  );
}
