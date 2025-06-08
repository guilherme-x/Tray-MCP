# Copilot Instructions for Tray MCP Server

This is a Model Context Protocol (MCP) server that provides tools to interact with Tray.io's integration platform API.

## Project Overview

This TypeScript project implements an MCP server with 11 comprehensive tools covering:
- Connector management (list, get operations, call)
- Trigger management (list, create subscriptions, get subscriptions)
- Authentication management (get environments, create, delete)
- Workspace management (list workspaces)

## Key Technologies

- **TypeScript**: Primary language with ES2022 modules
- **MCP SDK**: `@modelcontextprotocol/sdk` for MCP server implementation
- **Zod**: Schema validation for tool inputs
- **Node.js**: Runtime environment (>=18.0.0)

## Architecture

- `src/index.ts`: Main server implementation with all tools
- Multi-region support (US, EU, APAC)
- Comprehensive error handling
- Input validation using Zod schemas

## Development Guidelines

1. **Error Handling**: Always wrap API calls in try-catch blocks
2. **Validation**: Use Zod schemas for all tool inputs
3. **Multi-region**: Support all three Tray regions (us, eu, apac)
4. **Documentation**: Include detailed parameter descriptions
5. **Types**: Use proper TypeScript interfaces for API responses

## API Patterns

- Base URLs: `api.tray.io`, `api.eu1.tray.io`, `api.ap1.tray.io`
- Authentication: Bearer token in Authorization header
- Content-Type: `application/json` for POST requests
- User-Agent: `tray-mcp-server/1.0.0`

## Tool Structure

Each tool follows this pattern:
```typescript
server.tool(
  "tool-name",
  "Description of what the tool does",
  {
    // Zod schema for parameters
  },
  async (params) => {
    // Implementation with error handling
    // Return formatted response
  }
);
```

## Testing

- Build with `npm run build`
- Test locally with `npm run dev`
- Use MCP inspector for debugging

## Common Issues

1. **Module errors**: Ensure `"type": "module"` in package.json
2. **Import paths**: Use `.js` extensions for compiled imports
3. **Token validation**: Different operations require different token types
4. **Region handling**: Default to "us" region when not specified
