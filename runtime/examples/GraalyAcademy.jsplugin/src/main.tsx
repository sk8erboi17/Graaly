import React from "react";
import { createRoot, type GraalyRoot } from "@graaly/react";
import {
  commands,
  events,
  info,
  PlayerQuitEvent,
  players,
  type Player,
} from "graaly";
import { AcademyApp } from "./academy-app";
import { lessons } from "./lessons";
export { academyReducer, initialAcademyState } from "./academy-state";

const roots = new Map<string, GraalyRoot>();

function playerId(player: Player): string {
  return String(player.uniqueId);
}

export function openAcademy(player: Player, lesson?: number): void {
  const id = playerId(player);
  const previous = roots.get(id);
  previous?.unmount();
  const root = createRoot(player, { historyLimit: 100 });
  roots.set(id, root);
  root.render(lesson === undefined ? <AcademyApp /> : <AcademyApp initialLesson={lesson} />);
}

commands.on("academy", context => {
  if (!players.isPlayer(context.sender)) {
    context.reply("&cThis playground needs a player.");
    return true;
  }
  const parsed = context.args[0] === undefined ? undefined : Number(context.args[0]);
  const lesson = parsed !== undefined && Number.isInteger(parsed) ? parsed : undefined;
  openAcademy(context.sender, lesson);
  return true;
});

commands.complete("academy", context => {
  if (!players.isPlayer(context.sender)) return [];
  const query = context.args[0] ?? "";
  return Array.from({ length: lessons.length }, (_, index) => String(index + 1))
    .filter(value => value.startsWith(query));
});

events.on(PlayerQuitEvent, event => {
  roots.get(playerId(event.player))?.unmount();
  roots.delete(playerId(event.player));
});

export function onEnable(): void {
  info("Graaly Academy ready: /academy [1-" + lessons.length + "] · Coding: https://sk8erboi17.github.io/Graaly/#academy");
}

export function onDisable(): void {
  for (const root of roots.values()) root.unmount();
  roots.clear();
}
