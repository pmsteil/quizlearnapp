import Sun from "lucide-react/dist/esm/icons/sun";
import Moon from "lucide-react/dist/esm/icons/moon";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useEffect, useState } from "react";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleTheme = () => {
    console.log('Toggling theme from:', theme);
    const newTheme = theme === "light" ? "dark" : "light";
    console.log('Setting theme to:', newTheme);
    setTheme(newTheme);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
    >
      <div className="flex flex-col items-center">
        <div className="relative h-6 w-6">
          {theme === 'dark' ? (
            <Sun className="h-6 w-6 text-yellow-500" />
          ) : (
            <Moon className="h-6 w-6" />
          )}
        </div>
        <span className="text-[8px] mt-1">theme: {theme}</span>
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
