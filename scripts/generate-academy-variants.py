#!/usr/bin/env python3
"""Lower the deliberately small portable Python subset to readable native C/JS.

This is a build-time source generator, never a runtime interpreter. Generated C
is compiled by Clang, Python is executed by CPython, and JS by the JS engine.
The original framework/native solutions stay independently authored and tested.
Unsupported syntax fails the build instead of silently changing an algorithm.
"""
import ast
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OPERATORS = {ast.Add: "add", ast.Sub: "sub", ast.Mult: "mul", ast.Div: "div", ast.FloorDiv: "idiv", ast.Mod: "mod", ast.Pow: "pow", ast.BitAnd: "band", ast.BitOr: "bor", ast.BitXor: "bxor", ast.LShift: "shl", ast.RShift: "shr"}
COMPARE = {ast.Eq: "eq", ast.NotEq: "ne", ast.Lt: "lt", ast.LtE: "le", ast.Gt: "gt", ast.GtE: "ge", ast.Is: "eq", ast.IsNot: "ne", ast.In: "in", ast.NotIn: "not_in"}
HELPERS = {"get", "clone", "keys", "sort_fields", "unique", "floor", "ceil", "is_number", "is_integer", "is_string", "regex", "json_text", "json_parse", "decimal_total", "epoch", "sql_rows", "select_paths", "len", "range", "str", "int", "float", "bool", "min", "max", "abs", "sum", "round", "list", "reversed", "delete_key"}
HELPERS.update({"is_list", "is_object", "uri_component", "byte_length"})
HELPERS.update({"bits_count", "bits_op", "bits_shift", "bits_extract", "rotate32", "float_bits"})
HELPERS.add("frozen_probe")
HELPERS.update({"query_params", "url_path"})


class Generator:
    def __init__(self, tree, language):
        self.tree, self.language, self.counter = tree, language, 0
        self.functions = {x.name for x in tree.body if isinstance(x, ast.FunctionDef)}

    def fail(self, node):
        raise ValueError(f"Unsupported portable syntax at line {getattr(node, 'lineno', '?')}: {ast.dump(node)}")

    def name(self, value):
        reserved={"default", "delete", "new", "var", "let", "const", "switch", "case", "export", "import", "function", "typeof", "instanceof", "yield", "await", "interface", "private", "public", "static"}
        return "v_" + value if self.language == "c" or value in reserved else value

    def helper(self, name, args):
        prefix = "j_" if self.language == "c" else "h."
        if name in {"min", "max"} and len(args) != 2:
            raise ValueError("portable min/max require exactly two operands")
        if self.language == "c":
            defaults = {"get": (3, "j_null()"), "sort_fields": (2, "j_null()"), "range": (3, "j_null()"), "round": (2, "j_num(0)"), "list": (1, "j_array(0)"), "pop": (2, "j_num(-1)"), "split": (2, "j_null()")}
            if name in defaults:
                count, default = defaults[name]
                args += [default] * (count - len(args))
        if self.language == "c":
            name = {"str": "str_convert", "bool": "bool_value"}.get(name, name)
        return prefix + name + "(" + ", ".join(args) + ")"

    def expression(self, node):
        c = self.language == "c"
        if isinstance(node, ast.Constant):
            if node.value is None:
                return "j_null()" if c else "null"
            if isinstance(node.value, bool):
                return f"j_bool({int(node.value)})" if c else str(node.value).lower()
            if isinstance(node.value, (int, float)):
                return f"j_num({node.value})" if c else repr(node.value)
            if c:
                literal = '"' + ''.join(chr(byte) if 32 <= byte < 127 and byte not in (34, 92) else '\\"' if byte == 34 else '\\\\' if byte == 92 else '\\' + format(byte, '03o') for byte in node.value.encode('utf8')) + '"'
            else:
                literal = json.dumps(node.value, ensure_ascii=False)
            return f"j_str({literal})" if c else literal
        if isinstance(node, ast.Name):
            return self.name(node.id)
        if isinstance(node, (ast.List, ast.Tuple)):
            args = [self.expression(x) for x in node.elts]
            return "j_array(" + str(len(args)) + (", " if args else "") + ", ".join(args) + ")" if c else "[" + ", ".join(args) + "]"
        if isinstance(node, ast.Dict):
            if any(x is None for x in node.keys):
                self.fail(node)
            args = []
            for key, value in zip(node.keys, node.values):
                args.extend([self.expression(key), self.expression(value)])
            return "j_object(" + str(len(node.keys)) + (", " if args else "") + ", ".join(args) + ")" if c else "h.object([" + ", ".join("[" + args[i] + ", " + args[i+1] + "]" for i in range(0, len(args), 2)) + "])"
        if isinstance(node, ast.Subscript):
            if isinstance(node.slice, ast.Slice):
                return self.helper("slice", [self.expression(node.value), self.expression(node.slice.lower) if node.slice.lower else ("j_null()" if c else "null"), self.expression(node.slice.upper) if node.slice.upper else ("j_null()" if c else "null"), self.expression(node.slice.step) if node.slice.step else ("j_num(1)" if c else "1")])
            return self.helper("get", [self.expression(node.value), self.expression(node.slice)])
        if isinstance(node, ast.BinOp):
            return self.helper(OPERATORS[type(node.op)], [self.expression(node.left), self.expression(node.right)])
        if isinstance(node, ast.UnaryOp):
            names = {ast.Not: "not", ast.USub: "neg", ast.Invert: "invert", ast.UAdd: "float"}
            return self.helper(names[type(node.op)], [self.expression(node.operand)])
        if isinstance(node, ast.Compare):
            expressions = []
            left = node.left
            for op, right in zip(node.ops, node.comparators):
                expressions.append(self.helper(COMPARE[type(op)], [self.expression(left), self.expression(right)]))
                left = right
            if len(expressions) == 1:
                return expressions[0]
            return ("j_bool(" if c else "(") + " && ".join(self.truth(x) for x in expressions) + ")"
        if isinstance(node, ast.BoolOp):
            values = [self.expression(x) for x in node.values]
            # Operand expressions in this subset are side-effect free.
            result = values[-1]
            for value in reversed(values[:-1]):
                result = "(" + self.truth(value) + " ? " + (result if isinstance(node.op, ast.And) else value) + " : " + (value if isinstance(node.op, ast.And) else result) + ")"
            return result
        if isinstance(node, ast.IfExp):
            return "(" + self.truth(self.expression(node.test)) + " ? " + self.expression(node.body) + " : " + self.expression(node.orelse) + ")"
        if isinstance(node, ast.Call):
            if node.keywords:
                self.fail(node)
            args = [self.expression(x) for x in node.args]
            if isinstance(node.func, ast.Name):
                if node.func.id in self.functions:
                    return self.name(node.func.id) + "(" + ", ".join(args) + ")"
                if node.func.id in HELPERS:
                    return self.helper(node.func.id, args)
            if isinstance(node.func, ast.Attribute):
                receiver = self.expression(node.func.value)
                if node.func.attr == "get":
                    return self.helper("get", [receiver, *args])
                return self.helper(node.func.attr, [receiver, *args])
        self.fail(node)

    def truth(self, value):
        return ("j_truth(" if self.language == "c" else "h.truth(") + value + ")"

    def assignment(self, target, value):
        if isinstance(target, ast.Name):
            return self.name(target.id) + " = " + value + ";"
        if isinstance(target, ast.Subscript):
            return self.helper("set", [self.expression(target.value), self.expression(target.slice), value]) + ";"
        if isinstance(target, (ast.Tuple, ast.List)):
            self.counter += 1
            temporary = "tuple_" + str(self.counter)
            declaration = "J *" if self.language == "c" else "const "
            return declaration + temporary + " = " + value + ";\n" + "\n".join(self.assignment(x, self.helper("get", [temporary, "j_num(" + str(i) + ")" if self.language == "c" else str(i)])) for i, x in enumerate(target.elts))
        self.fail(target)

    def statements(self, nodes, level=1):
        result = []
        indent = "    " * level
        for node in nodes:
            if isinstance(node, ast.Assign):
                if len(node.targets) != 1:
                    self.fail(node)
                value = self.assignment(node.targets[0], self.expression(node.value))
            elif isinstance(node, ast.AugAssign):
                value = self.assignment(node.target, self.helper(OPERATORS[type(node.op)], [self.expression(node.target), self.expression(node.value)]))
            elif isinstance(node, ast.Return):
                value = "return " + (self.expression(node.value) if node.value else ("j_null()" if self.language == "c" else "null")) + ";"
            elif isinstance(node, ast.Expr):
                if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
                    value = "// " + node.value.value.replace("\n", " ")
                else:
                    value = self.expression(node.value) + ";"
            elif isinstance(node, ast.If):
                value = "if (" + self.truth(self.expression(node.test)) + ") {\n" + self.statements(node.body, level+1) + "\n" + indent + "}"
                if node.orelse:
                    value += " else {\n" + self.statements(node.orelse, level+1) + "\n" + indent + "}"
            elif isinstance(node, ast.While):
                if node.orelse:
                    self.fail(node)
                value = "while (" + self.truth(self.expression(node.test)) + ") {\n" + self.statements(node.body, level+1) + "\n" + indent + "}"
            elif isinstance(node, ast.For):
                if node.orelse:
                    self.fail(node)
                self.counter += 1
                number = str(self.counter)
                seq, index = "seq_" + number, "index_" + number
                prefix = "J *" if self.language == "c" else "const "
                integer = "size_t " if self.language == "c" else "let "
                length = "j_length(" + seq + ")" if self.language == "c" else seq + ".length"
                item = "j_at(" + seq + ", " + index + ")" if self.language == "c" else seq + "[" + index + "]"
                # Clone the iterable like Python's explicit list() where needed;
                # algorithms never mutate the length of an active iterable.
                value = prefix + seq + " = " + self.expression(node.iter) + ";\n" + indent + "for (" + integer + index + " = 0; " + index + " < " + length + "; ++" + index + ") {\n" + "    "*(level+1) + self.assignment(node.target, item).replace("\n", "\n" + "    "*(level+1)) + "\n" + self.statements(node.body, level+1) + "\n" + indent + "}"
            elif isinstance(node, (ast.Break, ast.Continue)):
                value = "break;" if isinstance(node, ast.Break) else "continue;"
            elif isinstance(node, ast.Pass):
                value = ";"
            else:
                self.fail(node)
            result.append(indent + value.replace("\n", "\n", 1))
        return "\n".join(result)

    def generate(self):
        functions = [x for x in self.tree.body if isinstance(x, ast.FunctionDef)]
        if len(functions) != len(self.tree.body):
            raise ValueError("portable files contain only function definitions")
        c = self.language == "c"
        result = ["#include <graaly/academy_json.h>\n" if c else 'import * as h from "@graaly/academy";\n']
        if c:
            result += ["J *" + self.name(fn.name) + "(" + ", ".join("J *" + self.name(arg.arg) for arg in fn.args.args) + ");" for fn in functions]
        for fn in functions:
            args = {x.arg for x in fn.args.args}
            variables = sorted({x.id for x in ast.walk(fn) if isinstance(x, ast.Name) and isinstance(x.ctx, ast.Store)} - args)
            signature = "J *" + self.name(fn.name) + "(" + ", ".join("J *" + self.name(x.arg) for x in fn.args.args) + ")" if c else ("export " if fn.name == "solve" else "") + "function " + self.name(fn.name) + "(" + ", ".join(self.name(x.arg) for x in fn.args.args) + ")"
            result.append(signature + " {")
            if variables:
                result.append("    " + ("J " + ", ".join("*" + self.name(x) + " = NULL" for x in variables) if c else "let " + ", ".join(self.name(x) for x in variables)) + ";")
            result.append(self.statements(fn.body))
            result.append("}\n")
        if c:
            result.append("J *solve(J *input) { return v_solve(input); }\n")
        return "\n".join(result)


def main():
    problems = {}
    for file in sorted((ROOT / "runtime/academy/portable/problems").glob("*.py")):
        source = file.read_text()
        tree = ast.parse(source, filename=str(file))
        try:
            problems[file.stem] = {"py": "from graaly_academy import *\n\n" + source, "js": Generator(tree, "js").generate(), "c": Generator(tree, "c").generate()}
        except Exception as error:
            raise RuntimeError(f"{file}: {error}") from error
    output = ROOT / "app/academy/generated-variants.ts"
    output.write_text("// Generated by scripts/generate-academy-variants.py. Edit runtime/academy/portable/problems/.\nexport const portableSolutions: Record<string, {py:string;js:string;c:string}> = " + json.dumps(problems, ensure_ascii=False, indent=2) + ";\n")
    print(f"Generated native Python, JavaScript and C sources for {len(problems)} exercises.")


if __name__ == "__main__":
    main()
