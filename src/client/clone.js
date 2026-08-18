import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

export async function pullProject(projectName, options = {}) {
  const host = options.host || "127.0.0.1";
  const port = options.port || 8000;
  const targetDir = options.dest || path.join(os.homedir(), "bdb-dev-local");
  const destProjectDir = path.join(targetDir, projectName);

  console.log(`\n📦 BDB Remote Pull: Fetching '${projectName}' from http://${host}:${port}...`);
  console.log(`📂 Destination: ${destProjectDir}\n`);

  await fs.promises.mkdir(targetDir, { recursive: true });

  const url = `http://${host}:${port}/download/${encodeURIComponent(projectName)}`;

  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      if (res.statusCode === 404) {
        console.error(`❌ Project '${projectName}' was not found on the remote workstation.`);
        reject(new Error("Project not found"));
        return;
      }

      if (res.statusCode !== 200) {
        console.error(`❌ Server returned error status: ${res.statusCode}`);
        reject(new Error(`HTTP error ${res.statusCode}`));
        return;
      }

      console.log(`⬇️ Downloading archive stream & extracting via native tar...`);

      // Extract directly from pipe
      const tarProc = spawn("tar", ["-xzf", "-", "-C", targetDir], {
        stdio: ["pipe", "inherit", "inherit"]
      });

      res.pipe(tarProc.stdin);

      tarProc.on("close", (code) => {
        if (code === 0) {
          console.log(`\n✅ Project successfully cloned to: ${destProjectDir}`);
          console.log(`💡 Next steps: run 'npm install' or run your tests locally on the laptop.\n`);
          resolve(destProjectDir);
        } else {
          console.error(`❌ Extraction failed with exit code ${code}`);
          reject(new Error(`tar exited with ${code}`));
        }
      });

      tarProc.on("error", (err) => {
        console.error(`❌ Failed to spawn tar: ${err.message}`);
        reject(err);
      });
    }).on("error", (err) => {
      console.error(`❌ Connection failed to workstation: ${err.message}`);
      console.error(`💡 Ensure Tailscale is running and the workstation server is active.`);
      reject(err);
    });
  });
}
