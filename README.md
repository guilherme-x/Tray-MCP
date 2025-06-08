# Tray MCP Server

A Model Context Protocol (MCP) server that provides tools to interact with [Tray.io's](https://tray.io) integration platform API. This server enables AI assistants to manage connectors, triggers, authentications, workspaces, and subscriptions through Tray's comprehensive API.

## Features

The Tray MCP Server provides comprehensive tools covering all major Tray API endpoints, including advanced workflow migration capabilities:

### 🔌 Connector Management
- **list-connectors**: Browse Tray's extensive connector library with pagination support
- **get-connector-operations**: Get detailed operation information for specific connectors with pagination
- **call-connector**: Execute connector operations with custom inputs

### ⚡ Trigger Management
- **list-triggers**: Discover available triggers for real-time integrations with pagination support
- **create-subscription**: Set up webhook subscriptions for trigger events
- **get-subscriptions**: View and manage existing subscriptions with pagination support

### 🔐 Authentication Management
- **get-service-environments**: Get service environments for authentication setup
- **create-authentication**: Create new service authentications
- **delete-authentication**: Remove unnecessary authentications

### 🏢 Workspace Management
- **list-workspaces**: Access and manage available workspaces with pagination support

### 🚀 **NEW: Workflow Migration Tools**
Complete workflow migration support for moving Tray workflows to custom applications:

- **list-projects**: List all projects in a workspace for migration analysis
- **list-project-versions**: View all versions of a project
- **export-project-version**: Export complete project with all workflow details and dependencies
- **get-project-import-requirements**: Analyze import requirements and dependencies
- **preview-project-import**: Preview import impact with workflow migration analysis
- **analyze-workflow-dependencies**: Deep analysis of workflow dependencies and nested calls

**Migration Features:**
- 📋 **Complete Workflow Context**: Extract full workflow definitions including steps, connections, and configurations
- 🔗 **Nested Workflow Detection**: Identify and map nested workflow calls and dependencies
- 🔑 **Authentication Mapping**: Track authentication requirements across workflows
- 🔌 **Connector Dependencies**: Map all connector and service dependencies
- ⚙️ **Configuration Analysis**: Export and analyze project configurations
- 📊 **Impact Assessment**: Preview changes and breaking impacts before migration
- 🛠️ **Migration Guidance**: Get actionable recommendations for successful migration

### 🔄 Pagination Support
All list operations support cursor-based pagination:
- **limit**: Control the number of results returned (default varies by endpoint)
- **cursor**: Use the cursor from previous responses to get the next page
- **Pagination info**: Responses include next cursor, hasMore flag, and total count when available

### 🌍 Multi-Region Support
All tools support Tray's multi-region infrastructure:
- **US** (default): `api.tray.io`
- **EU**: `api.eu1.tray.io`
- **APAC**: `api.ap1.tray.io`

## Installation

### As an NPM Package
```bash
npm install -g tray-mcp-server
```

### From Source
```bash
git clone https://github.com/yourusername/tray-mcp-server.git
cd tray-mcp-server
npm install
npm run build
```

## Configuration

The Tray MCP Server provides multiple convenient ways to configure your API tokens:

### 🚀 Interactive Setup (Recommended)

Run the interactive setup wizard to configure your tokens:

```bash
tray-mcp-server --setup
```

This will:
- Guide you through token configuration with validation
- Support all three Tray regions (US, EU, APAC)
- Automatically save your configuration
- Provide usage instructions

### 📁 Configuration File

Tokens are automatically saved to:
- **macOS/Linux**: `~/.config/tray-mcp-server/config.json`
- **Windows**: `%APPDATA%/tray-mcp-server/config.json`

Example configuration:
```json
{
  "masterToken": "your_master_token_here",
  "userToken": "your_user_token_here", 
  "region": "us",
  "workspaceId": "your_default_workspace_id"
}
```

### 🌐 Environment Variables

You can also use environment variables:

```bash
export TRAY_MASTER_TOKEN="your_master_token"
export TRAY_USER_TOKEN="your_user_token"
export TRAY_REGION="us"  # us, eu, or apac
export TRAY_WORKSPACE_ID="your_workspace_id"
```

### 🔄 Configuration Priority

The server loads configuration in this order:
1. Configuration file (`~/.config/tray-mcp-server/config.json`)
2. Environment variables (fallback)
3. If no tokens found, shows setup instructions

### Using with Claude Desktop

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

**⚠️ Important**: Use `npx` to avoid "spawn ENOENT" errors:

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

#### Multi-Region Configuration

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

#### Alternative: Global Installation

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

### Using with Other MCP Clients

The server can be started in stdio mode:
```bash
tray-mcp-server
```

## Authentication

To use the Tray MCP Server, you'll need a Tray API token. You can obtain tokens from your Tray.io account:

1. **Master Tokens**: For administrative operations and connector browsing
2. **User Tokens**: For end-user operations and authentication management

Visit the [Tray API documentation](https://tray.io/documentation/platform/connectors/api/) for more information on authentication.

## Usage Examples

### Browse Available Connectors
```
List all available connectors from Tray's library
```

### Set Up a Slack Integration
```
1. Get Slack connector operations for version 9.0
2. Get service environments for Slack
3. Create Slack authentication with your credentials
4. Call Slack operations using the authentication
```

### Create Real-time Webhooks
```
1. List available triggers
2. Create a subscription for webhook events
3. Monitor your subscriptions
```

## Tool Reference

### list-connectors
Lists all available connectors from Tray's connector library with pagination support.

**Parameters:**
- `token` (required): Tray API token
- `limit` (optional): Limit the number of results (default: 50)
- `cursor` (optional): Cursor for pagination
- `region` (optional): Tray region (us, eu, apac)

### get-connector-operations
Gets all available operations for a specific connector with pagination support.

**Parameters:**
- `token` (required): Tray API token
- `connectorName` (required): Name of the connector
- `connectorVersion` (required): Version of the connector
- `limit` (optional): Limit the number of results (default: 50)
- `cursor` (optional): Cursor for pagination
- `region` (optional): Tray region

### call-connector
Executes a connector operation with specified inputs.

**Parameters:**
- `token` (required): Tray API token (user token for end-user operations)
- `connectorName` (required): Name of the connector
- `connectorVersion` (required): Version of the connector
- `operation` (required): Name of the operation to execute
- `authId` (required): Authentication ID for the connector
- `input` (required): Input parameters for the operation
- `returnOutputSchema` (optional): Return output schema for dynamic operations
- `region` (optional): Tray region

### list-triggers
Lists all available triggers from Tray's trigger library with pagination support.

**Parameters:**
- `token` (required): Tray API token
- `limit` (optional): Limit the number of results (default: 50)
- `cursor` (optional): Cursor for pagination
- `region` (optional): Tray region

### get-service-environments
Gets service environments for authentication setup.

**Parameters:**
- `token` (required): Tray API token
- `serviceName` (required): Name of the service
- `serviceVersion` (required): Version of the service
- `region` (optional): Tray region

### create-authentication
Creates a new authentication for a service.

**Parameters:**
- `token` (required): Tray API token (user token for end-user auths)
- `name` (required): Name for the authentication
- `serviceEnvironmentId` (required): Service environment ID
- `userData` (optional): User data for the authentication
- `credentials` (required): Credentials for the authentication
- `scopes` (optional): Scopes for OAuth services
- `region` (optional): Tray region

### list-workspaces
Lists all workspaces the token has access to with pagination support.

**Parameters:**
- `token` (required): Tray API token with workspace access
- `limit` (optional): Limit the number of results (default: 50)
- `cursor` (optional): Cursor for pagination
- `region` (optional): Tray region

### create-subscription
Creates a subscription for real-time trigger events.

**Parameters:**
- `token` (required): Tray API token (user token for end-user subscriptions)
- `triggerName` (required): Name of the trigger
- `triggerVersion` (required): Version of the trigger
- `operation` (required): Trigger operation name
- `authenticationId` (required): Authentication ID for the trigger
- `endpoint` (required): Your webhook endpoint URL
- `name` (required): Name for the subscription
- `input` (required): Input parameters for the trigger operation
- `externalId` (optional): External ID for the subscription
- `region` (optional): Tray region

### get-subscriptions
Lists all subscriptions with pagination support.

**Parameters:**
- `token` (required): Tray API token
- `limit` (optional): Limit the number of results (default: 10)
- `cursor` (optional): Cursor for pagination
- `region` (optional): Tray region

### delete-authentication
Deletes an authentication by ID.

**Parameters:**
- `token` (required): Tray API token
- `authenticationId` (required): ID of the authentication to delete
- `region` (optional): Tray region

## Workflow Migration Tools

The Tray MCP Server now includes comprehensive workflow migration tools for extracting and analyzing complete workflow context. These tools are essential for migrating Tray workflows to custom Elixir, Python, or other applications.

### list-projects
Lists all projects in a workspace for workflow migration analysis.

**Parameters:**
- `token` (required): Tray API token with project access
- `workspaceId` (required): Workspace ID to list projects from
- `limit` (optional): Limit the number of results (default: 50)
- `cursor` (optional): Cursor for pagination
- `region` (optional): Tray region

### list-project-versions
Lists all versions of a project for workflow migration analysis.

**Parameters:**
- `token` (required): Tray API token with project access
- `projectId` (required): Project ID to list versions for
- `limit` (optional): Limit the number of results (default: 50)
- `cursor` (optional): Cursor for pagination
- `region` (optional): Tray region

### export-project-version
Exports a complete project version with all workflow details and dependencies for migration.

**Key Features:**
- Complete workflow definitions with steps and connections
- Nested workflow detection and mapping
- Full dependency analysis (connectors, services, authentications)
- Configuration export
- Migration-ready data structure

**Parameters:**
- `token` (required): Tray API token with project access
- `projectId` (required): Project ID to export
- `versionNumber` (required): Version number to export
- `region` (optional): Tray region

**Output Includes:**
- Detailed workflow analysis with step-by-step breakdown
- Connector and trigger usage mapping
- Authentication requirements
- Nested workflow dependencies
- Configuration data
- Complete JSON export for custom processing

### get-project-import-requirements
Analyzes import requirements and dependencies for migrating a project to a new environment.

**Parameters:**
- `token` (required): Tray API token with project access
- `projectId` (required): Destination project ID for import analysis
- `exportedProjectJson` (required): Exported project JSON data
- `region` (optional): Tray region

**Analysis Includes:**
- Authentication mapping requirements
- Configuration differences
- Missing dependencies
- Migration action items

### preview-project-import
Previews the impact of importing a project with comprehensive workflow migration analysis.

**Parameters:**
- `token` (required): Tray API token with project access
- `projectId` (required): Destination project ID for import preview
- `exportedProjectJson` (required): Exported project JSON data
- `authenticationResolution` (optional): Authentication mapping for import
- `connectorMapping` (optional): Connector mapping for import
- `serviceMapping` (optional): Service mapping for import
- `configOverride` (optional): Configuration overrides
- `region` (optional): Tray region

**Preview Analysis:**
- Workflow change impact (created, updated, removed)
- Breaking change detection
- Solution impact assessment
- Migration risk analysis

### analyze-workflow-dependencies
Performs deep analysis of workflow dependencies and nested workflow calls for migration planning.

**Parameters:**
- `token` (required): Tray API token with project access
- `projectExport` (required): Exported project JSON containing workflow data
- `region` (optional): Tray region

**Dependency Analysis:**
- Cross-workflow dependency mapping
- Connector usage patterns
- Authentication usage analysis
- Nested workflow call chains
- Migration priority recommendations
- Comprehensive migration checklist

## Migration Workflow Example

Here's a typical workflow migration process using these tools:

```bash
# 1. List available projects
tray-mcp-server list-projects --token=YOUR_TOKEN --workspaceId=WORKSPACE_ID

# 2. List project versions
tray-mcp-server list-project-versions --token=YOUR_TOKEN --projectId=PROJECT_ID

# 3. Export complete project for analysis
tray-mcp-server export-project-version --token=YOUR_TOKEN --projectId=PROJECT_ID --versionNumber=VERSION

# 4. Analyze workflow dependencies
tray-mcp-server analyze-workflow-dependencies --token=YOUR_TOKEN --projectExport=EXPORTED_DATA

# 5. Preview import impact (when migrating to new environment)
tray-mcp-server preview-project-import --token=YOUR_TOKEN --projectId=TARGET_PROJECT --exportedProjectJson=EXPORTED_DATA
```

## Error Handling

The server includes comprehensive error handling:
- HTTP error responses are properly caught and reported
- Invalid parameters are validated using Zod schemas
- Network failures are gracefully handled
- Detailed error messages help with troubleshooting

## Development

### Building
```bash
npm run build
```

### Running in Development
```bash
npm run dev
```

### Project Structure
```
src/
  index.ts          # Main MCP server implementation
dist/               # Compiled JavaScript output
package.json        # Package configuration
tsconfig.json       # TypeScript configuration
README.md          # This file
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Links

- [Tray.io](https://tray.io)
- [Tray API Documentation](https://tray.io/documentation/platform/connectors/api/)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)

## Support

For issues related to this MCP server, please open an issue on [GitHub](https://github.com/guilherme-x/tray-mcp-server/issues).
For Tray.io API questions, please refer to their [official documentation](https://tray.io/documentation/).
