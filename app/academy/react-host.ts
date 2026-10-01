/** Bound by the judge before each case; the production renderer is used unchanged. */
type Callback = (...args: unknown[]) => unknown;
const host = () => (globalThis as unknown as { __academyHost: { ui: Record<string, Callback>; error: Callback } }).__academyHost;
export const ui = {
  render: (...args: unknown[]) => host().ui.render(...args),
  clear: (...args: unknown[]) => host().ui.clear(...args),
  dismiss: (...args: unknown[]) => host().ui.dismiss(...args),
};
export const error = (...args: unknown[]) => host().error(...args);
