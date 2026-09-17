import { spawn, execFileSync } from "node:child_process";

const PORT = 3000;

function freePort(port) {
  if (process.platform !== "win32") return;
  try {
    const out = execFileSync("netstat", ["-ano"], { encoding: "utf8" });
    const pids = new Set();
    for (const line of out.split("\n")) {
      if (!line.includes(`:${port}`) || !line.includes("LISTENING")) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (/^\d+$/.test(pid)) pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execFileSync("taskkill", ["/PID", pid, "/F"], { stdio: "ignore" });
      } catch {
        // already gone
      }
    }
  } catch {
    // nothing listening
  }
}

freePort(PORT);

// On Windows npx is a .cmd file; shell:false requires the exact executable name.
const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";

const child = spawn(npxCmd, ["next", "dev", "-p", String(PORT)], {
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code) => process.exit(code ?? 0));
