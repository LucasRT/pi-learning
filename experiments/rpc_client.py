#!/usr/bin/env python3
"""
Week 1 exercise: drive Pi from Python via its RPC mode.

RPC mode talks JSONL (one JSON object per line) over stdin/stdout instead
of drawing a terminal UI. You write to Pi's stdin, it streams events back
on stdout as things happen (text as the model generates it, tool calls as
it makes them, etc). This script sends one prompt, prints the model's
text as it streams in, and — importantly — prints a line every time a
real tool call fires, so you can see directly whether the model is
actually invoking tools or just talking about them (the qwen2.5-coder
problem from Week 0).

Usage:
    python3 rpc_client.py "read README.md and summarize it"
"""

import json
import subprocess
import sys


def run_prompt(message: str, provider: str = "ollama", model: str = "llama3.1:8b") -> None:
    proc = subprocess.Popen(
        ["pi", "--mode", "rpc", "--no-session", "--provider", provider, "--model", model],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,  # line-buffered
    )

    assert proc.stdin is not None and proc.stdout is not None

    request = {"type": "prompt", "message": message}
    proc.stdin.write(json.dumps(request) + "\n")
    proc.stdin.flush()

    print(f"--- sent prompt: {message!r}\n")

    for line in proc.stdout:
        line = line.strip()
        if not line:
            continue

        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            # Not every line from a CLI is guaranteed JSON; skip noise.
            continue

        event_type = event.get("type")

        if event_type == "message_update":
            delta = event.get("assistantMessageEvent", {})
            if delta.get("type") == "text_delta":
                print(delta.get("delta", ""), end="", flush=True)

        elif event_type == "tool_execution_start":
            print(f"\n[TOOL CALL] {event.get('toolName')} (id={event.get('toolCallId')})")

        elif event_type == "tool_execution_end":
            result = event.get("result", {})
            print(f"[TOOL RESULT] {json.dumps(result)[:200]}")

        elif event_type == "agent_settled":
            print("\n\n--- agent settled, done.")
            break

    proc.terminate()


if __name__ == "__main__":
    prompt = " ".join(sys.argv[1:]) or "read README.md and summarize it in two sentences"
    run_prompt(prompt)
