import assert from "node:assert/strict";
import test from "node:test";

const reportedErrors = [];
globalThis.ui = {
  render() {},
  clear() {},
  dismiss() {},
};
globalThis.error = message => reportedErrors.push(String(message));
globalThis.PacketType = {
  Handshaking: { Client: {}, Server: {} },
  Status: { Client: {}, Server: {} },
  Login: { Client: {}, Server: {} },
  Configuration: { Client: {}, Server: {} },
  Play: { Client: {}, Server: {} },
};

const React = await import("react");
const GraalyReact = await import("../dist/index.mjs");

const settle = (milliseconds = 25) => new Promise(resolve => setTimeout(resolve, milliseconds));

function createHarness(name = "Alex") {
  const renders = [];
  const clears = [];
  const dismisses = [];
  const receivers = [];
  let receiver = null;
  const player = { id: name.toLowerCase(), name };
  const transport = {
    render(selectedPlayer, snapshot, onAction) {
      renders.push({ player: selectedPlayer, snapshot });
      receiver = onAction;
      receivers.push(onAction);
    },
    clear(selectedPlayer) {
      clears.push(selectedPlayer);
    },
    dismiss(selectedPlayer, surface) {
      dismisses.push({ player: selectedPlayer, surface });
    },
  };
  return {
    player,
    transport,
    renders,
    clears,
    dismisses,
    receivers,
    action(action) {
      assert.ok(receiver, "the renderer did not install an action receiver");
      receiver(action);
    },
    snapshot() {
      return renders.at(-1)?.snapshot;
    },
  };
}

test("renders and updates every Graaly host surface with real React state", async () => {
  const harness = createHarness();
  const clicks = [];
  const effects = [];
  const root = GraalyReact.createRoot(harness.player, { transport: harness.transport });
  const RankContext = React.createContext("Member");

  function Interface() {
    const [coins, setCoins] = React.useState(10);
    const rank = React.useContext(RankContext);
    React.useEffect(() => {
      effects.push(`mounted:${rank}`);
      return () => effects.push(`unmounted:${rank}`);
    }, [rank]);
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        GraalyReact.Scoreboard,
        { title: "Graaly" },
        React.createElement(GraalyReact.Line, { id: "coins" }, `Coins: ${coins}`),
        React.createElement(GraalyReact.Line, { id: "rank" }, `Rank: ${rank}`),
      ),
      React.createElement(
        GraalyReact.Inventory,
        { title: "Shop", rows: 3 },
        React.createElement(GraalyReact.Item, {
          slot: 10,
          material: "DIAMOND_SWORD",
          name: "Buy",
          onClick: () => {
            clicks.push("buy");
            setCoins(value => value - 1);
          },
        }),
      ),
      React.createElement(GraalyReact.BossBar, { progress: 0.5 }, "KOTH"),
      React.createElement(GraalyReact.Tab, { header: "Graaly", footer: "Online" }),
    );
  }

  root.render(React.createElement(RankContext.Provider, { value: "Admin" }, React.createElement(Interface)));
  await settle();
  const first = harness.snapshot();
  assert.equal(first.scoreboard.lines[0].text, "Coins: 10");
  assert.equal(first.scoreboard.lines[1].text, "Rank: Admin");
  assert.equal(first.inventory.items[0].slot, 10);
  assert.equal(first.bossBar.text, "KOTH");
  assert.equal(first.tab.header, "Graaly");

  harness.action({
    type: "inventory.click",
    actionId: first.inventory.items[0].actionId,
    player: harness.player,
  });
  await settle();
  assert.deepEqual(clicks, ["buy"]);
  assert.equal(harness.snapshot().scoreboard.lines[0].text, "Coins: 9");
  assert.deepEqual(effects, ["mounted:Admin"]);

  root.unmount();
  await settle();
  assert.deepEqual(effects, ["mounted:Admin", "unmounted:Admin"]);
  assert.deepEqual(harness.clears, [harness.player]);
});

test("records commit diffs, batches event updates, and exposes typed imperative handles", async () => {
  const harness = createHarness();
  const commits = [];
  const inventoryRef = React.createRef();
  const root = GraalyReact.createRoot(harness.player, {
    transport: harness.transport,
    inspect: commit => commits.push(commit),
  });

  function Counter() {
    const [count, setCount] = React.useState(0);
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        GraalyReact.Scoreboard,
        { title: "Batching" },
        React.createElement(GraalyReact.Line, { id: "count" }, `Count: ${count}`),
      ),
      React.createElement(
        GraalyReact.Inventory,
        { id: "counter", ref: inventoryRef, title: "Counter" },
        React.createElement(GraalyReact.Item, {
          slot: 0,
          material: "STONE",
          onClick: () => {
            setCount(value => value + 1);
            setCount(value => value + 1);
          },
        }),
      ),
    );
  }

  root.render(React.createElement(Counter));
  await settle();
  assert.equal(inventoryRef.current.kind, "inventory");
  assert.equal(inventoryRef.current.id, "counter");
  assert.equal(inventoryRef.current.getProps().title, "Counter");
  inventoryRef.current.dismiss();
  assert.deepEqual(harness.dismisses, [{ player: harness.player, surface: "inventory" }]);

  const before = commits.length;
  const first = harness.snapshot();
  harness.action({
    type: "inventory.click",
    actionId: first.inventory.items[0].actionId,
    player: harness.player,
  });
  await settle();
  assert.equal(harness.snapshot().scoreboard.lines[0].text, "Count: 2");
  assert.equal(commits.length, before + 1, "two state updates in one event should produce one commit");
  assert.ok(commits.at(-1).operations.some(operation => operation.path.endsWith("scoreboard.lines[0].text")));
  assert.equal(root.getSnapshot().scoreboard.lines[0].text, "Count: 2");
  assert.equal(root.getCommits().length, commits.length);
  root.unmount();
});

test("supports a real controlled or uncontrolled ChatInput", async () => {
  const harness = createHarness();
  const submitted = [];
  const inputRef = React.createRef();
  const root = GraalyReact.createRoot(harness.player, { transport: harness.transport });

  function RenameKit() {
    return React.createElement(GraalyReact.ChatInput, {
      ref: inputRef,
      id: "kit-name",
      defaultOpen: true,
      defaultValue: "Starter",
      prompt: "Name your kit",
      onSubmit: value => submitted.push(value),
    });
  }

  root.render(React.createElement(RenameKit));
  await settle();
  const first = harness.snapshot();
  assert.equal(first.input.value, "Starter");
  assert.equal(inputRef.current.kind, "input");
  harness.action({
    type: "input.submit",
    actionId: first.input.submitActionId,
    value: "Gladiator",
    player: harness.player,
  });
  await settle();
  assert.deepEqual(submitted, ["Gladiator"]);
  assert.equal(harness.snapshot().input, null, "an uncontrolled input closes after submit");
  root.unmount();
});

test("preserves state by position and resets it when a component key changes", async () => {
  const harness = createHarness();
  const root = GraalyReact.createRoot(harness.player, { transport: harness.transport });
  let increment;

  function StatefulLine() {
    const [count, setCount] = React.useState(0);
    increment = () => setCount(value => value + 1);
    return React.createElement(GraalyReact.Scoreboard, { title: "Identity" },
      React.createElement(GraalyReact.Line, { id: "value" }, `Value: ${count}`));
  }

  root.render(React.createElement(StatefulLine, { key: "same" }));
  await settle();
  increment();
  await settle();
  assert.equal(harness.snapshot().scoreboard.lines[0].text, "Value: 1");
  root.render(React.createElement(StatefulLine, { key: "same" }));
  await settle();
  assert.equal(harness.snapshot().scoreboard.lines[0].text, "Value: 1");
  root.render(React.createElement(StatefulLine, { key: "different" }));
  await settle();
  assert.equal(harness.snapshot().scoreboard.lines[0].text, "Value: 0");
  root.unmount();
});

test("renders Error Boundary fallbacks and reports Profiler commits", async () => {
  const harness = createHarness();
  const profiles = [];
  const root = GraalyReact.createRoot(harness.player, { transport: harness.transport });

  class Boundary extends React.Component {
    state = { failed: false };
    static getDerivedStateFromError() {
      return { failed: true };
    }
    render() {
      if (this.state.failed) {
        return React.createElement(GraalyReact.Message, { id: "fallback" }, "UI recovered");
      }
      return this.props.children;
    }
  }
  function Broken() {
    throw new Error("academy-boundary-probe");
  }

  root.render(React.createElement(
    React.Profiler,
    { id: "academy", onRender: (...values) => profiles.push(values) },
    React.createElement(Boundary, null, React.createElement(Broken)),
  ));
  await settle();
  assert.equal(harness.snapshot().messages[0].text, "UI recovered");
  assert.ok(profiles.length >= 1);
  assert.ok(reportedErrors.some(message => message.includes("academy-boundary-probe")));
  root.unmount();
});

test("supports Suspense with use() and concurrent transitions", async () => {
  const harness = createHarness();
  const root = GraalyReact.createRoot(harness.player, { transport: harness.transport });
  let resolveProfile;
  const profile = new Promise(resolve => { resolveProfile = resolve; });

  function RemoteProfile() {
    const name = React.use(profile);
    return React.createElement(GraalyReact.Message, { id: "loaded" }, `Loaded ${name}`);
  }

  root.render(React.createElement(
    React.Suspense,
    { fallback: React.createElement(GraalyReact.Message, { id: "loading" }, "Loading") },
    React.createElement(RemoteProfile),
  ));
  await settle();
  assert.equal(harness.snapshot().messages[0].text, "Loading");
  resolveProfile("Alex");
  await settle(300);
  assert.equal(harness.snapshot().messages[0].text, "Loaded Alex");

  function TransitionCounter() {
    const [count, setCount] = React.useState(0);
    const [pending, startTransition] = React.useTransition();
    return React.createElement(
      GraalyReact.Inventory,
      { id: "transition", title: pending ? "Updating" : `Count ${count}` },
      React.createElement(GraalyReact.Item, {
        slot: 0,
        material: "CLOCK",
        onClick: () => startTransition(() => setCount(value => value + 1)),
      }),
    );
  }
  root.render(React.createElement(TransitionCounter));
  await settle();
  const current = harness.snapshot();
  harness.action({
    type: "inventory.click",
    actionId: current.inventory.items[0].actionId,
    player: harness.player,
  });
  await settle(50);
  assert.equal(harness.snapshot().inventory.title, "Count 1");
  root.unmount();
});

test("renders genuine React portals into another player's root", async () => {
  const sourceHarness = createHarness("Alex");
  const targetHarness = createHarness("Steve");
  const source = GraalyReact.createRoot(sourceHarness.player, { transport: sourceHarness.transport });
  const target = GraalyReact.createRoot(targetHarness.player, { transport: targetHarness.transport });

  source.render(GraalyReact.createPortal(
    React.createElement(GraalyReact.Message, { id: "moderation" }, "Alex needs help"),
    target,
  ));
  await settle();
  assert.equal(targetHarness.snapshot().messages[0].text, "Alex needs help");
  source.unmount();
  await settle();
  assert.equal(targetHarness.snapshot().messages.length, 0);
  target.unmount();
});

test("an older root cannot clear a newer root for the same player", async () => {
  const harness = createHarness("Alex");
  const older = GraalyReact.createRoot(harness.player, { transport: harness.transport });
  const newer = GraalyReact.createRoot(harness.player, { transport: harness.transport });

  older.render(React.createElement(GraalyReact.Message, { id: "older" }, "Older"));
  await settle();
  newer.render(React.createElement(GraalyReact.Message, { id: "newer" }, "Newer"));
  await settle();
  assert.equal(harness.snapshot().messages[0].text, "Newer");

  older.unmount();
  await settle();
  assert.equal(harness.snapshot().messages[0].text, "Newer");
  assert.equal(harness.clears.length, 0);

  newer.unmount();
  await settle();
  assert.deepEqual(harness.clears, [harness.player]);
});

test("a superseded root cannot render, receive actions, dismiss, or reclaim ownership", async () => {
  const harness = createHarness("Alex");
  const clicks = [];
  const olderRef = React.createRef();
  const older = GraalyReact.createRoot(harness.player, { transport: harness.transport });
  const newer = GraalyReact.createRoot(harness.player, { transport: harness.transport });

  older.render(React.createElement(
    GraalyReact.Inventory,
    { ref: olderRef, title: "Old" },
    React.createElement(GraalyReact.Item, {
      slot: 0,
      material: "STONE",
      onClick: () => clicks.push("stale"),
    }),
  ));
  await settle();
  const oldActionId = harness.snapshot().inventory.items[0].actionId;
  const staleReceiver = harness.receivers.at(-1);
  const staleHandle = olderRef.current;

  newer.render(React.createElement(GraalyReact.Message, { id: "new" }, "New owner"));
  await settle();
  const publishedByNewer = harness.renders.length;

  older.render(React.createElement(GraalyReact.Message, { id: "late" }, "Late old commit"));
  await settle();
  staleReceiver({ type: "inventory.click", actionId: oldActionId, player: harness.player });
  staleHandle.dismiss();
  await settle();

  assert.equal(harness.renders.length, publishedByNewer);
  assert.equal(harness.snapshot().messages[0].text, "New owner");
  assert.deepEqual(clicks, []);
  assert.deepEqual(harness.dismisses, []);

  newer.unmount();
  await settle();
  older.render(React.createElement(GraalyReact.Message, { id: "later" }, "Still stale"));
  await settle();
  assert.equal(harness.renders.length, publishedByNewer);
  assert.deepEqual(harness.clears, [harness.player]);
  older.unmount();
});
