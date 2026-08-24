import sys as _sys
import types as _types
import collections.abc as _abc
import asyncio as _asyncio
import inspect as _inspect
import traceback as _traceback
import json as _json
import math as _math

def _install(bridge_value, plugin_value, server_value, logger_value, data_folder_value):
    class GraalyUnsupportedFeature(RuntimeError):
        """A requested Graaly mechanic or constant is absent on this game version."""

        def __init__(self, message):
            super().__init__(str(message))
            self.feature = None
            self.minecraft_version = None
            marker = "Graaly feature '"
            if marker in str(message):
                remainder = str(message).split(marker, 1)[1]
                self.feature = remainder.split("'", 1)[0]
                version_marker = "unavailable on Minecraft "
                if version_marker in remainder:
                    version_text = remainder.split(version_marker, 1)[1]
                    version_characters = []
                    for character in version_text:
                        if character.isdigit() or character == ".":
                            version_characters.append(character)
                        else:
                            break
                    self.minecraft_version = "".join(version_characters).rstrip(".") or None


    def _python_host_error(failure):
        """Translate implementation exceptions into ordinary Python errors."""
        message = str(failure)
        java_name = type(failure).__name__
        if "IndexOutOfBounds" in java_name:
            return IndexError(message)
        if any(name in java_name for name in (
            "IllegalArgument", "NumberFormat", "Malformed", "URISyntax",
        )):
            return ValueError(message)
        if "GraalyUnsupportedFeature" in java_name or "Graaly feature '" in message:
            return GraalyUnsupportedFeature(message)
        if "UnsupportedOperation" in java_name:
            return TypeError(message)
        return RuntimeError(message)


    class _HostFacade:
        """Catch host exceptions before they can leak outside Python's hierarchy."""
        __slots__ = ("_target",)

        def __init__(self, target):
            self._target = target

        def __getattr__(self, name):
            member = getattr(self._target, name)
            if not callable(member):
                return member

            def invoke(*args):
                try:
                    return member(*args)
                except Exception as failure:
                    if ("GraalyUnsupportedFeature" in type(failure).__name__
                            or "Graaly feature '" in str(failure)):
                        raise _python_host_error(failure) from None
                    raise
                except BaseException as failure:
                    raise _python_host_error(failure) from None
            return invoke


    _bridge = _HostFacade(bridge_value)
    _raw_plugin = plugin_value
    _raw_server = server_value
    _raw_logger = logger_value
    _raw_data_folder = data_folder_value
    _packet_bridge = _HostFacade(_bridge.get_packets())
    _http_bridge = _HostFacade(_bridge.get_http())
    _websocket_bridge = _HostFacade(_bridge.get_websocket())
    _ui_bridge = _HostFacade(_bridge.get_ui())
    
    
    def _snake_to_camel(name):
        head, *tail = str(name).split("_")
        return head + "".join(part[:1].upper() + part[1:] for part in tail)
    
    
    def _unwrap(value):
        """Return the internal host value behind a Graaly view."""
        if isinstance(value, (_ApiObject, _ApiType, _LiveList, _LiveSet, _LiveDict)):
            return value._resolve() if isinstance(value, _ApiType) else value._raw
        if isinstance(value, (list, tuple, set)):
            return [_unwrap(item) for item in value]
        if isinstance(value, dict):
            return {key: _unwrap(item) for key, item in value.items()}
        return value


    def _finite_number(value, name="value"):
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{name} must be int or float; strings and booleans are not converted")
        converted = float(value)
        if not _math.isfinite(converted):
            raise ValueError(f"{name} must be finite")
        if isinstance(value, int) and not (-(2 ** 53 - 1) <= value <= 2 ** 53 - 1):
            raise ValueError(f"{name} is outside the portable exact-integer range for a Java double")
        return converted


    def _java_long(value, name="value"):
        if isinstance(value, bool) or not isinstance(value, int):
            raise TypeError(f"{name} must be an integer")
        if value < -(2 ** 63) or value > 2 ** 63 - 1:
            raise ValueError(f"{name} is outside the signed 64-bit range")
        return value
    
    
    def _native(value):
        """Adapt an API value to Python properties and snake_case methods."""
        if value is None or isinstance(value, (bool, int, float, str, bytes, _ApiObject, _ApiType)):
            return value
        if _bridge.is_collection(value):
            return (_LiveSet(value) if str(_bridge.collection_kind(value)) == "set"
                    else _LiveList(value))
        if _bridge.is_map(value):
            return _LiveDict(value)
        if _bridge.is_optional(value):
            return _native(_bridge.optional_value(value))
        return _ApiObject(value)
    
    
    class _ApiObject:
        """Pythonic view over a Bukkit or PacketEvents value."""
        __slots__ = ("_raw",)
    
        def __init__(self, raw):
            object.__setattr__(self, "_raw", raw)
    
        def __getattr__(self, name):
            java_name = _snake_to_camel(name)
            if _bridge.has_property(self._raw, java_name):
                return _native(_bridge.property(self._raw, java_name))
            if _bridge.is_property_accessor(self._raw, java_name):
                raise AttributeError(
                    f"Java-style accessor {name!r} is not exposed; use the native property instead"
                )
            if _bridge.has_method(self._raw, java_name):
                def method(*args):
                    if _bridge.is_property_accessor_call(self._raw, java_name, len(args)):
                        raise AttributeError(
                            f"Java-style accessor {name!r} is not exposed; use the native property instead"
                        )
                    return _native(_bridge.invoke_packed(self._raw, java_name, [_unwrap(arg) for arg in args]))
                method.__name__ = str(name)
                return method
            try:
                member = getattr(self._raw, java_name)
            except AttributeError as exception:
                if _bridge.has_canonical_instance_member(self._raw, java_name):
                    _bridge.unavailable_instance_member(self._raw, java_name)
                raise AttributeError(f"{type(self).__name__!s} has no attribute {name!r}") from exception
            if callable(member):
                def direct(*args):
                    return _native(member(*(_unwrap(arg) for arg in args)))
                direct.__name__ = str(name)
                return direct
            return _native(member)
    
        def __setattr__(self, name, value):
            if name == "_raw":
                object.__setattr__(self, name, value)
                return
            java_name = _snake_to_camel(name)
            if _bridge.has_writable_property(self._raw, java_name):
                _bridge.set_property(self._raw, java_name, _unwrap(value))
                return
            if _bridge.has_canonical_writable_member(self._raw, java_name):
                _bridge.unavailable_instance_member(self._raw, java_name)
            try:
                setattr(self._raw, java_name, _unwrap(value))
            except (AttributeError, TypeError) as exception:
                raise AttributeError(f"{type(self).__name__!s} has no writable attribute {name!r}") from exception
    
        def __iter__(self):
            if _bridge.is_collection(self._raw):
                return iter(_native(self._raw))
            return (_native(item) for item in self._raw)
    
        def __str__(self):
            return str(self._raw)
    
        def __repr__(self):
            return f"<{type(self).__name__} {self._raw!s}>"
    
        def __eq__(self, other):
            return self._raw == _unwrap(other)
    
        def __hash__(self):
            return hash(self._raw)
    
    
    class _LiveList(_abc.MutableSequence):
        """A Python list-shaped, live view of a server List/Collection/array."""
        __slots__ = ("_raw",)
    
        def __init__(self, raw):
            self._raw = raw
    
        def __len__(self):
            return int(_bridge.collection_size(self._raw))
    
        def _index(self, index):
            selected = int(index)
            if selected < 0:
                selected += len(self)
            if selected < 0 or selected >= len(self):
                raise IndexError("live collection index out of range")
            return selected
    
        def __getitem__(self, index):
            if isinstance(index, slice):
                return [self[position] for position in range(*index.indices(len(self)))]
            return _native(_bridge.collection_get(self._raw, self._index(index)))
    
        def __setitem__(self, index, value):
            if isinstance(index, slice):
                replacement = list(value)
                positions = list(range(*index.indices(len(self))))
                if len(positions) != len(replacement):
                    raise ValueError("live slice assignment must preserve collection size")
                for position, item in zip(positions, replacement):
                    _bridge.collection_set(self._raw, position, _unwrap(item))
                return
            _bridge.collection_set(self._raw, self._index(index), _unwrap(value))
    
        def __delitem__(self, index):
            if isinstance(index, slice):
                for position in reversed(range(*index.indices(len(self)))):
                    _bridge.collection_remove_at(self._raw, position)
                return
            _bridge.collection_remove_at(self._raw, self._index(index))
    
        def insert(self, index, value):
            selected = int(index)
            if selected < 0:
                selected = max(0, len(self) + selected)
            selected = min(selected, len(self))
            _bridge.collection_insert(self._raw, selected, _unwrap(value))
    
        def __contains__(self, item):
            return bool(_bridge.collection_contains(self._raw, _unwrap(item)))
    
        def __repr__(self):
            return repr(list(self))
    
    
    class _LiveSet(_abc.MutableSet):
        """A Python set-shaped, live view of a server Set."""
        __slots__ = ("_raw",)
    
        def __init__(self, raw):
            self._raw = raw
    
        def __contains__(self, item):
            return bool(_bridge.collection_contains(self._raw, _unwrap(item)))
    
        def __iter__(self):
            return (_native(item) for item in _bridge.collection_values(self._raw))
    
        def __len__(self):
            return int(_bridge.collection_size(self._raw))
    
        def add(self, value):
            _bridge.collection_add(self._raw, _unwrap(value))
    
        def discard(self, value):
            _bridge.collection_remove_value(self._raw, _unwrap(value))
    
        def clear(self):
            _bridge.collection_clear(self._raw)
    
        def __repr__(self):
            return repr(set(self))
    
    
    class _LiveDict(_abc.MutableMapping):
        """A Python dict-shaped, live view of a server Map."""
        __slots__ = ("_raw",)
    
        def __init__(self, raw):
            self._raw = raw
    
        def __len__(self):
            return int(_bridge.map_size(self._raw))
    
        def __iter__(self):
            return (_native(pair[0]) for pair in _bridge.map_entries(self._raw))
    
        def __getitem__(self, key):
            if not _bridge.map_contains_key(self._raw, _unwrap(key)):
                raise KeyError(key)
            return _native(_bridge.map_get(self._raw, _unwrap(key)))
    
        def __setitem__(self, key, value):
            _bridge.map_put(self._raw, _unwrap(key), _unwrap(value))
    
        def __delitem__(self, key):
            if not _bridge.map_contains_key(self._raw, _unwrap(key)):
                raise KeyError(key)
            _bridge.map_remove(self._raw, _unwrap(key))
    
        def clear(self):
            _bridge.map_clear(self._raw)
    
        def __repr__(self):
            return repr(dict(self.items()))
    
    
    class _ApiType:
        """Lazy, callable Python symbol representing one generated API type."""
        __slots__ = ("_name", "_resolver", "_resolved")
    
        def __init__(self, name, resolver):
            self._name = str(name)
            self._resolver = resolver
            self._resolved = None
    
        def _resolve(self):
            if self._resolved is None:
                self._resolved = self._resolver(self._name)
            return self._resolved
    
        def __call__(self, *args):
            return _native(_bridge.construct_packed(self._resolve(), [_unwrap(arg) for arg in args]))
    
        def __getattr__(self, name):
            raw_type = self._resolve()
            if _bridge.has_static_member(raw_type, str(name)):
                member = _bridge.static_member(raw_type, str(name))
                if _bridge.is_type(member):
                    return _ApiType(f"{self._name}.{name}", lambda _ignored: member)
                return _native(member)
            java_name = _snake_to_camel(name)
            if _bridge.has_static_member(raw_type, java_name):
                return _native(_bridge.static_member(raw_type, java_name))
            if _bridge.has_method(raw_type, java_name):
                def method(*args):
                    result = _native(_bridge.invoke_packed(
                        raw_type, java_name, [_unwrap(arg) for arg in args]
                    ))
                    # Java enum values() already returns a defensive array.
                    # Expose that copy as an actual Python list, matching the
                    # generated annotation and ordinary Python expectations.
                    return list(result) if str(name) == "values" else result
                method.__name__ = str(name)
                return method
            try:
                member = getattr(raw_type, java_name)
            except AttributeError as exception:
                if _bridge.has_canonical_static_member(raw_type, java_name):
                    _bridge.unavailable_static_member(raw_type, java_name)
                raise AttributeError(f"{self._name} has no class attribute {name!r}") from exception
            if callable(member):
                return lambda *args: _native(member(*(_unwrap(arg) for arg in args)))
            return _native(member)
    
        def __repr__(self):
            return f"<Graaly type {self._name}>"
    
    
    class _PacketWrapperType(_ApiType):
        def __init__(self, name):
            super().__init__(name, _packet_bridge.wrapper_type)
    
        def __call__(self, *args):
            return _native(_packet_bridge.create_packed(self._resolve(), [_unwrap(arg) for arg in args]))
    
    
    class CommandContext:
        __slots__ = ("sender", "command", "label", "args")
    
        def __init__(self, sender, command_value, label, args):
            self.sender = _native(sender)
            self.command = _native(command_value)
            self.label = str(label)
            self.args = [str(value) for value in args]
    
        def reply(self, message):
            _unwrap(self.sender).sendMessage(_bridge.color(message))
    
        def has_permission(self, permission):
            return bool(_unwrap(self.sender).hasPermission(str(permission)))
    
    
    def _callback_name(callback, fallback):
        return str(getattr(callback, "__qualname__", getattr(callback, "__name__", fallback)))


    def _handle_callback_result(result, description="callback"):
        """Turn a returned coroutine into a managed asyncio task."""
        if not _inspect.isawaitable(result):
            return False
        tasks._schedule(result, name=str(description), eager=True)
        return True


    def event(event_type, *, priority="NORMAL", ignore_cancelled=False):
        """Register a synchronous or async Python event callback."""
        def decorator(callback):
            def adapted(raw_event):
                result = callback(_native(raw_event))
                _handle_callback_result(result, f"event:{_callback_name(callback, 'handler')}")
                return None
            _bridge.on(_unwrap(event_type), priority, bool(ignore_cancelled), adapted)
            return callback
        return decorator


    def on(event_type, callback, *, priority="NORMAL", ignore_cancelled=False):
        return event(event_type, priority=priority, ignore_cancelled=ignore_cancelled)(callback)


    def command(name):
        """Register a synchronous or async command callback."""
        def decorator(callback):
            def adapted(sender, command_value, label, args):
                result = callback(CommandContext(sender, command_value, label, args))
                if _handle_callback_result(result, f"command:{_callback_name(callback, str(name))}"):
                    return True
                return result
            _bridge.command(name, adapted)
            return callback
        return decorator


    def tab_complete(name):
        """Register a synchronous tab completer; Bukkit needs its result immediately."""
        def decorator(callback):
            if _inspect.iscoroutinefunction(callback):
                raise TypeError("Tab completion must be synchronous because Bukkit needs its result immediately")
            def adapted(sender, command_value, label, args):
                return callback(CommandContext(sender, command_value, label, args))
            _bridge.tab_complete(name, adapted)
            return callback
        return decorator


    class _Tasks:
        def __init__(self):
            self._loop = _asyncio.new_event_loop()
            self._active = False
            self._closed = False
            self._pumping = False
            self._owned = set()
            self._loop.set_exception_handler(self._exception_handler)
            _asyncio.set_event_loop(self._loop)

        @staticmethod
        def _sync_function(function):
            if not callable(function):
                raise TypeError("a callable object was expected")
            if _inspect.iscoroutinefunction(function):
                raise TypeError("tasks.to_thread() expects a synchronous function")
            return function

        def _schedule(self, awaitable, *, name=None, eager=False):
            if not _inspect.isawaitable(awaitable):
                raise TypeError("an awaitable object was expected")
            if self._closed:
                close = getattr(awaitable, "close", None)
                if close is not None:
                    close()
                raise RuntimeError("The plugin asyncio runtime is closed")
            task = _asyncio.ensure_future(awaitable, loop=self._loop)
            if name is not None and hasattr(task, "set_name"):
                task.set_name(name)
            self._owned.add(task)
            task.add_done_callback(self._task_done)
            if eager and self._active and bool(_bridge.is_primary_thread()) and not self._pumping:
                self._run_once()
            return task

        def create_task(self, coroutine, *, name=None):
            """Schedule a coroutine on this plugin's main-thread asyncio loop."""
            if not _inspect.iscoroutine(coroutine):
                raise TypeError("tasks.create_task() expects a coroutine object")
            return self._schedule(coroutine, name=name)

        async def sleep_ticks(self, ticks=1):
            """Suspend for a number of Bukkit ticks and resume on the main thread."""
            selected = int(ticks)
            if selected < 0:
                raise ValueError("ticks cannot be negative")
            future = self._loop.create_future()

            def complete():
                if not future.done():
                    future.set_result(None)

            handle = _bridge.later(selected, complete)
            try:
                await future
            except _asyncio.CancelledError:
                _bridge.cancel(handle)
                raise

        async def to_thread(self, function, /, *args, **kwargs):
            """Run a synchronous function on a Bukkit worker and resume on main."""
            function = self._sync_function(function)
            future = self._loop.create_future()

            def worker():
                try:
                    result = function(*args, **kwargs)
                    if _inspect.isawaitable(result):
                        close = getattr(result, "close", None)
                        if close is not None:
                            close()
                        raise TypeError("tasks.to_thread() function returned an awaitable; pass a synchronous function")
                except BaseException as exception:
                    def reject(failure=exception):
                        if not future.done():
                            future.set_exception(failure)
                    _bridge.run(reject)
                else:
                    def resolve(value=result):
                        if not future.done():
                            future.set_result(value)
                    _bridge.run(resolve)

            handle = _bridge.run_async(worker)
            try:
                return await future
            except _asyncio.CancelledError:
                _bridge.cancel(handle)
                raise

        @staticmethod
        def is_main_thread():
            return bool(_bridge.is_primary_thread())

        def _activate(self):
            if self._closed:
                raise RuntimeError("Cannot activate a closed Python asyncio runtime")
            if self._active:
                return
            self._active = True
            _asyncio.set_event_loop(self._loop)
            self._run_once()

        def _pump(self):
            if self._active and not self._closed:
                self._run_once()

        def _run_once(self):
            if self._closed or self._pumping:
                return
            self._pumping = True
            try:
                self._loop.call_soon(self._loop.stop)
                self._loop.run_forever()
            finally:
                self._pumping = False

        def _shutdown(self):
            if self._closed:
                return
            self._active = False
            pending = [task for task in _asyncio.all_tasks(loop=self._loop) if not task.done()]
            for _round in range(8):
                if not pending:
                    break
                for task in pending:
                    task.cancel()
                self._run_once()
                pending = [task for task in pending if not task.done()]
            if pending:
                _bridge.warn(f"Closing Python asyncio loop with {len(pending)} stubborn task(s)")
            self._owned.clear()
            self._loop.close()
            self._closed = True

        def _task_done(self, task):
            self._owned.discard(task)
            if task.cancelled():
                return
            exception = task.exception()
            if exception is not None:
                name = task.get_name() if hasattr(task, "get_name") else "coroutine"
                details = "".join(_traceback.format_exception(type(exception), exception, exception.__traceback__))
                _bridge.error(f"Unhandled exception in Python task {name!r}:\n{details}")

        @staticmethod
        def _exception_handler(loop, context):
            message = str(context.get("message", "Unhandled asyncio exception"))
            exception = context.get("exception")
            if exception is None:
                _bridge.error(message)
                return
            details = "".join(_traceback.format_exception(type(exception), exception, exception.__traceback__))
            _bridge.error(f"{message}:\n{details}")
    
    
    class _Config:
        @staticmethod
        def get(path, fallback=None):
            value = _raw_plugin.getConfig().get(str(path))
            return fallback if value is None else _native(value)
    
        @staticmethod
        def set(path, value):
            _raw_plugin.getConfig().set(str(path), _unwrap(value))
    
        @staticmethod
        def contains(path):
            return bool(_raw_plugin.getConfig().contains(str(path)))
    
        @staticmethod
        def save():
            _raw_plugin.saveConfig()
    
        @staticmethod
        def reload():
            _raw_plugin.reloadConfig()
    
    
    class _Players:
        def __iter__(self):
            return iter(self.online())

        def __len__(self):
            return int(_bridge.collection_size(_raw_server.getOnlinePlayers()))

        @staticmethod
        def online():
            return [_native(player) for player in _raw_server.getOnlinePlayers()]
    
        @staticmethod
        def get(name):
            return _native(_raw_server.getPlayer(str(name)))
    
        @staticmethod
        def exact(name):
            return _native(_raw_server.getPlayerExact(str(name)))
    
        @staticmethod
        def is_player(value):
            return bool(_bridge.named_api_type("Player").isInstance(_unwrap(value)))
    
        @staticmethod
        def broadcast(message):
            _bridge.broadcast(message)


    class BoardMessage:
        __slots__ = ("board", "session", "type", "player", "data")

        def __init__(self, payload):
            self.board = str(payload.get("board", ""))
            self.session = str(payload.get("session", ""))
            self.type = str(payload.get("type", ""))
            self.player = payload.get("player") or {}
            self.data = payload.get("data")


    class _Boards:
        @property
        def available(self):
            return bool(_bridge.web_boards_available())

        @staticmethod
        def state(name, player, data=None, **values):
            if data is not None and values:
                raise TypeError("boards.state accepts either data or keyword values")
            selected = values if data is None else data
            if selected is None:
                selected = {}
            if not isinstance(selected, dict):
                raise TypeError("boards.state data must be a dict")
            _bridge.publish_web_state(str(name), _unwrap(player),
                                      _json.dumps(selected, separators=(",", ":")))

        @staticmethod
        def on_message(name, callback=None):
            def register(selected):
                if not callable(selected):
                    raise TypeError("boards.on_message expects a callable")

                def adapted(raw):
                    result = selected(BoardMessage(_json.loads(str(raw))))
                    _handle_callback_result(
                        result, f"board-message:{_callback_name(selected, 'listener')}"
                    )
                    return None

                _bridge.on_web_message(str(name), adapted)
                return selected

            return register if callback is None else register(callback)

        @staticmethod
        def refresh(name, player):
            _bridge.refresh_web_board(str(name), _unwrap(player))


    class HttpResponse:
        __slots__ = ("status", "ok", "headers", "body")

        def __init__(self, payload):
            self.status = int(payload.get("status", 0))
            self.ok = bool(payload.get("ok", False))
            self.headers = payload.get("headers") or {}
            self.body = str(payload.get("body", ""))

        def text(self):
            return self.body

        def json(self):
            return _json.loads(self.body)


    class _Http:
        @staticmethod
        async def request(url, *, method="GET", headers=None, body=None, timeout=15.0):
            selected_headers = dict(headers or {})
            selected_body = body
            if selected_body is None:
                selected_body = ""
            elif not isinstance(selected_body, str):
                selected_body = _json.dumps(selected_body, separators=(",", ":"))
                if not any(str(name).lower() == "content-type" for name in selected_headers):
                    selected_headers["content-type"] = "application/json"
            future = tasks._loop.create_future()

            def complete(raw):
                if future.done():
                    return
                payload = _json.loads(str(raw))
                failure = payload.get("error")
                if failure:
                    future.set_exception(RuntimeError(str(failure)))
                else:
                    future.set_result(HttpResponse(payload))

            request_id = _http_bridge.request(
                str(method), str(url),
                _json.dumps(selected_headers, separators=(",", ":")),
                str(selected_body), int(float(timeout) * 1000.0), complete,
            )
            try:
                return await future
            except _asyncio.CancelledError:
                _http_bridge.cancel(str(request_id))
                raise

        @staticmethod
        async def get(url, *, headers=None, timeout=15.0):
            return await _Http.request(url, method="GET", headers=headers, timeout=timeout)

        @staticmethod
        async def post(url, body=None, *, headers=None, timeout=15.0):
            return await _Http.request(url, method="POST", headers=headers, body=body, timeout=timeout)

        @staticmethod
        async def put(url, body=None, *, headers=None, timeout=15.0):
            return await _Http.request(url, method="PUT", headers=headers, body=body, timeout=timeout)

        @staticmethod
        async def delete(url, *, headers=None, timeout=15.0):
            return await _Http.request(url, method="DELETE", headers=headers, timeout=timeout)


    _WEBSOCKET_CLOSED = object()


    class WebSocketClosed(ConnectionError):
        """Raised when a Graaly WebSocket has no more messages to receive."""

        def __init__(self, code=1000, reason=""):
            self.code = int(code)
            self.reason = str(reason)
            detail = f"WebSocket closed with code {self.code}"
            super().__init__(f"{detail}: {self.reason}" if self.reason else detail)


    class WebSocketConnection:
        """Pythonic async connection backed by the server's JDK WebSocket client."""

        __slots__ = (
            "id", "ready_state", "close_code", "close_reason",
            "_opened", "_messages", "_closed_error",
        )

        def __init__(self, connection_id, opened):
            self.id = str(connection_id)
            self.ready_state = "CONNECTING"
            self.close_code = None
            self.close_reason = ""
            self._opened = opened
            self._messages = _asyncio.Queue()
            self._closed_error = None

        @property
        def open(self):
            return self.ready_state == "OPEN"

        def _handle(self, payload):
            event_type = str(payload.get("type", ""))
            if event_type == "open":
                self.ready_state = "OPEN"
                if not self._opened.done():
                    self._opened.set_result(self)
                return
            if event_type == "message":
                self._messages.put_nowait(str(payload.get("data", "")))
                return
            if event_type == "binary":
                # Binary frames are represented as base64 text so plugins never
                # have to touch a Java ByteBuffer.
                self._messages.put_nowait(str(payload.get("data", "")))
                return
            if event_type == "close":
                self.ready_state = "CLOSED"
                self.close_code = int(payload.get("code", 1000))
                self.close_reason = str(payload.get("reason", ""))
                self._closed_error = WebSocketClosed(self.close_code, self.close_reason)
                self._messages.put_nowait(_WEBSOCKET_CLOSED)
                if not self._opened.done():
                    self._opened.set_exception(self._closed_error)
                return
            if event_type == "error":
                self.ready_state = "CLOSED"
                failure = ConnectionError(str(payload.get("error", "WebSocket connection failed")))
                self._closed_error = failure
                if not self._opened.done():
                    self._opened.set_exception(failure)
                else:
                    self._messages.put_nowait(failure)
                return

        async def _complete(self, operation):
            future = tasks._loop.create_future()

            def complete(raw):
                if future.done():
                    return
                payload = _json.loads(str(raw))
                failure = payload.get("error")
                if failure:
                    future.set_exception(RuntimeError(str(failure)))
                else:
                    future.set_result(None)

            operation(complete)
            return await future

        async def send_text(self, data):
            if self.ready_state != "OPEN":
                raise ConnectionError("WebSocket connection is not open")
            await self._complete(lambda complete: _websocket_bridge.send(
                self.id, str(data), complete,
            ))

        async def send_json(self, value):
            await self.send_text(_json.dumps(value, separators=(",", ":")))

        async def receive_text(self):
            item = await self._messages.get()
            if item is _WEBSOCKET_CLOSED:
                # Keep the sentinel available for every subsequent receiver.
                self._messages.put_nowait(_WEBSOCKET_CLOSED)
                raise self._closed_error or WebSocketClosed()
            if isinstance(item, BaseException):
                raise item
            return str(item)

        async def receive_json(self):
            return _json.loads(await self.receive_text())

        async def close(self, code=1000, reason=""):
            if self.ready_state == "CLOSED":
                return
            self.ready_state = "CLOSING"
            await self._complete(lambda complete: _websocket_bridge.close(
                self.id, int(code), str(reason), complete,
            ))

        async def __aenter__(self):
            return self

        async def __aexit__(self, exception_type, exception, traceback):
            await self.close()
            return False

        def __aiter__(self):
            return self

        async def __anext__(self):
            try:
                return await self.receive_text()
            except WebSocketClosed as exception:
                raise StopAsyncIteration from exception


    class WebSocketConnector:
        __slots__ = ("url", "headers", "timeout", "connection")

        def __init__(self, url, headers, timeout):
            self.url = str(url)
            self.headers = dict(headers or {})
            self.timeout = float(timeout)
            self.connection = None

        async def _open(self):
            if self.connection is not None:
                return self.connection
            opened = tasks._loop.create_future()
            queued = []
            holder = {}

            def event(raw):
                payload = _json.loads(str(raw))
                connection = holder.get("connection")
                if connection is None:
                    queued.append(payload)
                else:
                    connection._handle(payload)

            connection_id = _websocket_bridge.open(
                self.url, _json.dumps(self.headers, separators=(",", ":")),
                int(self.timeout * 1000.0), event,
            )
            connection = WebSocketConnection(connection_id, opened)
            self.connection = connection
            holder["connection"] = connection
            for payload in queued:
                connection._handle(payload)
            return await opened

        def __await__(self):
            return self._open().__await__()

        async def __aenter__(self):
            return await self._open()

        async def __aexit__(self, exception_type, exception, traceback):
            if self.connection is not None:
                await self.connection.close()
            return False


    class _WebSocket:
        @staticmethod
        def connect(url, *, headers=None, timeout=15.0):
            return WebSocketConnector(url, headers, timeout)


    class UiAction:
        __slots__ = ("type", "view_id", "action_id", "slot", "click", "shift", "right", "value", "player")

        def __init__(self, payload):
            self.type = str(payload.get("type", ""))
            self.view_id = payload.get("viewId")
            self.action_id = payload.get("actionId")
            self.slot = payload.get("slot")
            self.click = payload.get("click")
            self.shift = bool(payload.get("shift", False))
            self.right = bool(payload.get("right", False))
            self.value = payload.get("value")
            self.player = payload.get("player") or {}


    class _Ui:
        @staticmethod
        def message(text, *, id=None, channel="chat", subtitle=""):
            selected_id = id if id is not None else f"python:message:{channel}:{text}:{subtitle}"
            return {
                "id": str(selected_id), "channel": str(channel),
                "text": str(text), "subtitle": str(subtitle),
            }

        @staticmethod
        def item(slot, material, *, amount=1, durability=0, name="", lore=(), on_click=None):
            if on_click is not None and not callable(on_click):
                raise TypeError("ui.item on_click must be callable")
            return {
                "slot": int(slot), "material": str(material), "amount": int(amount),
                "durability": int(durability), "name": str(name),
                "lore": [str(line) for line in lore], "__on_click__": on_click,
            }

        @staticmethod
        def inventory(title, *items, id=None, rows=3, on_close=None):
            if on_close is not None and not callable(on_close):
                raise TypeError("ui.inventory on_close must be callable")
            return {
                "id": str(id if id is not None else f"python:inventory:{title}"),
                "title": str(title), "rows": int(rows), "items": list(items),
                "__on_close__": on_close,
            }

        @staticmethod
        def line(id, text):
            return {"id": str(id), "text": str(text)}

        @staticmethod
        def scoreboard(title, *lines):
            return {"title": str(title), "lines": list(lines)}

        @staticmethod
        def boss_bar(text, *, progress=1.0):
            return {"text": str(text), "progress": float(progress)}

        @staticmethod
        def tab(*, header="", footer=""):
            return {"header": str(header), "footer": str(footer)}

        @staticmethod
        def chat_input(
            prompt="Type your answer in chat. Type cancel to stop.", *, id=None,
            value="", cancel_word="cancel", on_submit=None, on_cancel=None,
        ):
            if on_submit is not None and not callable(on_submit):
                raise TypeError("ui.chat_input on_submit must be callable")
            if on_cancel is not None and not callable(on_cancel):
                raise TypeError("ui.chat_input on_cancel must be callable")
            return {
                "id": str(id if id is not None else f"python:input:{prompt}"),
                "prompt": str(prompt), "value": str(value),
                "cancelWord": str(cancel_word), "__on_submit__": on_submit,
                "__on_cancel__": on_cancel,
            }

        @staticmethod
        def view(*, messages=(), inventory=None, scoreboard=None, boss_bar=None, tab=None, input=None):
            return {
                "messages": list(messages), "inventory": inventory,
                "scoreboard": scoreboard, "bossBar": boss_bar, "tab": tab,
                "input": input,
            }

        @staticmethod
        def render(player, snapshot, on_action=None):
            if not isinstance(snapshot, dict):
                raise TypeError("ui.render snapshot must be a dict")
            if on_action is not None and not callable(on_action):
                raise TypeError("ui.render on_action must be callable")
            handlers = {}
            clean = dict(snapshot)
            inventory = snapshot.get("inventory")
            if isinstance(inventory, dict):
                clean_inventory = {
                    key: value for key, value in inventory.items()
                    if not str(key).startswith("__") and key != "items"
                }
                view_id = str(clean_inventory.get("id", "python:inventory"))
                close_handler = inventory.get("__on_close__")
                if close_handler is not None:
                    close_id = f"python:{view_id}:close"
                    handlers[close_id] = close_handler
                    clean_inventory["closeActionId"] = close_id
                clean_items = []
                for raw_item in inventory.get("items", ()):
                    if not isinstance(raw_item, dict):
                        raise TypeError("ui.inventory accepts ui.item dictionaries")
                    item = {
                        key: value for key, value in raw_item.items()
                        if not str(key).startswith("__")
                    }
                    click_handler = raw_item.get("__on_click__")
                    if click_handler is not None:
                        action_id = f"python:{view_id}:{int(item.get('slot', -1))}:click"
                        handlers[action_id] = click_handler
                        item["actionId"] = action_id
                    clean_items.append(item)
                clean_inventory["items"] = clean_items
                clean["inventory"] = clean_inventory

            raw_input = snapshot.get("input")
            if isinstance(raw_input, dict):
                clean_input = {
                    key: value for key, value in raw_input.items()
                    if not str(key).startswith("__")
                }
                input_id = str(clean_input.get("id", "python:input"))
                submit_handler = raw_input.get("__on_submit__")
                cancel_handler = raw_input.get("__on_cancel__")
                if submit_handler is not None:
                    submit_id = f"python:{input_id}:submit"
                    handlers[submit_id] = submit_handler
                    clean_input["submitActionId"] = submit_id
                if cancel_handler is not None:
                    cancel_id = f"python:{input_id}:cancel"
                    handlers[cancel_id] = cancel_handler
                    clean_input["cancelActionId"] = cancel_id
                clean["input"] = clean_input

            def adapted(raw):
                action = UiAction(_json.loads(str(raw)))
                selected = handlers.get(action.action_id)
                if selected is not None:
                    result = selected(action)
                    _handle_callback_result(result, f"ui-action:{_callback_name(selected, 'handler')}")
                if on_action is not None:
                    result = on_action(action)
                    _handle_callback_result(result, f"ui-action:{_callback_name(on_action, 'handler')}")
                return None

            _ui_bridge.render(
                _unwrap(player), _json.dumps(clean, separators=(",", ":")), adapted
            )

        @staticmethod
        def clear(player):
            _ui_bridge.clear(_unwrap(player))

        @staticmethod
        def dismiss(player, surface):
            _ui_bridge.dismiss(_unwrap(player), str(surface))
    
    
    class WorldGenerationContext:
        __slots__ = ("world", "random", "chunk_x", "chunk_z", "biomes", "chunk")
    
        def __init__(self, world, random, chunk_x, chunk_z, biomes, chunk):
            self.world = world
            self.random = random
            self.chunk_x = chunk_x
            self.chunk_z = chunk_z
            self.biomes = biomes
            self.chunk = chunk
    
    
    class WorldPopulateContext:
        __slots__ = ("world", "random", "chunk")
    
        def __init__(self, world, random, chunk):
            self.world = world
            self.random = random
            self.chunk = chunk
    
    
    class WorldSpawnContext:
        __slots__ = ("world", "x", "z")
    
        def __init__(self, world, x, z):
            self.world = world
            self.x = x
            self.z = z
    
    
    class WorldFixedSpawnContext:
        __slots__ = ("world", "random")
    
        def __init__(self, world, random):
            self.world = world
            self.random = random
    
    
    class _Worlds:
        def __iter__(self):
            return iter(self.all())

        def __len__(self):
            return int(_bridge.collection_size(_raw_server.getWorlds()))

        @staticmethod
        def all():
            return [_native(world) for world in _raw_server.getWorlds()]
    
        @staticmethod
        def get(name):
            return _native(_raw_server.getWorld(str(name)))
    
        @staticmethod
        def location(world, x, y, z, yaw=0.0, pitch=0.0):
            return getattr(_bukkit_module, "Location")(
                world, _finite_number(x, "x"), _finite_number(y, "y"),
                _finite_number(z, "z"), _finite_number(yaw, "yaw"),
                _finite_number(pitch, "pitch")
            )
    
        @staticmethod
        def create(name, *, seed=None, environment=None, world_type=None,
                   generate_structures=True, generator=None, generator_settings=None):
            creator = getattr(_bukkit_module, "WorldCreator")(str(name))
            if seed is not None:
                creator.seed(_java_long(seed, "seed"))
            if environment is not None:
                selected_environment = environment
                if isinstance(environment, str):
                    selected_environment = getattr(getattr(_bukkit_module, "World"), "Environment").value_of(environment.upper())
                creator.environment(selected_environment)
            if world_type is not None:
                selected_type = world_type
                if isinstance(world_type, str):
                    selected_type = getattr(_bukkit_module, "WorldType").value_of(world_type.upper())
                creator.type(selected_type)
            creator.generate_structures(bool(generate_structures))
            if generator_settings is not None:
                creator.generator_settings(str(generator_settings))
            if generator is not None:
                creator.generator(generator)
            return _native(creator.create_world())
    
        @staticmethod
        def generator(callback=None, *, generate=None, can_spawn=None,
                      default_populators=None, fixed_spawn=None):
            selected_generate = generate if generate is not None else callback
            if not callable(selected_generate):
                raise TypeError("worlds.generator requires a generate callback")
    
            def adapted(world, random, chunk_x, chunk_z, biomes, chunk):
                return selected_generate(WorldGenerationContext(
                    _native(world), _native(random), int(chunk_x), int(chunk_z),
                    _native(biomes), _native(chunk)
                ))
    
            def adapted_can_spawn(world, x, z):
                return bool(can_spawn(WorldSpawnContext(_native(world), int(x), int(z))))
    
            def adapted_populators(world):
                result = (default_populators(_native(world)) if callable(default_populators)
                          else default_populators)
                return [] if result is None else [_unwrap(item) for item in result]
    
            def adapted_fixed_spawn(world, random):
                return _unwrap(fixed_spawn(WorldFixedSpawnContext(_native(world), _native(random))))
    
            return _native(_bridge.world_generator(
                adapted,
                adapted_can_spawn if callable(can_spawn) else None,
                adapted_populators if default_populators is not None else None,
                adapted_fixed_spawn if callable(fixed_spawn) else None,
            ))
    
        @staticmethod
        def populator(callback):
            if not callable(callback):
                raise TypeError("worlds.populator requires a callback")
    
            def adapted(world, random, chunk):
                return callback(WorldPopulateContext(_native(world), _native(random), _native(chunk)))
    
            return _native(_bridge.block_populator(adapted))
    
        @staticmethod
        def unload(world_or_name, save=True):
            raw_world = (_raw_server.getWorld(str(world_or_name))
                         if isinstance(world_or_name, str) else _unwrap(world_or_name))
            return raw_world is not None and bool(_raw_server.unloadWorld(raw_world, bool(save)))


    _UNSET = object()


    def _canonical_constant(value, label):
        name = str(value).strip().upper().replace("-", "_").replace(" ", "_")
        if not name:
            raise TypeError(f"{label} cannot be empty")
        return name


    class _Entities:
        """Python-native entity operations backed by Graaly's version adapters."""

        @staticmethod
        def type(name):
            return getattr(getattr(_bukkit_module, "EntityType"),
                           _canonical_constant(name, "entity type"))

        @staticmethod
        def attribute_type(name):
            compatibility.require("attributes")
            return getattr(getattr(_bukkit_module, "Attribute"),
                           _canonical_constant(name, "attribute"))

        @staticmethod
        def spawn(location, entity_type, **options):
            raw_location = _unwrap(location)
            raw_world = _bridge.invoke_packed(raw_location, "getWorld", [])
            if raw_world is None:
                raise TypeError("entities.spawn requires a location with a world")
            selected_type = (_Entities.type(entity_type)
                             if isinstance(entity_type, str) else entity_type)
            entity = _native(_bridge.invoke_packed(
                raw_world, "spawnEntity", [raw_location, _unwrap(selected_type)]
            ))
            return _Entities.configure(entity, **options)

        @staticmethod
        def configure(entity, *, name=_UNSET, custom_name=_UNSET,
                      name_visible=_UNSET, custom_name_visible=_UNSET,
                      attributes=None, ai=_UNSET, invulnerable=_UNSET,
                      gravity=_UNSET, glowing=_UNSET):
            raw_entity = _unwrap(entity)

            def call(method, value):
                return _bridge.invoke_packed(raw_entity, method, [value])

            selected_name = custom_name if custom_name is not _UNSET else name
            if selected_name is not _UNSET:
                call("setCustomName", None if selected_name is None else str(selected_name))
            selected_visible = (custom_name_visible
                                if custom_name_visible is not _UNSET else name_visible)
            if selected_visible is not _UNSET:
                call("setCustomNameVisible", bool(selected_visible))
            for attribute_name, value in (attributes or {}).items():
                _Entities.attribute(entity, attribute_name, value)
            for selected, feature, method in (
                (ai, "entity_ai", "setAI"),
                (invulnerable, "entity_invulnerable", "setInvulnerable"),
                (gravity, "entity_gravity", "setGravity"),
                (glowing, "glowing", "setGlowing"),
            ):
                if selected is _UNSET:
                    continue
                compatibility.require(feature)
                call(method, bool(selected))
            return _native(raw_entity)

        @staticmethod
        def attribute(entity, name, base_value=_UNSET):
            compatibility.require("attributes")
            selected = (_Entities.attribute_type(name) if isinstance(name, str) else name)
            raw_instance = _bridge.invoke_packed(
                _unwrap(entity), "getAttribute", [_unwrap(selected)]
            )
            if raw_instance is None:
                raise TypeError(f"The entity does not expose attribute {name}")
            if base_value is not _UNSET:
                _bridge.invoke_packed(
                    raw_instance, "setBaseValue", [_finite_number(base_value, "base_value")]
                )
            return _native(raw_instance)

        @staticmethod
        def remove(entity):
            _bridge.invoke_packed(_unwrap(entity), "remove", [])
    
    
    class _Adapters:
        @staticmethod
        def extend(base, *constructor_args, **handlers):
            if not handlers:
                raise TypeError("extend requires callback methods as keyword arguments")
            adapted = _types.SimpleNamespace()
            for name, callback in handlers.items():
                if not callable(callback):
                    raise TypeError(f"extension handler {name!r} must be callable")
    
                def native_callback(*raw_args, _callback=callback):
                    return _unwrap(_callback(*(_native(arg) for arg in raw_args)))
    
                setattr(adapted, name, native_callback)
            return _native(_bridge.adapt_packed(_unwrap(base), adapted,
                                              [_unwrap(arg) for arg in constructor_args]))
    
        @staticmethod
        def implement(contract, **handlers):
            return _Adapters.extend(contract, **handlers)
    
    
    class _Text:
        @staticmethod
        def color(message):
            return str(_bridge.color(message))
    
    
    class _PacketNamespace:
        __slots__ = ("_path", "_children", "_cache")
    
        def __init__(self, path, children):
            self._path = path
            self._children = children
            self._cache = {}
    
        def __getattr__(self, name):
            if name not in self._children:
                raise AttributeError(f"Unknown packet constant {self._path + '.' if self._path else ''}{name}")
            if name in self._cache:
                return self._cache[name]
            child = self._children[name]
            path = f"{self._path}.{name}" if self._path else name
            value = (_PacketNamespace(path, child) if isinstance(child, dict)
                     else _native(_packet_bridge.packet_type(path)))
            self._cache[name] = value
            return value
    
        def __dir__(self):
            return sorted(self._children)
    
        def __repr__(self):
            return f"<PacketType {self._path or 'root'}>"
    
    
    _packet_tree = {}
    for _raw_path in _packet_bridge.get_packet_type_paths():
        _path = str(_raw_path)
        _parts = _path.split(".")
        _node = _packet_tree
        for _part in _parts[:-1]:
            _node = _node.setdefault(_part, {})
        _node[_parts[-1]] = _path
    
    PacketType = _PacketNamespace("", _packet_tree)
    Handshaking = PacketType.Handshaking
    Status = PacketType.Status
    Login = PacketType.Login
    ConfigurationPackets = PacketType.Configuration
    Play = PacketType.Play
    ClientPacket = Play.Client
    ServerPacket = Play.Server
    
    
    class PacketContext:
        __slots__ = (
            "_event", "direction", "packet_type", "packet_name", "user", "player", "client_version"
        )
    
        def __init__(self, raw, direction):
            self._event = raw
            self.direction = direction
            self.packet_type = _native(raw.getPacketType())
            self.packet_name = str(raw.getPacketName())
            self.user = _native(raw.getUser())
            self.player = _native(raw.getPlayer())
            self.client_version = _native(raw.getClientVersion())
    
        @property
        def cancelled(self):
            return bool(self._event.isCancelled())
    
        @cancelled.setter
        def cancelled(self, value):
            self._event.setCancelled(bool(value))
    
        def cancel(self, cancelled=True):
            self._event.setCancelled(bool(cancelled))
    
        def reencode(self):
            self._event.markForReEncode(True)
    
        def wrap(self, wrapper_type):
            return _native(_packet_bridge.wrap(_unwrap(wrapper_type), self._event))
    
    
    _packet_type_root = PacketType
    _client_packet_root = ClientPacket
    _server_packet_root = ServerPacket

    def _synchronous_packet_callback(callback):
        candidates = (callback, getattr(callback, "__call__", None))
        if any(candidate is not None and (
            _inspect.iscoroutinefunction(candidate)
            or _inspect.isgeneratorfunction(candidate)
            or _inspect.isasyncgenfunction(candidate)
        ) for candidate in candidates):
            raise TypeError(
                "Packet listeners must be synchronous because PacketEvents must finish "
                "reading, changing, or cancelling a packet before the network pipeline continues. "
                "Start follow-up work with tasks.create_task() from a synchronous listener."
            )
        return callback

    def _packet_callback_adapter(callback, direction):
        disabled = False

        def adapted(raw):
            nonlocal disabled
            if disabled:
                return None
            context = PacketContext(raw, direction)
            try:
                result = callback(context)
            except Exception as failure:
                disabled = True
                details = "".join(_traceback.format_exception(
                    type(failure), failure, failure.__traceback__
                )).strip()
                _bridge.error(
                    f"Disabled {direction} packet listener for {context.packet_name} after it threw: {details}"
                )
                return None

            if result is None:
                return None

            disabled = True
            close = getattr(result, "close", None)
            if close is not None:
                try:
                    close()
                except Exception:
                    pass
            _bridge.error(
                f"Disabled {direction} packet listener for {context.packet_name}: "
                "listeners must finish synchronously and return None. "
                "Use tasks.create_task() for follow-up asynchronous work and do not return an iterator."
            )
            return None

        return adapted

    class _Packets:
        PacketType = _packet_type_root
        Client = _client_packet_root
        Server = _server_packet_root
    
        @property
        def available(self):
            return bool(_packet_bridge.is_available())
    
        @property
        def version(self):
            return str(_packet_bridge.get_version()) if self.available else None
    
        @staticmethod
        def create(wrapper_type, *args):
            return _native(_packet_bridge.create_packed(_unwrap(wrapper_type), [_unwrap(arg) for arg in args]))
    
        @staticmethod
        def wrap(wrapper_type, packet_event):
            raw = packet_event._event if isinstance(packet_event, PacketContext) else _unwrap(packet_event)
            return _native(_packet_bridge.wrap(_unwrap(wrapper_type), raw))
    
        @staticmethod
        def on_receive(packet_type, callback, *, priority="NORMAL"):
            callback = _synchronous_packet_callback(callback)
            adapted = _packet_callback_adapter(callback, "receive")
            _packet_bridge.on_receive(_unwrap(packet_type), priority, adapted)
            return callback
    
        @staticmethod
        def listen_receive(packet_type=None, *, priority="NORMAL"):
            def decorator(callback):
                return _Packets.on_receive(packet_type, callback, priority=priority)
            return decorator
    
        @staticmethod
        def on_send(packet_type, callback, *, priority="NORMAL"):
            callback = _synchronous_packet_callback(callback)
            adapted = _packet_callback_adapter(callback, "send")
            _packet_bridge.on_send(_unwrap(packet_type), priority, adapted)
            return callback
    
        @staticmethod
        def listen_send(packet_type=None, *, priority="NORMAL"):
            def decorator(callback):
                return _Packets.on_send(packet_type, callback, priority=priority)
            return decorator
    
        @staticmethod
        def send(player, packet, *, silent=False):
            if silent:
                _packet_bridge.send_silently(_unwrap(player), _unwrap(packet))
            else:
                _packet_bridge.send(_unwrap(player), _unwrap(packet))
    
        @staticmethod
        def send_to_all(packet, *, silent=False):
            for player in players.online():
                _Packets.send(player, packet, silent=silent)
    
        @staticmethod
        def receive(player, packet, *, silent=False):
            if silent:
                _packet_bridge.receive_silently(_unwrap(player), _unwrap(packet))
            else:
                _packet_bridge.receive(_unwrap(player), _unwrap(packet))
    
        @staticmethod
        def user(player):
            return _native(_packet_bridge.user(_unwrap(player)))
    
        @staticmethod
        def client_version(player):
            return _native(_packet_bridge.client_version(_unwrap(player)))
    
        @staticmethod
        def ping(player):
            return int(_packet_bridge.ping(_unwrap(player)))
    
    
    class _LazySymbolModule(_types.ModuleType):
        def __init__(self, name, symbols, factory, fixed=None):
            super().__init__(name)
            self.__dict__["_symbols"] = frozenset(symbols)
            self.__dict__["_factory"] = factory
            self.__dict__["__all__"] = tuple(sorted(symbols))
            if fixed:
                self.__dict__.update(fixed)
                self.__dict__["__all__"] = tuple(sorted(set(self.__all__) | set(fixed)))
    
        def __getattr__(self, name):
            if name not in self._symbols:
                raise AttributeError(f"module {self.__name__!r} has no attribute {name!r}")
            value = self._factory(name)
            setattr(self, name, value)
            return value
    
        def __dir__(self):
            return sorted(set(super().__dir__()) | set(self._symbols))


    class _ConstantNamespace:
        __slots__ = ("_namespace", "_names", "_cache")

        def __init__(self, namespace, names):
            self._namespace = str(namespace)
            self._names = frozenset(str(name) for name in names)
            self._cache = {}

        def __getattr__(self, name):
            if name not in self._names:
                raise AttributeError(f"Unknown Graaly constant {self._namespace}.{name}")
            if name not in self._cache:
                self._cache[name] = _native(_bridge.named_constant(self._namespace, name))
            return self._cache[name]

        def __dir__(self):
            return sorted(self._names)

        def __repr__(self):
            return f"<Graaly constants {self._namespace}>"
    
    
    class _Compatibility:
        contract_version = str(_bridge.contract_version())
        minimum_game_version = str(_bridge.minimum_game_version())
        minecraft_version = str(_bridge.minecraft_version())
        server_version = str(_bridge.server_version())

        @staticmethod
        def supports(feature):
            return bool(_bridge.supports(str(feature)))

        @staticmethod
        def require(feature):
            _bridge.require_feature(str(feature))

        @staticmethod
        def type_available(name):
            return bool(_bridge.type_available(str(name)))

        @staticmethod
        def material(name):
            return _native(_bridge.material(str(name)))


    class _Diagnostics:
        @staticmethod
        def verify():
            for name in _bukkit_names:
                getattr(_bukkit_module, name)._resolve()
            for name in _wrapper_names:
                getattr(_packet_wrapper_module, name)._resolve()
            for name in _packet_type_names:
                getattr(_packet_type_module, name)._resolve()
    
            def count_constants(node):
                total = 0
                for name in dir(node):
                    value = getattr(node, name)
                    total += count_constants(value) if hasattr(value, "_children") else 1
                return total
    
            return {
                "api_symbols": len(_bukkit_names),
                "wrappers": len(_wrapper_names),
                "packet_types": len(_packet_type_names),
                "packet_constants": count_constants(PacketType),
            }
    
    
    _bukkit_names = tuple(str(name) for name in _bridge.get_api_type_names())
    _wrapper_names = tuple(str(name) for name in _packet_bridge.get_wrapper_type_names())
    _packet_type_names = tuple(str(name) for name in _packet_bridge.get_type_names())
    _wrapper_name_set = frozenset(_wrapper_names)
    _packet_names = tuple(sorted(_wrapper_name_set | frozenset(_packet_type_names)))
    _bukkit_module = _LazySymbolModule(
        "graaly.api",
        _bukkit_names,
        lambda name: _ApiType(name, _bridge.named_api_type),
    )
    _packet_wrapper_module = _LazySymbolModule(
        "graaly.packetevents.wrappers",
        _wrapper_names,
        _PacketWrapperType,
    )
    _packet_type_module = _LazySymbolModule(
        "graaly.packetevents.types",
        _packet_type_names,
        lambda name: _ApiType(name, _packet_bridge.named_type),
    )
    
    
    def _packet_symbol(name):
        if name in _wrapper_name_set:
            return getattr(_packet_wrapper_module, name)
        return getattr(_packet_type_module, name)
    
    
    _packet_module = _LazySymbolModule(
        "graaly.packetevents",
        _packet_names,
        _packet_symbol,
        {
            "PacketType": PacketType,
            "Handshaking": Handshaking,
            "Status": Status,
            "Login": Login,
            "ConfigurationPackets": ConfigurationPackets,
            "Play": Play,
            "ClientPacket": ClientPacket,
            "ServerPacket": ServerPacket,
            "PacketContext": PacketContext,
        },
    )

    _constant_global_names = {
        "Material": "Materials",
        "Sound": "Sounds",
        "Particle": "Particles",
        "DyeColor": "DyeColors",
        "EntityType": "EntityTypes",
        "Attribute": "Attributes",
        "GameMode": "GameModes",
        "Difficulty": "Difficulties",
        "WorldEnvironment": "WorldEnvironments",
        "WorldType": "WorldTypes",
        "Biome": "Biomes",
        "PotionEffect": "PotionEffects",
        "Enchantment": "Enchantments",
    }
    _constant_globals = {}
    _constants_module = _types.ModuleType("graaly.constants")
    for _namespace in _bridge.get_constant_namespace_names():
        _namespace = str(_namespace)
        _values = _ConstantNamespace(_namespace, _bridge.get_constant_names(_namespace))
        setattr(_constants_module, _namespace, _values)
        _global_name = _constant_global_names[_namespace]
        setattr(_constants_module, _global_name, _values)
        _constant_globals[_global_name] = _values
    _constants_module.__dict__["__all__"] = tuple(sorted(
        set(_constant_global_names) | set(_constant_global_names.values())
    ))
    
    plugin = _native(_raw_plugin)
    server = _native(_raw_server)
    logger = _native(_raw_logger)
    data_folder = _native(_raw_data_folder)
    data_file = lambda path: _native(_bridge.data_file(path))
    tasks = _Tasks()
    _bridge.configure_python_tasks(tasks._activate, tasks._pump, tasks._shutdown, _handle_callback_result)
    config = _Config()
    players = _Players()
    boards = _Boards()
    http = _Http()
    websocket = _WebSocket()
    ui = _Ui()
    worlds = _Worlds()
    entities = _Entities()
    compatibility = _Compatibility()
    adapters = _Adapters()
    extend = adapters.extend
    text = _Text()
    packets = _Packets()
    diagnostics = _Diagnostics()
    constants = _constants_module
    info = _bridge.info
    warn = _bridge.warn
    error = _bridge.error
    
    _core_exports = {
        "CommandContext": CommandContext,
        "PacketContext": PacketContext,
        "WorldGenerationContext": WorldGenerationContext,
        "WorldPopulateContext": WorldPopulateContext,
        "WorldSpawnContext": WorldSpawnContext,
        "WorldFixedSpawnContext": WorldFixedSpawnContext,
        "GraalyUnsupportedFeature": GraalyUnsupportedFeature,
        "plugin": plugin,
        "server": server,
        "logger": logger,
        "data_folder": data_folder,
        "data_file": data_file,
        "event": event,
        "on": on,
        "command": command,
        "tab_complete": tab_complete,
        "tasks": tasks,
        "config": config,
        "players": players,
        "boards": boards,
        "BoardMessage": BoardMessage,
        "http": http,
        "HttpResponse": HttpResponse,
        "websocket": websocket,
        "WebSocketConnection": WebSocketConnection,
        "WebSocketConnector": WebSocketConnector,
        "WebSocketClosed": WebSocketClosed,
        "ui": ui,
        "UiAction": UiAction,
        "worlds": worlds,
        "entities": entities,
        "compatibility": compatibility,
        "adapters": adapters,
        "extend": extend,
        "text": text,
        "packets": packets,
        "diagnostics": diagnostics,
        "constants": constants,
        "PacketType": PacketType,
        "Handshaking": Handshaking,
        "Status": Status,
        "Login": Login,
        "ConfigurationPackets": ConfigurationPackets,
        "Play": Play,
        "ClientPacket": ClientPacket,
        "ServerPacket": ServerPacket,
        "info": info,
        "warn": warn,
        "error": error,
    }
    _core_exports.update(_constant_globals)
    
    
    class _GraalyModule(_types.ModuleType):
        def __getattr__(self, name):
            if name in _bukkit_names:
                value = getattr(_bukkit_module, name)
            elif name in _packet_names:
                value = getattr(_packet_module, name)
            else:
                raise AttributeError(f"module {self.__name__!r} has no attribute {name!r}")
            setattr(self, name, value)
            return value
    
        def __dir__(self):
            return sorted(set(super().__dir__()) | set(_bukkit_names) | set(_packet_names))
    
    
    _module = _GraalyModule("graaly")
    _module.__dict__.update(_core_exports)
    _module.__dict__["__path__"] = []
    _module.__dict__["__all__"] = tuple(sorted(set(_core_exports) | set(_bukkit_names) | set(_packet_names)))
    _sys.modules["graaly"] = _module
    _sys.modules["graaly.api"] = _bukkit_module
    _sys.modules["graaly.packetevents"] = _packet_module
    _sys.modules["graaly.packetevents.wrappers"] = _packet_wrapper_module
    _sys.modules["graaly.packetevents.types"] = _packet_type_module
    _sys.modules["graaly.constants"] = _constants_module
    # Direct symbols also work in a zero-import script; explicit imports remain the
    # recommended Python style because editors can then organize and autocomplete them.
    for _name in _bukkit_names:
        if _name not in globals():
            globals()[_name] = getattr(_bukkit_module, _name)
    for _name in _packet_names:
        if _name not in globals():
            globals()[_name] = getattr(_packet_module, _name)
    for _name, _value in _constant_globals.items():
        if _name not in globals():
            globals()[_name] = _value
    
    del _name, _value, _core_exports, _module


_install(
    __graaly_bridge__,
    __graaly_plugin__,
    __graaly_server__,
    __graaly_logger__,
    __graaly_data_folder__,
)
del _install
