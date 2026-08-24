# @graaly/react

The official React 19 renderer for Graaly game interfaces. It is a genuine custom React renderer built with `react-reconciler`; it does not emulate JSX or reimplement hooks.

```tsx
import React, { useState } from "react";
import { createRoot, Inventory, Item, Line, Scoreboard } from "@graaly/react";

function Interface() {
  const [coins, setCoins] = useState(100);
  return <>
    <Scoreboard title="&aGraaly"><Line id="coins">Coins: {coins}</Line></Scoreboard>
    <Inventory title="&2Shop" rows={3}>
      <Item slot={13} material="DIAMOND" name="&bBuy" onClick={() => setCoins(value => value - 10)} />
    </Inventory>
  </>;
}

const root = createRoot(player);
root.render(<Interface />);
// Call root.unmount() when the player leaves.
```

Host components:

- `Message`: one-shot chat, action bar, or title message;
- `Inventory` and `Item`: clickable inventory menus;
- `Scoreboard` and `Line`: keyed sidebar lines;
- `BossBar`: title and progress from 0 to 1;
- `Tab`: player-list header and footer.

The renderer publishes immutable snapshots to Graaly. The server bridge keeps message IDs, inventory slots, scoreboard teams, boss-bar metadata, and tab text stable, changing only values that differ.

Run `npm test` to type-check, bundle, and execute the state/update renderer test.

