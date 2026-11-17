import { createContext, useContext, useState, type ComponentProps, type ReactNode } from "react";
import { useMediaQuery } from "usehooks-ts";
import {
  Drawer,
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
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";

const ResponsiveMenuContext = createContext({ drawer: false, close: () => {} });

interface ResponsiveMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function ResponsiveMenu({ open: openProp, onOpenChange, children }: ResponsiveMenuProps) {
  const drawer = !useMediaQuery("(min-width: 768px)");
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const Root = drawer ? Drawer : Menu;
  return (
    <ResponsiveMenuContext value={{ drawer, close: () => setOpen(false) }}>
      <Root open={openProp ?? uncontrolledOpen} onOpenChange={setOpen}>
        {children}
      </Root>
    </ResponsiveMenuContext>
  );
}

export function ResponsiveMenuTrigger(
  props: Omit<ComponentProps<typeof MenuTrigger>, "handle" | "payload">,
) {
  const { drawer } = useContext(ResponsiveMenuContext);
  return drawer ? <DrawerTrigger {...props} /> : <MenuTrigger {...props} />;
}

export function ResponsiveMenuPopup({ children, ...props }: ComponentProps<typeof MenuPopup>) {
  const { drawer } = useContext(ResponsiveMenuContext);
  if (!drawer) return <MenuPopup {...props}>{children}</MenuPopup>;
  return (
    <DrawerPopup showBar>
      <DrawerPanel>
        <DrawerMenu>{children}</DrawerMenu>
      </DrawerPanel>
    </DrawerPopup>
  );
}

export function ResponsiveMenuGroup({ children }: { children: ReactNode }) {
  const { drawer } = useContext(ResponsiveMenuContext);
  return drawer ? <DrawerMenuGroup>{children}</DrawerMenuGroup> : <MenuGroup>{children}</MenuGroup>;
}

export function ResponsiveMenuGroupLabel({ children }: { children: ReactNode }) {
  const { drawer } = useContext(ResponsiveMenuContext);
  return drawer ? (
    <DrawerMenuGroupLabel>{children}</DrawerMenuGroupLabel>
  ) : (
    <MenuGroupLabel>{children}</MenuGroupLabel>
  );
}

export function ResponsiveMenuSeparator() {
  const { drawer } = useContext(ResponsiveMenuContext);
  return drawer ? <DrawerMenuSeparator /> : <MenuSeparator />;
}

interface ResponsiveMenuRadioGroupProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  children: ReactNode;
}

export function ResponsiveMenuRadioGroup<T extends string>({
  value,
  onValueChange,
  children,
}: ResponsiveMenuRadioGroupProps<T>) {
  const { drawer } = useContext(ResponsiveMenuContext);
  const Group = drawer ? DrawerMenuRadioGroup : MenuRadioGroup;
  return (
    <Group value={value} onValueChange={(next) => onValueChange(next as T)}>
      {children}
    </Group>
  );
}

interface ResponsiveMenuRadioItemProps {
  value: string;
  closeOnClick?: boolean;
  className?: string;
  children: ReactNode;
}

export function ResponsiveMenuRadioItem({ closeOnClick, ...props }: ResponsiveMenuRadioItemProps) {
  const { drawer, close } = useContext(ResponsiveMenuContext);
  return drawer ? (
    <DrawerMenuRadioItem {...props} onClick={closeOnClick ? close : undefined} />
  ) : (
    <MenuRadioItem {...props} closeOnClick={closeOnClick} />
  );
}

interface ResponsiveMenuCheckboxItemProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export function ResponsiveMenuCheckboxItem(props: ResponsiveMenuCheckboxItemProps) {
  const { drawer } = useContext(ResponsiveMenuContext);
  return drawer ? <DrawerMenuCheckboxItem {...props} /> : <MenuCheckboxItem {...props} />;
}

export function ResponsiveMenuItem({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  const { drawer, close } = useContext(ResponsiveMenuContext);
  if (!drawer) return <MenuItem onClick={onClick}>{children}</MenuItem>;
  return (
    <DrawerMenuItem
      onClick={() => {
        onClick();
        close();
      }}
    >
      {children}
    </DrawerMenuItem>
  );
}

interface ResponsiveMenuLinkItemProps {
  href: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
  children: ReactNode;
}

export function ResponsiveMenuLinkItem({ onClick, ...props }: ResponsiveMenuLinkItemProps) {
  const { drawer, close } = useContext(ResponsiveMenuContext);
  if (!drawer) return <MenuLinkItem {...props} onClick={onClick} />;
  const { children, ...link } = props;
  return (
    <DrawerMenuItem
      render={<a {...link} />}
      onClick={() => {
        onClick?.();
        close();
      }}
    >
      {children}
    </DrawerMenuItem>
  );
}
