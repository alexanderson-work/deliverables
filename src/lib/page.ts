/**
 * Pages change in place (Astro's ClientRouter), so a script runs once per visit,
 * not once per page. `everyPage` runs a setup now and again after each page swap,
 * before the new page is captured for the transition. The signal aborts when the
 * page is swapped out, so listeners and observers can clean up after themselves.
 */
export function everyPage(setup: (signal: AbortSignal) => void) {
  let controller: AbortController | undefined;
  const run = () => {
    controller?.abort();
    controller = new AbortController();
    setup(controller.signal);
  };
  run();
  document.addEventListener("astro:after-swap", run);
}
