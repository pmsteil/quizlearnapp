import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginDialog } from "./LoginDialog";
import { SignupDialog } from "./SignupDialog";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "signup")} className="w-[400px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <LoginDialog open={open && activeTab === "login"} onOpenChange={onOpenChange} />
      </TabsContent>
      <TabsContent value="signup">
        <SignupDialog open={open && activeTab === "signup"} onOpenChange={onOpenChange} />
      </TabsContent>
    </Tabs>
  );
}
