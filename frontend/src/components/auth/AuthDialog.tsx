import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LoginDialog } from "./LoginDialog";
import { SignupDialog } from "./SignupDialog";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "signup")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <div className="px-6 py-4">
            <TabsContent value="login" className="mt-0 min-h-[380px]">
              <LoginDialog />
            </TabsContent>
            <TabsContent value="signup" className="mt-0 min-h-[380px]">
              <SignupDialog />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
