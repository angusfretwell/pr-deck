import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ComponentProps, ReactNode } from "react";

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
import { useDesktop } from "@/lib/use-desktop";

interface ResponsiveMenuContextValue {
  drawer: boolean;
  close?: () => void;
}

const ResponsiveMenuContext = createContext<ResponsiveMenuContextValue>({
  drawer: false,
});

interface ResponsiveMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export const ResponsiveMenu = ({
  open: openProp,
  onOpenChange,
  children,
}: ResponsiveMenuProps) => {
  const desktop = useDesktop();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const setOpen = useCallback(
    (next: boolean) => {
      setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange]
  );

  const context = useMemo(
    () => ({
      drawer: !desktop,
      close: () => {
        setOpen(false);
      },
    }),
    [desktop, setOpen]
  );

  const Root = desktop ? Menu : Drawer;

  return (
    <ResponsiveMenuContext value={context}>
      <Root open={openProp ?? uncontrolledOpen} onOpenChange={setOpen}>
        {children}
      </Root>
    </ResponsiveMenuContext>
  );
};

export const ResponsiveMenuTrigger = (
  props: Omit<ComponentProps<typeof MenuTrigger>, "handle" | "payload">
) => {
  const { drawer } = useContext(ResponsiveMenuContext);

  return drawer ? <DrawerTrigger {...props} /> : <MenuTrigger {...props} />;
};

export const ResponsiveMenuPopup = ({
  children,
  ...props
}: ComponentProps<typeof MenuPopup>) => {
  const { drawer } = useContext(ResponsiveMenuContext);

  if (!drawer) {
    return <MenuPopup {...props}>{children}</MenuPopup>;
  }

  return (
    <DrawerPopup showBar backdropProps={{ forceRender: true }}>
      <DrawerPanel>
        <DrawerMenu>{children}</DrawerMenu>
      </DrawerPanel>
    </DrawerPopup>
  );
};

export const ResponsiveMenuGroup = ({ children }: { children: ReactNode }) => {
  const { drawer } = useContext(ResponsiveMenuContext);

  return drawer ? (
    <DrawerMenuGroup>{children}</DrawerMenuGroup>
  ) : (
    <MenuGroup>{children}</MenuGroup>
  );
};

export const ResponsiveMenuGroupLabel = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { drawer } = useContext(ResponsiveMenuContext);

  return drawer ? (
    <DrawerMenuGroupLabel>{children}</DrawerMenuGroupLabel>
  ) : (
    <MenuGroupLabel>{children}</MenuGroupLabel>
  );
};

export const ResponsiveMenuSeparator = () => {
  const { drawer } = useContext(ResponsiveMenuContext);

  return drawer ? <DrawerMenuSeparator /> : <MenuSeparator />;
};

interface ResponsiveMenuRadioGroupProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  children: ReactNode;
}

export const ResponsiveMenuRadioGroup = <T extends string>({
  value,
  onValueChange,
  children,
}: ResponsiveMenuRadioGroupProps<T>) => {
  const { drawer } = useContext(ResponsiveMenuContext);
  const Group = drawer ? DrawerMenuRadioGroup : MenuRadioGroup;

  return (
    <Group
      value={value}
      onValueChange={(next: T) => {
        onValueChange(next);
      }}
    >
      {children}
    </Group>
  );
};

interface ResponsiveMenuRadioItemProps {
  value: string;
  closeOnClick?: boolean;
  className?: string;
  children: ReactNode;
}

export const ResponsiveMenuRadioItem = ({
  closeOnClick,
  ...props
}: ResponsiveMenuRadioItemProps) => {
  const { drawer, close } = useContext(ResponsiveMenuContext);

  return drawer ? (
    <DrawerMenuRadioItem
      {...props}
      onClick={closeOnClick === true ? close : undefined}
    />
  ) : (
    <MenuRadioItem {...props} closeOnClick={closeOnClick} />
  );
};

interface ResponsiveMenuCheckboxItemProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export const ResponsiveMenuCheckboxItem = (
  props: ResponsiveMenuCheckboxItemProps
) => {
  const { drawer } = useContext(ResponsiveMenuContext);

  return drawer ? (
    <DrawerMenuCheckboxItem {...props} />
  ) : (
    <MenuCheckboxItem {...props} />
  );
};

export const ResponsiveMenuItem = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) => {
  const { drawer, close } = useContext(ResponsiveMenuContext);

  if (!drawer) {
    return <MenuItem onClick={onClick}>{children}</MenuItem>;
  }

  return (
    <DrawerMenuItem
      onClick={() => {
        onClick();
        close?.();
      }}
    >
      {children}
    </DrawerMenuItem>
  );
};

interface ResponsiveMenuLinkItemProps {
  href: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
  children: ReactNode;
}

export const ResponsiveMenuLinkItem = ({
  onClick,
  ...props
}: ResponsiveMenuLinkItemProps) => {
  const { drawer, close } = useContext(ResponsiveMenuContext);

  if (!drawer) {
    return <MenuLinkItem {...props} onClick={onClick} />;
  }

  const { children, ...link } = props;

  return (
    <DrawerMenuItem
      render={<a {...link} />}
      onClick={() => {
        onClick?.();
        close?.();
      }}
    >
      {children}
    </DrawerMenuItem>
  );
};
