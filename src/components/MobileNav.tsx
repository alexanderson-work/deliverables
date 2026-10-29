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
  /** The studio's contact link, with a photo. */
  contact: { name: string; photo: string; href: string };
  /** The client's lockup, one file per scheme. */
  logo?: { light: string; dark: string };
}

/** Phone and tablet chrome: name, current page, search, and the menu. */
export default function MobileNav({ clientName, home, here, current, groups, contact, logo }: Props) {
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
      <div className="mobile-bar-actions">
        {/* Search.tsx opens on any [data-search-open]. */}
        <Button variant="ghost" size="icon" aria-label="Search" aria-haspopup="dialog" data-search-open>
          <Icon name="search" size={24} aria-hidden="true" />
        </Button>
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
      </div>
      <Sheet
        className="mobile-menu"
        side="left"
        open={open}
        onClose={() => setOpen(false)}
        closeLabel="Close menu"
        lightDismiss
      >
        <SheetTitle>{clientName}</SheetTitle>
        {/* The menu opens focused on its list, not the close button, so no focus
            ring shows on open (Safari draws one); Tab moves on to the links. */}
        <nav aria-label="Client space" tabIndex={-1} ref={(nav) => nav?.setAttribute("autofocus", "")}>
          {groups.map((group, i) => (
            <div key={group.label ?? i} style={{ display: "contents" }}>
              {group.label && <SidebarLabel>{group.label}</SidebarLabel>}
              {group.items.map((item) => (
                <SidebarItem key={item.href} href={item.href} current={item.href === current}>
                  {item.label}
                  {item.href === current && <span className="nav-current" aria-hidden="true" />}
                </SidebarItem>
              ))}
            </div>
          ))}
        </nav>
        <div className="mobile-menu-foot">
          <a className="contact-card" href={contact.href}>
            <img src={contact.photo} alt="" width={32} height={32} />
            <span>
              <strong>{contact.name}</strong>
              <span>Questions? Email me</span>
            </span>
          </a>
          <ThemeToggle className="rs-theme-toggle-inline" />
        </div>
      </Sheet>
    </div>
  );
}
