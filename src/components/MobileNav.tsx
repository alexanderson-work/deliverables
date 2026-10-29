import { useState } from "react";
import { Button } from "@noorddev/vlak-react/components/button";
import { Icon } from "@noorddev/vlak-react/components/icon";
import { Sheet, SheetTitle } from "@noorddev/vlak-react/components/sheet";
import { SidebarItem, SidebarLabel } from "@noorddev/vlak-react/components/sidebar";
import { ThemeToggle } from "@noorddev/vlak-react/components/theme-toggle";
import type { NavGroup } from "./ClientNav";

interface Props {
  clientName: string;
  home: string;
  here: string;
  current: string;
  groups: NavGroup[];
  studio: { name: string; url: string };
  /** The client's lockup, one file per scheme. */
  logo?: { light: string; dark: string };
}

/** Phone and tablet chrome: name, current page, and one menu button. */
export default function MobileNav({ clientName, home, here, current, groups, studio, logo }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mobile-bar">
      <a className="mobile-bar-name" href={home}>
        {logo ? (
          <>
            <img className="lockup only-light" src={logo.light} alt={clientName} />
            <img className="lockup only-dark" src={logo.dark} alt={clientName} />
          </>
        ) : (
          clientName
        )}
      </a>
      <span className="mobile-bar-here">{here}</span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Icon name="menu" size={24} aria-hidden="true" />
      </Button>
      <Sheet
        className="mobile-menu"
        side="left"
        open={open}
        onClose={() => setOpen(false)}
        closeLabel="Close menu"
        lightDismiss
      >
        <SheetTitle>{clientName}</SheetTitle>
        <nav aria-label="Client space">
          {groups.map((group, i) => (
            <div key={group.label ?? i} style={{ display: "contents" }}>
              {group.label && <SidebarLabel>{group.label}</SidebarLabel>}
              {group.items.map((item) => (
                <SidebarItem key={item.href} href={item.href} current={item.href === current}>
                  {item.label}
                </SidebarItem>
              ))}
            </div>
          ))}
        </nav>
        <div className="mobile-menu-foot">
          <a href={studio.url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
            {studio.name}
          </a>
          <ThemeToggle className="rs-theme-toggle-inline" />
        </div>
      </Sheet>
    </div>
  );
}
