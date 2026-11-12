import { useState, useEffect } from "react";
import { Palette } from "lucide-react";

const themeColors = [
  { name: "Default Blue", primary: "222.2 47.4% 11.2%", accent: "210 40% 96.1%" },
  { name: "Purple", primary: "271 91% 65%", accent: "270 100% 98%" },
  { name: "Green", primary: "142 71% 45%", accent: "138 76% 97%" },
  { name: "Orange", primary: "25 95% 53%", accent: "33 100% 96%" },
  { name: "Pink", primary: "330 81% 60%", accent: "326 100% 97%" },
  { name: "Teal", primary: "173 80% 40%", accent: "180 100% 97%" },
];

export const ThemeColorPicker = () => {
  const [selectedColor, setSelectedColor] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme-color");
    if (saved) {
      const index = parseInt(saved);
      setSelectedColor(index);
      applyTheme(index);
    }
  }, []);

  const applyTheme = (index: number) => {
    const theme = themeColors[index];
    document.documentElement.style.setProperty("--primary", theme.primary);
    document.documentElement.style.setProperty("--accent", theme.accent);
  };

  const handleColorChange = (index: number) => {
    setSelectedColor(index);
    applyTheme(index);
    localStorage.setItem("theme-color", index.toString());
  };

  return (
    <div className="fixed top-6 right-6 z-50 bg-card/80 backdrop-blur-sm border border-border rounded-full p-3 shadow-lg">
      <div className="flex items-center gap-2">
        <button onClick={() => setIsOpen(!isOpen)} className="hover:opacity-70 transition-opacity">
          <Palette className="w-4 h-4 text-muted-foreground" />
        </button>
        {isOpen && (
          <div className="flex gap-2">
            {themeColors.map((color, index) => (
              <button
                key={index}
                onClick={() => handleColorChange(index)}
                className={`w-6 h-6 rounded-full transition-all hover:scale-110 ${
                  selectedColor === index ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                }`}
                style={{ backgroundColor: `hsl(${color.primary})` }}
                title={color.name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
