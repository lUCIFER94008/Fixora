const { exec, spawn } = require("child_process");
const net = require("net");

const PORT = 3000;
const URL = `http://localhost:${PORT}`;

// Helper to find and kill process on port 3000
function killPortConflict(port, callback) {
  if (process.platform !== "win32") {
    exec(`lsof -t -i:${port}`, (err, stdout) => {
      if (!err && stdout.trim()) {
        const pid = stdout.trim().split("\n")[0];
        console.log(`Port ${port} is occupied by PID ${pid}. Terminating conflicting process...`);
        exec(`kill -9 ${pid}`, () => callback());
      } else {
        callback();
      }
    });
    return;
  }

  // Windows: netstat -ano | findstr :3000
  exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
    if (err || !stdout) {
      return callback(); // Port probably free
    }

    const lines = stdout.trim().split("\n");
    const listeningLine = lines.find(line => line.includes("LISTENING"));
    if (!listeningLine) {
      return callback();
    }

    const parts = listeningLine.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && pid !== "0" && !isNaN(pid)) {
      console.log(`Port ${port} is occupied by PID ${pid}. Terminating conflicting process...`);
      exec(`taskkill /F /PID ${pid}`, (killErr) => {
        if (killErr) {
          console.warn(`Failed to terminate PID ${pid}:`, killErr.message);
        } else {
          console.log(`Successfully terminated conflicting process on port ${port}.`);
        }
        // Wait 500ms for OS socket release
        setTimeout(callback, 500);
      });
    } else {
      callback();
    }
  });
}

// Function to check if a port is in use
function checkPort(port, callback) {
  const server = net.createServer();
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE") {
      callback(true);
    } else {
      callback(false);
    }
  });
  server.once("listening", () => {
    server.close();
    callback(false);
  });
  server.listen(port);
}

// Open URL in default browser
function openBrowser(url) {
  const startCmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  exec(`${startCmd} ${url}`, { shell: true }, (err) => {
    if (err) {
      console.error(`Failed to automatically open browser:`, err.message);
    } else {
      console.log(`Opening default browser at ${url}...`);
    }
  });
}

// Main logic
console.log("Validating environment and checking port availability...");
checkPort(PORT, (inUse) => {
  if (inUse) {
    console.log(`Port ${PORT} is occupied. Resolving conflict...`);
    killPortConflict(PORT, startDevServer);
  } else {
    startDevServer();
  }
});

function startDevServer() {
  console.log("Starting Next.js development server...");
  const nextDev = spawn("npx", ["next", "dev", "-H", "0.0.0.0"], {
    shell: true,
    stdio: ["inherit", "pipe", "pipe"]
  });

  let browserOpened = false;

  nextDev.stdout.on("data", (data) => {
    const output = data.toString();
    process.stdout.write(output);

    // Watch for Next.js ready message
    if ((output.includes("Ready") || output.includes("Local:") || output.includes("Local")) && !browserOpened) {
      browserOpened = true;
      setTimeout(() => openBrowser(URL), 500);
    }
  });

  nextDev.stderr.on("data", (data) => {
    process.stderr.write(data.toString());
  });

  nextDev.on("close", (code) => {
    process.exit(code);
  });
}
