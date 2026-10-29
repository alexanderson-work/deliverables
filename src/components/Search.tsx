import * as React from "react";
import { navigate } from "astro:transitions/client";
import { Command, type CommandGroup, type CommandItem } from "@noorddev/vlak-react/components/command";
import { Dialog } from "@noorddev/vlak-react/components/dialog";
import { Icon } from "@noorddev/vlak-react/components/icon";
import type MiniSearch from "minisearch";
import type { SearchRecord } from "../lib/search-index";

interface Props {
  /** The client's index, built by [client]/search.json. */
  index: string;
  clientName: string;
}

interface Engine {
  mini: MiniSearch<SearchRecord>;
  records: SearchRecord[];
}

const words = (text: string) => text.split(/[\n\r\p{Z}\p{P}]+/u).filter(Boolean);
// "WithMouseParallax" is also "with", "mouse", and "parallax".
const camelParts = (word: string) => {
  const parts = word.split(/(?<=\p{Ll})(?=\p{Lu})/u);
  return parts.length > 1 ? [word, ...parts] : [word];
};

// One index per client, fetched the first time it's needed and kept for the visit.
const engines = new Map<string, Promise<Engine>>();
function load(index: string) {
  let engine = engines.get(index);
  if (!engine) {
    engine = Promise.all([
      fetch(index).then((response) => {
        if (!response.ok) throw new Error(`Search index: ${response.status}`);
        return response.json() as Promise<SearchRecord[]>;
      }),
      import("minisearch"),
    ]).then(([records, { default: MiniSearch }]) => {
      const mini = new MiniSearch<SearchRecord>({
        fields: ["title", "context", "text", "keywords"],
        tokenize: (text) => words(text).flatMap(camelParts),
        searchOptions: {
          tokenize: words,
          boost: { title: 4, keywords: 2, context: 1.5 },
          // A guide or page outranks one of its sections that says the same thing.
          boostDocument: (id) => ({ page: 2, guide: 2, section: 1 })[records[id as number].kind as string] ?? 1.25,
          prefix: true,
          fuzzy: (term) => (term.length > 3 ? 0.2 : false),
          weights: { fuzzy: 0.45, prefix: 0.75 },
          combineWith: "AND",
        },
      });
      mini.addAll(records);
      return { mini, records };
    });
    engine.catch(() => engines.delete(index));
    engines.set(index, engine);
  }
  return engine;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A line of the text around the first match, with the matches marked. */
function excerpt(text: string, terms: string[], size = 140): React.ReactNode {
  if (!text) return undefined;
  const words = [...terms].sort((a, b) => b.length - a.length).map(escape);
  const pattern = words.length ? new RegExp(`(?<![\\p{L}\\p{N}])(?:${words.join("|")})`, "giu") : null;
  const first = pattern ? text.search(pattern) : -1;
  const start = first > 48 ? text.lastIndexOf(" ", first - 32) + 1 : 0;
  let end = Math.min(text.length, start + size);
  if (end < text.length) end = Math.max(text.lastIndexOf(" ", end), start + 1);
  const line = `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
  if (!pattern) return line;
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const match of line.matchAll(pattern)) {
    out.push(line.slice(last, match.index), <mark key={match.index}>{match[0]}</mark>);
    last = match.index + match[0].length;
  }
  out.push(line.slice(last));
  return out;
}

function hint(record: SearchRecord): React.ReactNode {
  if (record.kind === "color") {
    return (
      <span className="search-hint">
        <span className="search-swatch" style={{ backgroundColor: record.swatch }} aria-hidden="true" />
        {record.hint}
      </span>
    );
  }
  if (record.kind === "file") {
    return (
      <span className="search-hint">
        {record.hint}
        <Icon name="download" size={12} aria-label="Downloads" />
      </span>
    );
  }
  if (record.kind === "resource") {
    return (
      <span className="search-hint">
        {record.hint}
        <Icon name="external" size={12} aria-label="Opens another site" />
      </span>
    );
  }
  return record.hint;
}

function go(record: SearchRecord) {
  if (record.kind === "resource") {
    window.open(record.url, "_blank", "noopener,noreferrer");
  } else if (record.kind === "file") {
    const link = Object.assign(document.createElement("a"), { href: record.url, download: "" });
    document.body.append(link);
    link.click();
    link.remove();
  } else {
    navigate(record.url);
  }
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

/**
 * Search across one client's space: ⌘K or Ctrl K, /, or any [data-search-open]
 * button opens it. Results jump to the page, or to the section of a guide.
 */
export default function Search({ index, clientName }: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [engine, setEngine] = React.useState<Engine | null>(null);
  const [failed, setFailed] = React.useState(false);

  const show = React.useCallback(() => {
    setQuery("");
    setOpen(true);
  }, []);
  const close = React.useCallback(() => setOpen(false), []);

  React.useEffect(() => {
    if (!open || engine) return;
    let live = true;
    load(index).then(
      (loaded) => live && setEngine(loaded),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [open, engine, index]);

  React.useEffect(() => {
    const apple = /Mac|iPhone|iPad/.test(navigator.platform);
    const label = () => {
      for (const key of document.querySelectorAll("[data-search-key]")) key.textContent = apple ? "⌘K" : "Ctrl K";
    };
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) close();
        else show();
      } else if (event.key === "/" && !open && !isTyping(event.target)) {
        event.preventDefault();
        show();
      }
    };
    const onClick = (event: MouseEvent) => {
      if (!(event.target as Element | null)?.closest?.("[data-search-open]")) return;
      event.preventDefault();
      show();
    };
    // Start loading as soon as a reader reaches for search.
    const warm = (event: Event) => {
      if ((event.target as Element | null)?.closest?.("[data-search-open]")) load(index).catch(() => {});
    };
    label();
    document.addEventListener("astro:after-swap", label);
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    document.addEventListener("pointerover", warm);
    document.addEventListener("focusin", warm);
    return () => {
      document.removeEventListener("astro:after-swap", label);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointerover", warm);
      document.removeEventListener("focusin", warm);
    };
  }, [index, open, show, close]);

  const groups = React.useMemo<CommandGroup[]>(() => {
    if (!engine) return [];
    const item = (record: SearchRecord, terms: string[] = []): CommandItem => ({
      id: String(record.id),
      label: record.title,
      description: excerpt(record.text, terms),
      hint: hint(record),
      onSelect: () => go(record),
    });

    // Before typing: the pages and every guide, for jumping around.
    if (!query.trim()) {
      return [
        { label: "Pages", items: engine.records.filter((r) => r.kind === "page").map((r) => item(r)) },
        { label: "Guides", items: engine.records.filter((r) => r.kind === "guide").map((r) => ({ ...item(r), description: undefined })) },
      ].filter((group) => group.items.length);
    }

    // Results gather under their guide (or "Brand assets", "Resources"), best first.
    const found = new Map<string, CommandItem[]>();
    let count = 0;
    for (const hit of engine.mini.search(query)) {
      const record = engine.records[hit.id];
      const list = found.get(record.group) ?? [];
      if (list.length >= 4 || count >= 24) continue;
      list.push(item(record, hit.terms));
      found.set(record.group, list);
      count++;
    }
    return [...found].map(([label, items]) => ({ label, items }));
  }, [engine, query]);

  const empty = failed ? "Search isn't available right now." : engine ? `Nothing found for “${query.trim()}”.` : "Loading…";

  return (
    <Dialog
      open={open}
      onClose={close}
      lightDismiss
      aria-label={`Search ${clientName}`}
      className="rs-command-dialog search-dialog"
      onClick={(event: React.MouseEvent<HTMLDialogElement>) => {
        // A click on the backdrop lands on the dialog itself, outside its box.
        const box = event.currentTarget.getBoundingClientRect();
        const outside =
          event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
        if (event.target === event.currentTarget && outside) close();
      }}
    >
      {open && (
        <>
          <Command
            className="search"
            groups={groups}
            value={query}
            onValueChange={setQuery}
            shouldFilter={false}
            placeholder={`Search ${clientName}`}
            inputLabel={`Search ${clientName}`}
            emptyLabel={empty}
            onDone={close}
          />
          <p className="search-foot" aria-hidden="true">
            <span>
              <kbd>↑</kbd> <kbd>↓</kbd> to move
            </span>
            <span>
              <kbd>↵</kbd> to open
            </span>
            <span>
              <kbd>esc</kbd> to close
            </span>
          </p>
        </>
      )}
    </Dialog>
  );
}
