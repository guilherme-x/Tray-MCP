# Claude Desktop MCP Configuration Example

This file shows how to properly configure the Tray MCP Server in your Claude Desktop configuration.

## Configuration File Location

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

## ⚠️ Important: Use npx for Proper Installation

To avoid "ENOENT" errors, always use `npx` in your configuration:

```json
{
  "mcp": {
    "servers": {
      "tray-mcp-server": {
        "command": "npx",
        "args": ["tray-mcp-server"],
        "env": {
          "TRAY_TOKEN_US": "your-us-token-here"
        }
      }
    }
  }
}
```

## Multi-Region Configuration

If you work with multiple Tray regions:

```json
{
  "mcp": {
    "servers": {
      "tray-mcp-server": {
        "command": "npx",
        "args": ["tray-mcp-server"],
        "env": {
          "TRAY_TOKEN_US": "your-us-token-here",
          "TRAY_TOKEN_EU": "your-eu-token-here",
          "TRAY_TOKEN_APAC": "your-apac-token-here"
        }
      }
    }
  }
}
```

## Alternative: Global Installation

You can also install globally and run setup:

```bash
npm install -g tray-mcp-server
tray-mcp-server --setup
```

Then use in Claude Desktop config:

```json
{
  "mcp": {
    "servers": {
      "tray-mcp-server": {
        "command": "tray-mcp-server"
      }
    }
  }
}
```

## Getting Your Tokens

1. Log in to your Tray.io account
2. Go to Settings → API Keys
3. Create a new Master Token or User Token
4. Copy the token value into your configuration

## Troubleshooting

### "spawn tray-mcp-server ENOENT" Error

This error means the command wasn't found. Make sure to use:

```json
"command": "npx",
"args": ["tray-mcp-server"]
```

Instead of:

```json
"command": "tray-mcp-server"
```

### No Token Errors

Make sure you've set the appropriate environment variables in your MCP configuration's `"env"` section.

For more help, visit: https://github.com/guilherme-x/tray-mcp-server
