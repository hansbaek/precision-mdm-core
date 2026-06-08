import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "./use-theme";

const ThemeIcon = () => {
  const { theme, setTheme } = useTheme();

  const handleClickThemeIcon = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };
  return (
    <div
      onClick={handleClickThemeIcon}
      className="text-slate-700  hover:text-orange-600 transition-all cursor-pointer dark:text-white"
    >
      {theme === "light" ? <SunIcon /> : <MoonIcon />}
    </div>
  );
};

export default ThemeIcon;
