import { useCallback, useLayoutEffect, useState } from "react";

export const useTheme = () => {
    const [theme, setTheme] = useState(() => {
        try {
            return localStorage.getItem("theme") || "dark";
        } catch {
            return "dark";
        }
    });

    useLayoutEffect(() => {
        const root = document.documentElement;
        root.setAttribute("data-theme", theme);
        root.style.colorScheme = theme;

        try {
            localStorage.setItem("theme", theme);
        } catch {
            // ignore storage failures; theme stays in-memory
        }
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    }, []);

    return { theme, toggleTheme };
};
