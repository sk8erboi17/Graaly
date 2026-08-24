from __future__ import annotations

import asyncio

from graaly import CommandContext, PlayerJoinEvent, command, event, info, tasks, text


async def delayed_message(context: CommandContext, label: str) -> str:
    await asyncio.sleep(0.25)
    context.reply(f"&7Finished {label} on the main thread: {tasks.is_main_thread()}")
    return label


@command("pyasync")
async def python_async(context: CommandContext) -> bool:
    context.reply("&dStarting two coroutines...")

    completed = await asyncio.gather(
        delayed_message(context, "one"),
        delayed_message(context, "two"),
    )
    total = await tasks.to_thread(sum, range(10_000))

    context.reply(f"&aCompleted {', '.join(completed)}; worker result: {total}")
    return True


@event(PlayerJoinEvent)
async def welcome_later(event: PlayerJoinEvent) -> None:
    # Event changes that must happen immediately belong before the first await.
    await asyncio.sleep(1)
    event.player.send_message(text.color("&dThis message was sent with Python async/await."))


async def on_enable() -> None:
    info("PythonAsync enabled")
    await asyncio.sleep(0)
    await tasks.sleep_ticks()
    info("PythonAsync event loop is running")


def on_disable() -> None:
    info("PythonAsync disabled; pending coroutines were cancelled")
