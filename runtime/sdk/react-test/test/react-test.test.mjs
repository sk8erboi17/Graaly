import assert from "node:assert/strict";
import test from "node:test";

globalThis.ui = { render() {}, clear() {}, dismiss() {} };
globalThis.error = message => { throw new Error(String(message)); };
globalThis.PacketType = {
  Handshaking: { Client: {}, Server: {} },
  Status: { Client: {}, Server: {} },
  Login: { Client: {}, Server: {} },
  Configuration: { Client: {}, Server: {} },
  Play: { Client: {}, Server: {} },
};

const GraalyReact = await import("@graaly/react");
const React = GraalyReact.React;
const { render } = await import("../dist/index.mjs");

test("drives native inventory and ChatInput actions through act()", async () => {
  function AcademyExercise() {
    const [coins, setCoins] = React.useState(5);
    const [renaming, setRenaming] = React.useState(false);
    const [name, setName] = React.useState("Starter");
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(GraalyReact.Scoreboard, { title: name },
        React.createElement(GraalyReact.Line, { id: "coins" }, `Coins: ${coins}`)),
      React.createElement(GraalyReact.Inventory, { id: "academy", title: "Academy" },
        React.createElement(GraalyReact.Item, {
          slot: 10,
          material: "DIAMOND",
          onClick: () => setCoins(value => value + 1),
        }),
        React.createElement(GraalyReact.Item, {
          slot: 12,
          material: "NAME_TAG",
          onClick: () => setRenaming(true),
        })),
      React.createElement(GraalyReact.ChatInput, {
        id: "rename",
        open: renaming,
        value: name,
        onChange: setName,
        onSubmit: () => setRenaming(false),
      }),
    );
  }

  const view = await render(React.createElement(AcademyExercise));
  await view.clickSlot(10);
  assert.equal(view.snapshot.scoreboard.lines[0].text, "Coins: 6");
  await view.clickSlot(12);
  assert.equal(view.snapshot.input.id, "rename");
  await view.submitInput("Gladiator");
  assert.equal(view.snapshot.scoreboard.title, "Gladiator");
  assert.equal(view.snapshot.input, null);
  assert.ok(view.commits.length >= 4);
  await view.unmount();
});
