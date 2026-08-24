"""Native-first Graaly API shared by the generated symbol modules."""

from asyncio import Task
from collections.abc import Awaitable, Callable, Coroutine, Iterable, Iterator
from typing import Any, Literal, Protocol, TypeAlias, TypeGuard, TypeVar, TypedDict, overload

from ._base import ApiObject, NativeRandom
from .api import Attribute, AttributeInstance, BiomeGrid, BlockPopulator, Cancellable, Chunk, ChunkData, ChunkGenerator, CommandSender, Entity, EntityType, Event, JavaPlugin, Location, Player, Server, World, WorldEnvironment, WorldType
from .constants import EntityTypeOf

T = TypeVar("T")
T_co = TypeVar("T_co", covariant=True)
E = TypeVar("E")
EntityT = TypeVar("EntityT", bound=Entity)
R = TypeVar("R")
P = TypeVar("P", bound="PacketWrapper")

CancellableEvent = Cancellable


RandomSource = NativeRandom
WorldGenerator = ChunkGenerator


class GraalyUnsupportedFeature(RuntimeError):
    feature: str | None
    minecraft_version: str | None


class WorldGenerationContext:
    world: World
    random: RandomSource
    chunk_x: int
    chunk_z: int
    biomes: BiomeGrid
    chunk: ChunkData


class WorldSpawnContext:
    world: World
    x: int
    z: int


class WorldFixedSpawnContext:
    world: World
    random: RandomSource


class WorldPopulateContext:
    world: World
    random: RandomSource
    chunk: Chunk


class CommandContext:
    sender: CommandSender
    command: ApiObject
    label: str
    args: list[str]
    def reply(self, message: Any) -> None: ...
    def has_permission(self, permission: str) -> bool: ...


class PacketTypeValue(ApiObject, Protocol):
    name: str


class PacketEvent(ApiObject, Protocol):
    packet_type: PacketTypeValue
    packet_name: str
    user: Any
    player: Player | None
    client_version: Any
    cancelled: bool


class PacketWrapper:
    packet_type: PacketTypeValue
    user: Any
    player: Player | None


class PacketContext:
    direction: Literal["receive", "send"]
    packet_type: PacketTypeValue
    packet_name: str
    user: Any
    player: Player | None
    client_version: Any
    cancelled: bool
    def cancel(self, cancelled: bool = True) -> None: ...
    def reencode(self) -> None: ...
    def wrap(self, wrapper_type: type[P]) -> P: ...


def event(
    event_type: type[E],
    *,
    priority: Literal["LOWEST", "LOW", "NORMAL", "HIGH", "HIGHEST", "MONITOR"] = "NORMAL",
    ignore_cancelled: bool = False,
) -> Callable[[Callable[[E], R | Awaitable[R]]], Callable[[E], R | Awaitable[R]]]: ...


def on(
    event_type: type[E],
    callback: Callable[[E], R | Awaitable[R]],
    *,
    priority: Literal["LOWEST", "LOW", "NORMAL", "HIGH", "HIGHEST", "MONITOR"] = "NORMAL",
    ignore_cancelled: bool = False,
) -> Callable[[E], R | Awaitable[R]]: ...


def command(name: str) -> Callable[
    [Callable[[CommandContext], bool | None | Awaitable[bool | None]]],
    Callable[[CommandContext], bool | None | Awaitable[bool | None]],
]: ...
def tab_complete(name: str) -> Callable[[Callable[[CommandContext], Iterable[str] | None]], Callable[[CommandContext], Iterable[str] | None]]: ...


class _Tasks:
    def create_task[T](
        self,
        coroutine: Coroutine[Any, Any, T],
        *,
        name: str | None = None,
    ) -> Task[T]: ...
    def sleep_ticks(self, ticks: int = 1) -> Awaitable[None]: ...
    def to_thread[T](self, function: Callable[..., T], /, *args: Any, **kwargs: Any) -> Awaitable[T]: ...
    def is_main_thread(self) -> bool: ...


class _Config:
    def get(self, path: str, fallback: T | None = None) -> T | Any: ...
    def set(self, path: str, value: Any) -> None: ...
    def contains(self, path: str) -> bool: ...
    def save(self) -> None: ...
    def reload(self) -> None: ...


class _Players(Iterable[Player]):
    def __iter__(self) -> Iterator[Player]: ...
    def __len__(self) -> int: ...
    def online(self) -> list[Player]: ...
    def get(self, name: str) -> Player | None: ...
    def exact(self, name: str) -> Player | None: ...
    def is_player(self, value: Any) -> TypeGuard[Player]: ...
    def broadcast(self, message: Any) -> None: ...


class _Compatibility:
    contract_version: str
    minimum_game_version: str
    minecraft_version: str
    server_version: str
    def supports(self, feature: str) -> bool: ...
    def require(self, feature: str) -> None: ...
    def type_available(self, exported_type: str) -> bool: ...
    def material(self, name: str) -> Any: ...


class BoardPlayer(TypedDict, total=False):
    id: str
    name: str


JsonValue: TypeAlias = str | int | float | bool | None | list["JsonValue"] | dict[str, "JsonValue"]


class BoardMessage:
    board: str
    session: str
    type: str
    player: BoardPlayer
    data: JsonValue


class _Boards:
    @property
    def available(self) -> bool: ...
    def state(
        self,
        board: str,
        viewer: Player,
        data: dict[str, Any] | None = None,
        **values: Any,
    ) -> None: ...
    @overload
    def on_message[R](
        self,
        board: str,
        callback: None = None,
    ) -> Callable[
        [Callable[[BoardMessage], R | Awaitable[R]]],
        Callable[[BoardMessage], R | Awaitable[R]],
    ]: ...
    @overload
    def on_message[R](
        self,
        board: str,
        callback: Callable[[BoardMessage], R | Awaitable[R]],
    ) -> Callable[[BoardMessage], R | Awaitable[R]]: ...
    def refresh(self, board: str, viewer: Player) -> None: ...


class HttpResponse:
    status: int
    ok: bool
    headers: dict[str, list[str]]
    body: str
    def text(self) -> str: ...
    def json[T = JsonValue](self) -> T: ...


class _Http:
    async def request(
        self,
        url: str,
        *,
        method: str = "GET",
        headers: dict[str, str] | None = None,
        body: JsonValue | str = None,
        timeout: float = 15.0,
    ) -> HttpResponse: ...
    async def get(self, url: str, *, headers: dict[str, str] | None = None, timeout: float = 15.0) -> HttpResponse: ...
    async def post(self, url: str, body: JsonValue | str = None, *, headers: dict[str, str] | None = None, timeout: float = 15.0) -> HttpResponse: ...
    async def put(self, url: str, body: JsonValue | str = None, *, headers: dict[str, str] | None = None, timeout: float = 15.0) -> HttpResponse: ...
    async def delete(self, url: str, *, headers: dict[str, str] | None = None, timeout: float = 15.0) -> HttpResponse: ...


class WebSocketClosed(ConnectionError):
    code: int
    reason: str


class WebSocketConnection:
    id: str
    ready_state: Literal["CONNECTING", "OPEN", "CLOSING", "CLOSED"]
    close_code: int | None
    close_reason: str
    @property
    def open(self) -> bool: ...
    async def send_text(self, data: Any) -> None: ...
    async def send_json(self, value: JsonValue) -> None: ...
    async def receive_text(self) -> str: ...
    async def receive_json[T = JsonValue](self) -> T: ...
    async def close(self, code: int = 1000, reason: str = "") -> None: ...
    async def __aenter__(self) -> WebSocketConnection: ...
    async def __aexit__(self, exception_type: Any, exception: Any, traceback: Any) -> Literal[False]: ...
    def __aiter__(self) -> WebSocketConnection: ...
    async def __anext__(self) -> str: ...


class WebSocketConnector(Awaitable[WebSocketConnection]):
    def __await__(self) -> Any: ...
    async def __aenter__(self) -> WebSocketConnection: ...
    async def __aexit__(self, exception_type: Any, exception: Any, traceback: Any) -> Literal[False]: ...


class _WebSocket:
    def connect(
        self,
        url: str,
        *,
        headers: dict[str, str] | None = None,
        timeout: float = 15.0,
    ) -> WebSocketConnector: ...


class UiAction:
    type: str
    view_id: str | None
    action_id: str | None
    slot: int | None
    click: str | None
    shift: bool
    right: bool
    value: str | None
    player: BoardPlayer


class _Ui:
    def message(
        self,
        text: Any,
        *,
        id: str | None = None,
        channel: Literal["chat", "actionbar", "title"] = "chat",
        subtitle: Any = "",
    ) -> dict[str, Any]: ...
    def item(
        self,
        slot: int,
        material: str,
        *,
        amount: int = 1,
        durability: int = 0,
        name: str = "",
        lore: Iterable[str] = (),
        on_click: Callable[[UiAction], R | Awaitable[R]] | None = None,
    ) -> dict[str, Any]: ...
    def inventory(
        self,
        title: str,
        *items: dict[str, Any],
        id: str | None = None,
        rows: Literal[1, 2, 3, 4, 5, 6] = 3,
        on_close: Callable[[UiAction], R | Awaitable[R]] | None = None,
    ) -> dict[str, Any]: ...
    def line(self, id: str, text: Any) -> dict[str, Any]: ...
    def scoreboard(self, title: str, *lines: dict[str, Any]) -> dict[str, Any]: ...
    def boss_bar(self, text: Any, *, progress: float = 1.0) -> dict[str, Any]: ...
    def tab(self, *, header: str = "", footer: str = "") -> dict[str, Any]: ...
    def chat_input(
        self,
        prompt: str = "Type your answer in chat. Type cancel to stop.",
        *,
        id: str | None = None,
        value: str = "",
        cancel_word: str = "cancel",
        on_submit: Callable[[UiAction], R | Awaitable[R]] | None = None,
        on_cancel: Callable[[UiAction], R | Awaitable[R]] | None = None,
    ) -> dict[str, Any]: ...
    def view(
        self,
        *,
        messages: Iterable[dict[str, Any]] = (),
        inventory: dict[str, Any] | None = None,
        scoreboard: dict[str, Any] | None = None,
        boss_bar: dict[str, Any] | None = None,
        tab: dict[str, Any] | None = None,
        input: dict[str, Any] | None = None,
    ) -> dict[str, Any]: ...
    def render(
        self,
        player: Player,
        snapshot: dict[str, Any],
        on_action: Callable[[UiAction], R | Awaitable[R]] | None = None,
    ) -> None: ...
    def clear(self, player: Player) -> None: ...
    def dismiss(
        self,
        player: Player,
        surface: Literal["inventory", "scoreboard", "bossBar", "tab", "input"],
    ) -> None: ...


class _Worlds(Iterable[World]):
    def __iter__(self) -> Iterator[World]: ...
    def __len__(self) -> int: ...
    def all(self) -> list[World]: ...
    def get(self, name: str) -> World | None: ...
    def location(
        self,
        world: World,
        x: float,
        y: float,
        z: float,
        yaw: float = 0.0,
        pitch: float = 0.0,
    ) -> Location: ...
    def create(
        self,
        name: str,
        *,
        seed: int | None = None,
        environment: Literal["NORMAL", "NETHER", "THE_END"] | WorldEnvironment | None = None,
        world_type: Literal["NORMAL", "FLAT", "VERSION_1_1", "LARGE_BIOMES", "AMPLIFIED", "CUSTOMIZED"] | WorldType | None = None,
        generate_structures: bool = True,
        generator: WorldGenerator | None = None,
        generator_settings: str | None = None,
    ) -> World: ...
    def generator(
        self,
        callback: Callable[[WorldGenerationContext], ChunkData | None] | None = None,
        *,
        generate: Callable[[WorldGenerationContext], ChunkData | None] | None = None,
        can_spawn: Callable[[WorldSpawnContext], bool] | None = None,
        default_populators: Iterable[BlockPopulator] | Callable[[World], Iterable[BlockPopulator] | None] | None = None,
        fixed_spawn: Callable[[WorldFixedSpawnContext], Location | None] | None = None,
    ) -> WorldGenerator: ...
    def populator(self, callback: Callable[[WorldPopulateContext], None]) -> BlockPopulator: ...
    def unload(self, world_or_name: World | str, save: bool = True) -> bool: ...


class _Entities:
    def type(self, name: str) -> EntityType: ...
    def attribute_type(self, name: str) -> Attribute: ...
    @overload
    def spawn(
        self,
        location: Location,
        entity_type: EntityTypeOf[EntityT],
        *,
        name: str | None = None,
        custom_name: str | None = None,
        name_visible: bool | None = None,
        custom_name_visible: bool | None = None,
        attributes: dict[str, float] | None = None,
        ai: bool | None = None,
        invulnerable: bool | None = None,
        gravity: bool | None = None,
        glowing: bool | None = None,
    ) -> EntityT: ...
    @overload
    def spawn(
        self,
        location: Location,
        entity_type: str | EntityType,
        *,
        name: str | None = None,
        custom_name: str | None = None,
        name_visible: bool | None = None,
        custom_name_visible: bool | None = None,
        attributes: dict[str, float] | None = None,
        ai: bool | None = None,
        invulnerable: bool | None = None,
        gravity: bool | None = None,
        glowing: bool | None = None,
    ) -> Entity: ...
    def configure(
        self,
        entity: Entity,
        *,
        name: str | None = None,
        custom_name: str | None = None,
        name_visible: bool | None = None,
        custom_name_visible: bool | None = None,
        attributes: dict[str, float] | None = None,
        ai: bool | None = None,
        invulnerable: bool | None = None,
        gravity: bool | None = None,
        glowing: bool | None = None,
    ) -> Entity: ...
    def attribute(
        self,
        entity: Entity,
        name: str | Attribute,
        base_value: float | None = None,
    ) -> AttributeInstance: ...
    def remove(self, entity: Entity) -> None: ...


class SdkDiagnosticsReport(TypedDict):
    api_symbols: int
    wrappers: int
    packet_types: int
    packet_constants: int


class _Diagnostics:
    def verify(self) -> SdkDiagnosticsReport: ...


class _Adapters:
    def extend[T](self, base: type[T], *constructor_args: Any, **handlers: Callable[..., Any]) -> T: ...
    def implement[T](self, contract: type[T], **handlers: Callable[..., Any]) -> T: ...


def extend[T](base: type[T], *constructor_args: Any, **handlers: Callable[..., Any]) -> T: ...


class _Text:
    def color(self, message: Any) -> str: ...


class _PacketNamespace(Protocol):
    def __getattr__(self, name: str) -> PacketTypeValue | _PacketNamespace: ...


class _Packets:
    PacketType: _PacketNamespace
    Client: _PacketNamespace
    Server: _PacketNamespace
    @property
    def available(self) -> bool: ...
    @property
    def version(self) -> str | None: ...
    def create(self, wrapper_type: type[P], *args: Any) -> P: ...
    def wrap(self, wrapper_type: type[P], packet_event: PacketContext | PacketEvent) -> P: ...
    def on_receive(
        self,
        packet_type: PacketTypeValue | None,
        callback: Callable[[PacketContext], None],
        *,
        priority: str = "NORMAL",
    ) -> Callable[[PacketContext], None]: ...
    def listen_receive(
        self,
        packet_type: PacketTypeValue | None = None,
        *,
        priority: str = "NORMAL",
    ) -> Callable[
        [Callable[[PacketContext], None]],
        Callable[[PacketContext], None],
    ]: ...
    def on_send(
        self,
        packet_type: PacketTypeValue | None,
        callback: Callable[[PacketContext], None],
        *,
        priority: str = "NORMAL",
    ) -> Callable[[PacketContext], None]: ...
    def listen_send(
        self,
        packet_type: PacketTypeValue | None = None,
        *,
        priority: str = "NORMAL",
    ) -> Callable[
        [Callable[[PacketContext], None]],
        Callable[[PacketContext], None],
    ]: ...
    def send(self, player: Player | Any, packet: PacketWrapper | Any, *, silent: bool = False) -> None: ...
    def send_to_all(self, packet: PacketWrapper | Any, *, silent: bool = False) -> None: ...
    def receive(self, player: Player | Any, packet: PacketWrapper | Any, *, silent: bool = False) -> None: ...
    def user(self, player: Player | Any) -> Any: ...
    def client_version(self, player: Player | Any) -> Any: ...
    def ping(self, player: Player | Any) -> int: ...


plugin: JavaPlugin
server: Server
logger: ApiObject
data_folder: ApiObject
data_file: Callable[[str], ApiObject]
tasks: _Tasks
config: _Config
players: _Players
boards: _Boards
http: _Http
websocket: _WebSocket
ui: _Ui
worlds: _Worlds
entities: _Entities
compatibility: _Compatibility
diagnostics: _Diagnostics
adapters: _Adapters
text: _Text
packets: _Packets
constants: Any
info: Callable[[Any], None]
warn: Callable[[Any], None]
error: Callable[[Any], None]
