import type { ReactElement } from "react";

import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";

export const Hint = ({
  label,
  children,
}: {
  label: string;
  children: ReactElement;
}) => (
  <Tooltip>
    <TooltipTrigger render={children} />
    <TooltipPopup>{label}</TooltipPopup>
  </Tooltip>
);
