# Minimal asyncio HTTP/1.1 server with JSON helpers and CORS (needed by the Flutter web build).
# Works on MicroPython (asyncio = uasyncio v3) and on CPython for host tests.
import asyncio
import json

MAX_BODY = 4096
_REASONS = {200: "OK", 204: "No Content", 400: "Bad Request", 404: "Not Found",
            405: "Method Not Allowed", 500: "Internal Server Error"}
_CORS = ("Access-Control-Allow-Origin: *\r\n"
         "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
         "Access-Control-Allow-Headers: Content-Type\r\n")


def parse_target(target):
    """'/a/b?x=1&y=2' -> ('/a/b', {'x': '1', 'y': '2'})"""
    path, _, qs = target.partition("?")
    query = {}
    for part in qs.split("&"):
        if part:
            k, _, v = part.partition("=")
            query[k] = v
    return path, query


class Server:
    def __init__(self):
        self._routes = {}          # (method, path) -> async handler(query, body) -> (status, obj|str)

    def route(self, method, path):
        def deco(fn):
            self._routes[(method, path)] = fn
            return fn
        return deco

    async def dispatch(self, method, target, body=b""):
        """Route a request. Returns (status, content_type, payload_bytes)."""
        path, query = parse_target(target)
        if method == "OPTIONS":
            return 204, "text/plain", b""
        handler = self._routes.get((method, path))
        if handler is None:
            allowed = any(p == path for (_, p) in self._routes)
            return (405 if allowed else 404), "application/json", \
                json.dumps({"ok": False, "error": "no route %s %s" % (method, path)}).encode()
        try:
            status, obj = await handler(query, body)
        except ValueError as e:
            status, obj = 400, {"ok": False, "error": str(e)}
        except Exception as e:  # keep the server alive whatever a handler does
            status, obj = 500, {"ok": False, "error": "%s: %s" % (type(e).__name__, e)}
        if isinstance(obj, str):
            return status, "text/html; charset=utf-8", obj.encode()
        return status, "application/json", json.dumps(obj).encode()

    async def _handle(self, reader, writer):
        try:
            line = await reader.readline()
            if not line:
                return
            method, target, _ = line.decode().split(" ", 2)
            length = 0
            while True:
                h = await reader.readline()
                if not h or h == b"\r\n":
                    break
                name, _, value = h.decode().partition(":")
                if name.strip().lower() == "content-length":
                    length = int(value.strip())
            body = await reader.readexactly(min(length, MAX_BODY)) if length else b""
            status, ctype, payload = await self.dispatch(method, target, body)
            head = "HTTP/1.1 %d %s\r\nContent-Type: %s\r\nContent-Length: %d\r\n%sConnection: close\r\n\r\n" % (
                status, _REASONS.get(status, ""), ctype, len(payload), _CORS)
            writer.write(head.encode())
            writer.write(payload)
            await writer.drain()
        except Exception as e:
            print("httpd error:", e)
        finally:
            try:
                writer.close()
                await writer.wait_closed()
            except Exception:
                pass

    async def serve(self, host="0.0.0.0", port=80):
        return await asyncio.start_server(self._handle, host, port)
