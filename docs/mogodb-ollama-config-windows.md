## if you USE WSL2 for devlopment or running this project you need to setup following things:

#### For Ollama:

1. Open Windows Environment Variables (Search "Environment Variables" in the Windows start menu).
2. Add a new User/System variable:

- Variable Name: `OLLAMA_HOST`

- Variable Value: `0.0.0.0`

- Quit Ollama from your Windows system tray (right-click the icon -> Quit) and relaunch it.

#### For MongoDB:

1. Open `C:\Program Files\MongoDB\Server\<version>\bin\mongod.cfg` in a text editor with Administrator privileges.

2. Find the net: section and change bindIp to `0.0.0.0`:

- you see somthing like following,

```
   net:
       port: 27017
       bindIp: 0.0.0.0
```

3. Open Windows `services.msc`, find MongoDB Server, right-click, and select `Restart`.

> [!WARNING] Note: If you use this path, you may need to open ports 27017 and 11434 in your Windows Defender Firewall for inbound traffic so WSL isn't blocked.

---

## How to Verify the Connections from WSL

Before writing or running your project code, verify that Ubuntu can actually talk to these Windows services using your terminal.

#### Test Ollama:

Run a simple curl request to the Ollama tags endpoint. Swap out 127.0.0.1 for your host IP:

```
curl http://127.0.0.1:11434/api/tags
```

- **Expected Outcome:** You should get a JSON response listing your downloaded models (e.g., {"models": [...]}), in other words, model list.

#### Test MongoDB:

Use netcat (nc) to check if the MongoDB port is open and reachable:

```
nc -zv 127.0.0.1 27017
```

- **Expected Outcome:** You should see a success message like:
  `Connection to 127.0.0.1 27017 port [tcp/*] succeeded!`
