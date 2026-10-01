"""Small, documented JSON helpers shared by the Academy's portable exercises.

These are ordinary Python operations. The C and JavaScript editions implement
the same operations; none knows a problem ID, a test case or its expected answer.
"""
import copy as _copy
import json as _json
import math as _math
import re as _re
import struct as _struct
import sqlite3 as _sqlite
from decimal import Decimal as _Decimal, ROUND_HALF_UP as _ROUND_HALF_UP
from datetime import datetime as _datetime
from types import MappingProxyType as _MappingProxyType
from urllib.parse import quote as _quote, urlsplit as _urlsplit, parse_qsl as _parse_qsl


def get(value, key, default=None):
    if isinstance(value, (list, str)) and key == "length":
        return len(value)
    if isinstance(value, dict):
        return value.get(str(key), default)
    if isinstance(value, (list, str)) and isinstance(key, int):
        return value[key] if -len(value) <= key < len(value) else default
    return default


def clone(value):
    return _copy.deepcopy(value)


def keys(value):
    return list(value) if isinstance(value, dict) else []


def sort_fields(values, fields=None):
    result = clone(values)
    if not fields:
        return sorted(result)
    for field in reversed(fields):
        name, _, direction = field.partition(":")
        key = int(name) if name.isdigit() else name
        result.sort(key=lambda x: get(x, key), reverse=direction == "desc")
    return result


def unique(values):
    result = []
    for value in values:
        if value not in result:
            result.append(clone(value))
    return result


def delete_key(value, key):
    value.pop(str(key), None)


def floor(value):
    return _math.floor(value)


def ceil(value):
    return _math.ceil(value)


def is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def is_integer(value):
    return is_number(value) and int(value) == value


def is_string(value):
    return isinstance(value, str)


def is_list(value):
    return isinstance(value, list)


def is_object(value):
    return isinstance(value, dict)


def uri_component(value):
    text = str(value).lower() if isinstance(value, bool) else str(value)
    return _quote(text, safe="~!*'()")


def byte_length(value):
    return len(value.encode("utf8"))


def query_params(url):
    return dict(_parse_qsl(_urlsplit(url).query, keep_blank_values=True))


def url_path(url):
    return _urlsplit(url).path or "/"


def _word(value):
    return int(value, 0) if isinstance(value, str) else int(value)


def bits_count(value):
    return (_word(value) & ((1 << 64) - 1)).bit_count()


def bits_op(operation, a, b):
    left, right = _word(a), _word(b)
    result = left | right if operation == "or" else left & right if operation == "and" else left & ~right
    return hex(result & ((1 << 64) - 1))


def bits_shift(value, shift):
    return 0 if shift >= 64 else (_word(value) << shift) & ((1 << 64) - 1)


def bits_extract(word, offset, width):
    if not width or offset >= 64 or width > 64 - offset:
        return 0
    return (_word(word) >> offset) & ((1 << width) - 1)


def rotate32(word, count):
    count %= 32
    return word if count == 0 else ((word << count) | (word >> (32 - count))) & 0xffffffff


def float_bits(value):
    return _struct.unpack("<I", _struct.pack("<f", float(value)))[0]


def frozen_probe(data, defaults, field, value, list_field):
    first = _MappingProxyType({**clone(defaults), **clone(data)})
    second = _MappingProxyType({**clone(defaults), **clone(data)})
    frozen = False
    try:
        first[field] = value
    except TypeError:
        frozen = True
    expected = clone(second[list_field])
    first[list_field].append("probe")
    return {"frozen": frozen, "independent_defaults": second[list_field] == expected}


def regex(pattern, value):
    return _re.search(pattern, value) is not None


def json_text(value):
    return _json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def json_parse(value):
    return _json.loads(value)


def decimal_total(items):
    total = sum((_Decimal(x["price"]) * x["quantity"] for x in items), _Decimal(0))
    return str(total.quantize(_Decimal("0.01"), rounding=_ROUND_HALF_UP))


def epoch(value):
    return _datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()


def sql_rows(fixture, schema, query):
    with _sqlite.connect(":memory:") as db:
        db.row_factory = _sqlite.Row
        db.execute("PRAGMA foreign_keys=ON")
        db.executescript(schema)
        db.executescript(get(fixture, "setup", ""))
        result = []
        # SQL exercises intentionally contain simple statements, not triggers.
        for statement in query.split(";"):
            if statement.strip():
                cursor = db.execute(statement, get(fixture, "params", {}))
                if cursor.description:
                    result = [dict(row) for row in cursor.fetchall()]
        if get(fixture, "inspect"):
            result = [dict(row) for row in db.execute(fixture["inspect"])]
        return result


def select_paths(value, paths):
    result = {}
    for path in paths:
        parts = path.split(".")
        current = value
        while parts:
            count = len(parts)
            if not isinstance(current, dict):
                count = 1
            else:
                while count > 1 and ".".join(parts[:count]) not in current:
                    count -= 1
            key = ".".join(parts[:count])
            if isinstance(current, list):
                key = int(key) if key.isdigit() else key
            current = get(current, key)
            parts = parts[count:]
        result[path] = current
    return result
