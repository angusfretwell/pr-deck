import { createContext, useContext, useRef, type ComponentProps, type ReactNode } from "react";
import { useMediaQuery } from "usehooks-ts";
import {
  Drawer,
  DrawerClose,
  DrawerMenu,
  DrawerMenuCheckboxItem,
  DrawerMenuGroup,
  DrawerMenuGroupLabel,
  DrawerMenuItem,
  DrawerMenuRadioGroup,
  DrawerMenuRadioItem,
  DrawerMenuSeparator,
  DrawerPanel,
  DrawerPopup,
  DrawerPrimitive,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";

const SheetContext = createContext<{ close: () => void } | null>(null);

interface ResponsiveMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function ResponsiveMenu({ open, onOpenChange, children }: ResponsiveMenuProps) {
  const desktop = useMediaQuery("(min-width: 768px)");
  const drawer = useRef<DrawerPrimitive.Root.Actions>(null);
  if (desktop) {
    return (
      <Menu open={open} onOpenChange={onOpenChange}>
        {children}
      </Menu>
    );
  }
  return (
    <SheetContext.Provider value={{ close: () => drawer.current?.close() }}>
      <Drawer open={open} onOpenChange={onOpenChange} actionsRef={drawer}>
        {children}
      </Drawer>
    </SheetContext.Provider>
  );
}

export function ResponsiveMenuTrigger(
  props: ComponentProps<typeof MenuTrigger> & ComponentProps<typeof DrawerTrigger>,
) {
  return useContext(SheetContext) ? <DrawerTrigger {...props} /> : <MenuTrigger {...props} />;
}

interface ResponsiveMenuPopupProps {
  align?: "start" | "center" | "end";
  className?: string;
  children: ReactNode;
}

export function ResponsiveMenuPopup({ align, className, children }: ResponsiveMenuPopupProps) {
  if (!useContext(SheetContext)) {
    return (
      <MenuPopup align={align} className={className}>
        {children}
      </MenuPopup>
    );
  }
  return (
    <DrawerPopup showBar>
      <DrawerPanel>
        <DrawerMenu>{children}</DrawerMenu>
      </DrawerPanel>
    </DrawerPopup>
  );
}

export function ResponsiveMenuGroup({ children }: { children: ReactNode }) {
  const Group = useContext(SheetContext) ? DrawerMenuGroup : MenuGroup;
  return <Group>{children}</Group>;
}

export function ResponsiveMenuGroupLabel({ children }: { children: ReactNode }) {
  const GroupLabel = useContext(SheetContext) ? DrawerMenuGroupLabel : MenuGroupLabel;
  return <GroupLabel>{children}</GroupLabel>;
}

export function ResponsiveMenuSeparator() {
  return useContext(SheetContext) ? <DrawerMenuSeparator /> : <MenuSeparator />;
}

interface ResponsiveMenuRadioGroupProps<Value extends string> {
  value: Value;
  onValueChange: (value: Value) => void;
  children: ReactNode;
}

export function ResponsiveMenuRadioGroup<Value extends string>({
  value,
  onValueChange,
  children,
}: ResponsiveMenuRadioGroupProps<Value>) {
  const RadioGroup = useContext(SheetContext) ? DrawerMenuRadioGroup : MenuRadioGroup;
  return (
    <RadioGroup value={value} onValueChange={(next) => onValueChange(next as Value)}>
      {children}
    </RadioGroup>
  );
}

export function ResponsiveMenuRadioItem({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  const sheet = useContext(SheetContext);
  if (sheet) {
    return (
      <DrawerMenuRadioItem value={value} onClick={sheet.close}>
        {children}
      </DrawerMenuRadioItem>
    );
  }
  return (
    <MenuRadioItem value={value} closeOnClick className="grid-cols-[.75rem_minmax(0,1fr)]">
      {children}
    </MenuRadioItem>
  );
}

interface ResponsiveMenuCheckboxItemProps {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: ReactNode;
}

export function ResponsiveMenuCheckboxItem(props: ResponsiveMenuCheckboxItemProps) {
  return useContext(SheetContext) ? (
    <DrawerMenuCheckboxItem {...props} />
  ) : (
    <MenuCheckboxItem {...props} className="grid-cols-[.75rem_minmax(0,1fr)]" />
  );
}

export function ResponsiveMenuItem({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return useContext(SheetContext) ? (
    <DrawerClose render={<DrawerMenuItem />} onClick={onClick}>
      {children}
    </DrawerClose>
  ) : (
    <MenuItem onClick={onClick}>{children}</MenuItem>
  );
}
