import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTheme, setTheme } from "@/lib/theme";

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(true);
  useEffect(() => { setDark(getTheme() === "dark"); }, []);
  return <Button variant="ghost" size="icon" className={className} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={() => { setTheme(dark ? "light" : "dark"); setDark(!dark); }}>{dark ? <Sun /> : <Moon />}</Button>;
}
