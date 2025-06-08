# Example configuration for Claude Desktop

Add this configuration to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tray-mcp-server": {
      "command": "tray-mcp-server"
    }
  }
}
```

## Alternative configurations

### Using npx (if not installed globally)
```json
{
  "mcpServers": {
    "tray-mcp-server": {
      "command": "npx",
      "args": ["tray-mcp-server"]
    }
  }
}
```

### Using local build
```json
{
  "mcpServers": {
    "tray-mcp-server": {
      "command": "node",
      "args": ["./dist/index.js"],
      "cwd": "/path/to/tray-mcp-server"
    }
  }
}
```

## Environment Variables

You can also set environment variables for configuration:

```json
{
  "mcpServers": {
    "tray-mcp-server": {
      "command": "tray-mcp-server",
      "env": {
        "TRAY_DEFAULT_REGION": "us"
      }
    }
  }
}
```
