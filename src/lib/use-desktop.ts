import { useMediaQuery } from "usehooks-ts";

export const useDesktop = () => useMediaQuery("(min-width: 768px)");
