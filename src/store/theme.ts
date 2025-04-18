import { atomWithStorage } from "jotai/utils";

type Theme = "light" | "dark";

export const themeAtom = atomWithStorage<Theme>("theme", "light");
