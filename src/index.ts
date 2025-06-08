#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';
import { setupTrayMCP } from './setup.js';

// Constants for Tray API
const TRAY_API_BASE = "https://api.tray.io";
const TRAY_EU_API_BASE = "https://api.eu1.tray.io";
const TRAY_APAC_API_BASE = "https://api.ap1.tray.io";
const USER_AGENT = "tray-mcp-server/1.0.0";

// Configuration interface
interface TrayConfig {
  masterToken?: string;
  userToken?: string;
  region?: 'us' | 'eu' | 'apac';
  workspaceId?: string;
}

// Function to load configuration from file
async function loadConfiguration(): Promise<TrayConfig> {
  try {
    const homeDir = homedir();
    const configPath = join(homeDir, '.config', 'tray-mcp-server', 'config.json');
    
    if (existsSync(configPath)) {
      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      return config;
    }
  } catch (error) {
    // Config doesn't exist or is invalid, fall back to environment variables
  }
  
  // Fall back to environment variables
  return {
    masterToken: process.env.TRAY_MASTER_TOKEN,
    userToken: process.env.TRAY_USER_TOKEN,
    region: (process.env.TRAY_REGION as 'us' | 'eu' | 'apac') || 'us',
    workspaceId: process.env.TRAY_WORKSPACE_ID
  };
}

// Check for command line arguments
async function handleCommandLineArgs(): Promise<boolean> {
  const args = process.argv.slice(2);
  
  if (args.includes('--setup')) {
    await setupTrayMCP();
    return true; // Exit after setup
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Tray MCP Server - Model Context Protocol server for Tray.io

Usage:
  tray-mcp-server [options]

Options:
  --setup       Run interactive token setup
  --help, -h    Show this help message

Configuration:
  Tokens can be configured via:
  1. Interactive setup: tray-mcp-server --setup
  2. Environment variables: TRAY_MASTER_TOKEN, TRAY_USER_TOKEN, TRAY_REGION, TRAY_WORKSPACE_ID
  3. Configuration file: ~/.config/tray-mcp-server/config.json

For more information, visit: https://github.com/yourusername/tray-mcp-server
`);
    return true; // Exit after help
  }
  
  return false; // Continue with normal execution
}

// Create server instance
const server = new McpServer({
  name: "tray-mcp-server",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Interface definitions for Tray API responses
interface TrayApiResponse<T = any> {
  elements?: T[];
  cursor?: string;
  hasMore?: boolean;
  totalCount?: number;
  [key: string]: any;
}

interface TrayConnector {
  title: string;
  description: string;
  name: string;
  version: string;
  service: {
    id: string;
    name: string;
    version: number;
  };
}

interface TrayConnectorOperation {
  name: string;
  title: string;
  description: string;
  inputSchema: any;
  outputSchema: any;
  hasDynamicOutput: boolean;
  authScopes?: string[];
}

interface TrayTrigger {
  name: string;
  title: string;
  description: string;
  version: string;
  service: {
    id: string;
    name: string;
    version: number;
  };
}

interface TrayAuthentication {
  id: string;
  name: string;
  serviceEnvironmentId: string;
  scopes: string[];
}

interface TrayWorkspace {
  id: string;
  name: string;
  type: string;
  description?: string;
  monthlyTaskLimit?: number;
}

// Workflow Migration interfaces
interface TrayProject {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

interface TrayProjectVersion {
  id: string;
  projectId: string;
  versionNumber: string;
  name: string;
  description?: string;
  createdAt: string;
  status: string;
}

interface TrayWorkflowSummary {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  tags?: string[];
}

interface TrayWorkflowStep {
  id: string;
  name: string;
  connector?: {
    name: string;
    version: string;
    operation: string;
    title: string;
  };
  trigger?: {
    name: string;
    version: string;
    operation: string;
    title: string;
  };
  authentication?: {
    id: string;
    name: string;
  };
  input?: any;
  position: {
    x: number;
    y: number;
  };
}

interface TrayWorkflowConnection {
  source: {
    stepId: string;
    outputPort?: string;
  };
  target: {
    stepId: string;
    inputPort?: string;
  };
}

interface TrayWorkflowDetail {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  tags?: string[];
  steps: TrayWorkflowStep[];
  connections: TrayWorkflowConnection[];
  config?: any;
  triggers: TrayWorkflowStep[];
  nestedWorkflows?: {
    workflowId: string;
    workflowName: string;
    stepId: string;
  }[];
}

interface TrayProjectExport {
  project: TrayProject;
  workflows: TrayWorkflowDetail[];
  config: any;
  authentications: TrayAuthentication[];
  services: any[];
  connectors: any[];
  dependencies: {
    workflows: string[];
    connectors: string[];
    services: string[];
    authentications: string[];
  };
}

// Helper function for making Tray API requests
async function makeTrayRequest<T>(
  url: string,
  token: string,
  options: {
    method?: string;
    body?: any;
    region?: "us" | "eu" | "apac";
  } = {}
): Promise<T | null> {
  const { method = "GET", body, region = "us" } = options;
  
  let baseUrl = TRAY_API_BASE;
  if (region === "eu") baseUrl = TRAY_EU_API_BASE;
  if (region === "apac") baseUrl = TRAY_APAC_API_BASE;

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${token}`,
    "User-Agent": USER_AGENT,
    "Accept": "application/json",
  };

  if (body && method !== "GET") {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(`${baseUrl}${url}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, message: ${await response.text()}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error("Error making Tray request:", error);
    return null;
  }
}

// Tool: List Connectors
server.tool(
  "list-connectors",
  "List all available connectors from Tray's connector library",
  {
    token: z.string().describe("Tray API token (master token or user token)"),
    limit: z.number().optional().describe("Limit the number of results (default: 50)"),
    cursor: z.string().optional().describe("Cursor for pagination"),
    region: z.enum(["us", "eu", "apac"]).optional().describe("Tray region (default: us)"),
  },
  async ({ token, limit = 50, cursor, region = "us" }) => {
    let url = `/core/v1/connectors?limit=${limit}`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }

    const data = await makeTrayRequest<TrayApiResponse<TrayConnector>>(
      url,
      token,
      { region }
    );

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve connectors from Tray API",
          },
        ],
      };
    }

    const connectors = data.elements || [];
    if (connectors.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No connectors found",
          },
        ],
      };
    }

    const connectorsText = connectors
      .map(
        (connector) =>
          `**${connector.title}** (${connector.name} v${connector.version})\n` +
          `Description: ${connector.description}\n` +
          `Service ID: ${connector.service.id}\n` +
          `Service: ${connector.service.name} v${connector.service.version}\n`
      )
      .join("\n---\n");

    // Add pagination info
    let paginationInfo = "";
    if (data.cursor) {
      paginationInfo += `\n\n**Pagination:**\n`;
      paginationInfo += `Next cursor: ${data.cursor}\n`;
      if (data.hasMore !== undefined) {
        paginationInfo += `Has more: ${data.hasMore}\n`;
      }
      if (data.totalCount !== undefined) {
        paginationInfo += `Total count: ${data.totalCount}\n`;
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Found ${connectors.length} connectors:\n\n${connectorsText}${paginationInfo}`,
        },
      ],
    };
  }
);

// Tool: Get Connector Operations
server.tool(
  "get-connector-operations",
  "Get all available operations for a specific connector",
  {
    token: z.string().describe("Tray API token (master token or user token)"),
    connectorName: z.string().describe("Name of the connector (e.g., 'slack', 'salesforce')"),
    connectorVersion: z.string().describe("Version of the connector (e.g., '9.0')"),
    limit: z.number().optional().describe("Limit the number of results (default: 50)"),
    cursor: z.string().optional().describe("Cursor for pagination"),
    region: z.enum(["us", "eu", "apac"]).optional().describe("Tray region (default: us)"),
  },
  async ({ token, connectorName, connectorVersion, limit = 50, cursor, region = "us" }) => {
    let url = `/core/v1/connectors/${connectorName}/versions/${connectorVersion}/operations?limit=${limit}`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }

    const data = await makeTrayRequest<TrayApiResponse<TrayConnectorOperation>>(
      url,
      token,
      { region }
    );

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve operations for connector ${connectorName} v${connectorVersion}`,
          },
        ],
      };
    }

    const operations = data.elements || [];
    if (operations.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No operations found for connector ${connectorName} v${connectorVersion}`,
          },
        ],
      };
    }

    const operationsText = operations
      .map(
        (op) =>
          `**${op.title}** (${op.name})\n` +
          `Description: ${op.description}\n` +
          `Dynamic Output: ${op.hasDynamicOutput}\n` +
          `Auth Scopes: ${op.authScopes ? op.authScopes.join(", ") : "None"}\n` +
          `Input Schema: ${JSON.stringify(op.inputSchema, null, 2)}`
      )
      .join("\n---\n");

    // Add pagination info
    let paginationInfo = "";
    if (data.cursor) {
      paginationInfo += `\n\n**Pagination:**\n`;
      paginationInfo += `Next cursor: ${data.cursor}\n`;
      if (data.hasMore !== undefined) {
        paginationInfo += `Has more: ${data.hasMore}\n`;
      }
      if (data.totalCount !== undefined) {
        paginationInfo += `Total count: ${data.totalCount}\n`;
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Found ${operations.length} operations for ${connectorName} v${connectorVersion}:\n\n${operationsText}${paginationInfo}`,
        },
      ],
    };
  }
);

// Tool: Call Connector
server.tool(
  "call-connector",
  "Execute a connector operation with specified inputs",
  {
    token: z.string().describe("Tray API token (user token required for end-user operations)"),
    connectorName: z.string().describe("Name of the connector"),
    connectorVersion: z.string().describe("Version of the connector"),
    operation: z.string().describe("Name of the operation to execute"),
    authId: z.string().describe("Authentication ID for the connector"),
    input: z.record(z.any()).describe("Input parameters for the operation"),
    returnOutputSchema: z.boolean().optional().describe("Return output schema for dynamic operations"),
    region: z.enum(["us", "eu", "apac"]).optional().describe("Tray region (default: us)"),
  },
  async ({ token, connectorName, connectorVersion, operation, authId, input, returnOutputSchema, region = "us" }) => {
    const payload = {
      operation,
      authId,
      input,
      ...(returnOutputSchema && { returnOutputSchema }),
    };

    const data = await makeTrayRequest(
      `/core/v1/connectors/${connectorName}/versions/${connectorVersion}/call`,
      token,
      { method: "POST", body: payload, region }
    );

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to execute operation ${operation} on connector ${connectorName} v${connectorVersion}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Operation ${operation} executed successfully:\n\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    };
  }
);

// Tool: List Triggers
server.tool(
  "list-triggers",
  "List all available triggers from Tray's trigger library",
  {
    token: z.string().describe("Tray API token (master token or user token)"),
    limit: z.number().optional().describe("Limit the number of results (default: 50)"),
    cursor: z.string().optional().describe("Cursor for pagination"),
    region: z.enum(["us", "eu", "apac"]).optional().describe("Tray region (default: us)"),
  },
  async ({ token, limit = 50, cursor, region = "us" }) => {
    let url = `/core/v1/triggers?limit=${limit}`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }

    const data = await makeTrayRequest<TrayApiResponse<TrayTrigger>>(
      url,
      token,
      { region }
    );

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve triggers from Tray API",
          },
        ],
      };
    }

    const triggers = data.elements || [];
    if (triggers.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No triggers found",
          },
        ],
      };
    }

    const triggersText = triggers
      .map(
        (trigger) =>
          `**${trigger.title}** (${trigger.name} v${trigger.version})\n` +
          `Description: ${trigger.description}\n` +
          `Service ID: ${trigger.service.id}\n` +
          `Service: ${trigger.service.name} v${trigger.service.version}\n`
      )
      .join("\n---\n");

    // Add pagination info
    let paginationInfo = "";
    if (data.cursor) {
      paginationInfo += `\n\n**Pagination:**\n`;
      paginationInfo += `Next cursor: ${data.cursor}\n`;
      if (data.hasMore !== undefined) {
        paginationInfo += `Has more: ${data.hasMore}\n`;
      }
      if (data.totalCount !== undefined) {
        paginationInfo += `Total count: ${data.totalCount}\n`;
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Found ${triggers.length} triggers:\n\n${triggersText}${paginationInfo}`,
        },
      ],
    };
  }
);

// Tool: Get Service Environments
server.tool(
  "get-service-environments",
  "Get service environments for authentication setup",
  {
    token: z.string().describe("Tray API token"),
    serviceName: z.string().describe("Name of the service"),
    serviceVersion: z.string().describe("Version of the service"),
    region: z.enum(["us", "eu", "apac"]).optional().describe("Tray region (default: us)"),
  },
  async ({ token, serviceName, serviceVersion, region = "us" }) => {
    const data = await makeTrayRequest(
      `/core/v1/services/${serviceName}/versions/${serviceVersion}/environments`,
      token,
      { region }
    );

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve service environments for ${serviceName} v${serviceVersion}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Service environments for ${serviceName} v${serviceVersion}:\n\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    };
  }
);

// Tool: Create Authentication
server.tool(
  "create-authentication",
  "Create a new authentication for a service",
  {
    token: z.string().describe("Tray API token (user token for end-user auths)"),
    name: z.string().describe("Name for the authentication"),
    serviceEnvironmentId: z.string().describe("Service environment ID"),
    userData: z.record(z.any()).optional().describe("User data for the authentication"),
    credentials: z.record(z.any()).describe("Credentials for the authentication"),
    scopes: z.array(z.string()).optional().describe("Scopes for OAuth services"),
    region: z.enum(["us", "eu", "apac"]).optional().describe("Tray region (default: us)"),
  },
  async ({ token, name, serviceEnvironmentId, userData, credentials, scopes, region = "us" }) => {
    const payload = {
      name,
      serviceEnvironmentId,
      ...(userData && { userData }),
      credentials,
      ...(scopes && { scopes }),
    };

    const data = await makeTrayRequest(
      "/core/v1/authentications",
      token,
      { method: "POST", body: payload, region }
    );

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to create authentication",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Authentication created successfully:\n\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    };
  }
);

// Tool: List Workspaces
server.tool(
  "list-workspaces",
  "List all workspaces the token has access to",
  {
    token: z.string().describe("Tray API token with workspace access"),
    limit: z.number().optional().describe("Limit the number of results (default: 50)"),
    cursor: z.string().optional().describe("Cursor for pagination"),
    region: z.enum(["us", "eu", "apac"]).optional().describe("Tray region (default: us)"),
  },
  async ({ token, limit = 50, cursor, region = "us" }) => {
    let url = `/core/v1/workspaces?limit=${limit}`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }

    const data = await makeTrayRequest<TrayApiResponse<TrayWorkspace>>(
      url,
      token,
      { region }
    );

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve workspaces from Tray API",
          },
        ],
      };
    }

    const workspaces = data.elements || [];
    if (workspaces.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No workspaces found",
          },
        ],
      };
    }

    const workspacesText = workspaces
      .map(
        (workspace) =>
          `**${workspace.name}** (${workspace.id})\n` +
          `Type: ${workspace.type}\n` +
          `${workspace.description ? `Description: ${workspace.description}\n` : ""}` +
          `${workspace.monthlyTaskLimit ? `Monthly Task Limit: ${workspace.monthlyTaskLimit}\n` : ""}`
      )
      .join("\n---\n");

    // Add pagination info
    let paginationInfo = "";
    if (data.cursor) {
      paginationInfo += `\n\n**Pagination:**\n`;
      paginationInfo += `Next cursor: ${data.cursor}\n`;
      if (data.hasMore !== undefined) {
        paginationInfo += `Has more: ${data.hasMore}\n`;
      }
      if (data.totalCount !== undefined) {
        paginationInfo += `Total count: ${data.totalCount}\n`;
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Found ${workspaces.length} workspaces:\n\n${workspacesText}${paginationInfo}`,
        },
      ],
    };
  }
);

// Tool: Create Subscription (for triggers)
server.tool(
  "create-subscription",
  "Create a subscription for real-time trigger events",
  {
    token: z.string().describe("Tray API token (user token for end-user subscriptions)"),
    triggerName: z.string().describe("Name of the trigger"),
    triggerVersion: z.string().describe("Version of the trigger"),
    operation: z.string().describe("Trigger operation name"),
    authenticationId: z.string().describe("Authentication ID for the trigger"),
    endpoint: z.string().describe("Your webhook endpoint URL"),
    name: z.string().describe("Name for the subscription"),
    input: z.record(z.any()).describe("Input parameters for the trigger operation"),
    externalId: z.string().optional().describe("External ID for the subscription"),
    region: z.enum(["us", "eu", "apac"]).optional().describe("Tray region (default: us)"),
  },
  async ({ token, triggerName, triggerVersion, operation, authenticationId, endpoint, name, input, externalId, region = "us" }) => {
    const payload = {
      trigger: {
        name: triggerName,
        version: triggerVersion,
      },
      operation,
      authenticationId,
      endpoint,
      name,
      input,
      ...(externalId && { externalId }),
    };

    const data = await makeTrayRequest(
      "/core/v1/subscriptions",
      token,
      { method: "POST", body: payload, region }
    );

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to create subscription",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Subscription created successfully:\n\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    };
  }
);

// Tool: Get Subscriptions
server.tool(
  "get-subscriptions",
  "List all subscriptions",
  {
    token: z.string().describe("Tray API token"),
    limit: z.number().optional().describe("Limit the number of results (default: 10)"),
    cursor: z.string().optional().describe("Cursor for pagination"),
    region: z.enum(["us", "eu", "apac"]).optional().describe("Tray region (default: us)"),
  },
  async ({ token, limit = 10, cursor, region = "us" }) => {
    let url = `/core/v1/subscriptions?limit=${limit}`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }

    const data = await makeTrayRequest<TrayApiResponse>(url, token, { region });

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve subscriptions",
          },
        ],
      };
    }

    // Add pagination info if available
    let paginationInfo = "";
    if (data.cursor) {
      paginationInfo += `\n\n**Pagination:**\n`;
      paginationInfo += `Next cursor: ${data.cursor}\n`;
      if (data.hasMore !== undefined) {
        paginationInfo += `Has more: ${data.hasMore}\n`;
      }
      if (data.totalCount !== undefined) {
        paginationInfo += `Total count: ${data.totalCount}\n`;
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Subscriptions:\n\n${JSON.stringify(data, null, 2)}${paginationInfo}`,
        },
      ],
    };
  }
);

// Tool: Update Subscription
server.tool(
  "update-subscription",
  "Update an existing subscription",
  {
    token: z.string().describe("Tray API token"),
    subscriptionId: z.string().describe("ID of the subscription to update"),
    name: z.string().optional().describe("New name for the subscription"),
    endpoint: z.string().optional().describe("New webhook endpoint URL"),
    input: z.record(z.any()).optional().describe("New input parameters for the trigger operation"),
    region: z.enum(["us", "eu", "apac"]).optional().describe("Tray region (default: us)"),
  },
  async ({ token, subscriptionId, name, endpoint, input, region = "us" }) => {
    const payload: Record<string, any> = {};
    if (name) payload.name = name;
    if (endpoint) payload.endpoint = endpoint;
    if (input) payload.input = input;

    if (Object.keys(payload).length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No update parameters provided. Please specify at least one of: name, endpoint, or input.",
          },
        ],
      };
    }

    const data = await makeTrayRequest(
      `/core/v1/subscriptions/${subscriptionId}`,
      token,
      { method: "PATCH", body: payload, region }
    );

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to update subscription ${subscriptionId}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Subscription ${subscriptionId} updated successfully:\n\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    };
  }
);

// Tool: Delete Subscription
server.tool(
  "delete-subscription",
  "Delete a subscription by ID",
  {
    token: z.string().describe("Tray API token"),
    subscriptionId: z.string().describe("ID of the subscription to delete"),
    region: z.enum(["us", "eu", "apac"]).optional().describe("Tray region (default: us)"),
  },
  async ({ token, subscriptionId, region = "us" }) => {
    const response = await makeTrayRequest(
      `/core/v1/subscriptions/${subscriptionId}`,
      token,
      { method: "DELETE", region }
    );

    return {
      content: [
        {
          type: "text",
          text: response === null 
            ? "Failed to delete subscription"
            : `Subscription ${subscriptionId} deleted successfully`,
        },
      ],
    };
  }
);

// Tool: Delete Authentication
server.tool(
  "delete-authentication",
  "Delete an authentication by ID",
  {
    token: z.string().describe("Tray API token"),
    authenticationId: z.string().describe("Authentication ID to delete"),
    region: z.enum(["us", "eu", "apac"]).optional().describe("Tray region (default: us)"),
  },
  async ({ token, authenticationId, region = "us" }) => {
    const response = await makeTrayRequest(
      `/core/v1/authentications/${authenticationId}`,
      token,
      { method: "DELETE", region }
    );

    return {
      content: [
        {
          type: "text",
          text: response === null 
            ? "Failed to delete authentication"
            : `Authentication ${authenticationId} deleted successfully`,
        },
      ],
    };
  }
);

// Tool: List Authentications
server.tool(
  "list-authentications",
  "List all authentications the token has access to",
  {
    token: z.string().describe("Tray API token"),
    limit: z.number().optional().describe("Limit the number of results (default: 50)"),
    cursor: z.string().optional().describe("Cursor for pagination"),
    region: z.enum(["us", "eu", "apac"]).optional().describe("Tray region (default: us)"),
  },
  async ({ token, limit = 50, cursor, region = "us" }) => {
    let url = `/core/v1/authentications?limit=${limit}`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }

    const data = await makeTrayRequest<TrayApiResponse<TrayAuthentication>>(
      url,
      token,
      { region }
    );

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve authentications from Tray API",
          },
        ],
      };
    }

    const authentications = data.elements || [];
    if (authentications.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No authentications found",
          },
        ],
      };
    }

    const authsText = authentications
      .map(
        (auth) =>
          `**${auth.name}** (${auth.id})\n` +
          `Service Environment ID: ${auth.serviceEnvironmentId}\n` +
          `Scopes: ${auth.scopes ? auth.scopes.join(", ") : "None"}\n`
      )
      .join("\n---\n");

    // Add pagination info
    let paginationInfo = "";
    if (data.cursor) {
      paginationInfo += `\n\n**Pagination:**\n`;
      paginationInfo += `Next cursor: ${data.cursor}\n`;
      if (data.hasMore !== undefined) {
        paginationInfo += `Has more: ${data.hasMore}\n`;
      }
      if (data.totalCount !== undefined) {
        paginationInfo += `Total count: ${data.totalCount}\n`;
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Found ${authentications.length} authentications:\n\n${authsText}${paginationInfo}`,
        },
      ],
    };
  }
);

// Tool: Get Trigger Operations
server.tool(
  "get-trigger-operations",
  "Get all available operations for a specific trigger",
  {
    token: z.string().describe("Tray API token"),
    triggerName: z.string().describe("Name of the trigger"),
    triggerVersion: z.string().describe("Version of the trigger"),
    limit: z.number().optional().describe("Limit the number of results (default: 50)"),
    cursor: z.string().optional().describe("Cursor for pagination"),
    region: z.enum(["us", "eu", "apac"]).optional().describe("Tray region (default: us)"),
  },
  async ({ token, triggerName, triggerVersion, limit = 50, cursor, region = "us" }) => {
    let url = `/core/v1/triggers/${triggerName}/versions/${triggerVersion}/operations?limit=${limit}`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }

    const data = await makeTrayRequest<TrayApiResponse<TrayConnectorOperation>>(
      url,
      token,
      { region }
    );

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve operations for trigger ${triggerName} v${triggerVersion}`,
          },
        ],
      };
    }

    const operations = data.elements || [];
    if (operations.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No operations found for trigger ${triggerName} v${triggerVersion}`,
          },
        ],
      };
    }

    const operationsText = operations
      .map(
        (op) =>
          `**${op.title}** (${op.name})\n` +
          `Description: ${op.description}\n` +
          `Dynamic Output: ${op.hasDynamicOutput}\n` +
          `Auth Scopes: ${op.authScopes ? op.authScopes.join(", ") : "None"}\n` +
          `Input Schema: ${JSON.stringify(op.inputSchema, null, 2)}`
      )
      .join("\n---\n");

    // Add pagination info
    let paginationInfo = "";
    if (data.cursor) {
      paginationInfo += `\n\n**Pagination:**\n`;
      paginationInfo += `Next cursor: ${data.cursor}\n`;
      if (data.hasMore !== undefined) {
        paginationInfo += `Has more: ${data.hasMore}\n`;
      }
      if (data.totalCount !== undefined) {
        paginationInfo += `Total count: ${data.totalCount}\n`;
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Found ${operations.length} operations for ${triggerName} v${triggerVersion}:\n\n${operationsText}${paginationInfo}`,
        },
      ],
    };
  }
);

// ================== WORKFLOW MIGRATION TOOLS ==================

// Tool: List Projects
server.tool(
  "list-projects",
  "List all projects in a workspace for workflow migration analysis",
  {
    token: z.string().describe("Tray API token with project access"),
    workspaceId: z.string().describe("Workspace ID to list projects from"),
    limit: z.number().optional().describe("Limit the number of results (default: 50)"),
    cursor: z.string().optional().describe("Cursor for pagination"),
    region: z.enum(["us", "eu", "apac"]).optional().describe("Tray region (default: us)"),
  },
  async ({ token, workspaceId, limit = 50, cursor, region = "us" }) => {
    let url = `/core/v1/projects?workspaceId=${workspaceId}&limit=${limit}`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }

    const data = await makeTrayRequest<TrayApiResponse<TrayProject>>(
      url,
      token,
      { region }
    );

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve projects for workspace ${workspaceId}`,
          },
        ],
      };
    }

    const projects = data.elements || [];
    if (projects.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No projects found in workspace ${workspaceId}`,
          },
        ],
      };
    }

    const projectsText = projects
      .map(
        (project) =>
          `**${project.name}** (${project.id})\n` +
          `Description: ${project.description || "N/A"}\n` +
          `Created: ${new Date(project.createdAt).toLocaleDateString()}\n` +
          `Updated: ${new Date(project.updatedAt).toLocaleDateString()}\n`
      )
      .join("\n---\n");

    // Add pagination info
    let paginationInfo = "";
    if (data.cursor) {
      paginationInfo += `\n\n**Pagination:**\n`;
      paginationInfo += `Next cursor: ${data.cursor}\n`;
      if (data.hasMore !== undefined) {
        paginationInfo += `Has more: ${data.hasMore}\n`;
      }
      if (data.totalCount !== undefined) {
        paginationInfo += `Total count: ${data.totalCount}\n`;
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Found ${projects.length} projects in workspace ${workspaceId}:\n\n${projectsText}${paginationInfo}`,
        },
      ],
    };
  }
);

// Tool: List Project Versions
server.tool(
  "list-project-versions",
  "List all versions of a project for workflow migration analysis",
  {
    token: z.string().describe("Tray API token with project access"),
    projectId: z.string().describe("Project ID to list versions for"),
    limit: z.number().optional().describe("Limit the number of results (default: 50)"),
    cursor: z.string().optional().describe("Cursor for pagination"),
    region: z.enum(["us", "eu", "apac"]).optional().describe("Tray region (default: us)"),
  },
  async ({ token, projectId, limit = 50, cursor, region = "us" }) => {
    let url = `/core/v1/projects/${projectId}/versions?limit=${limit}`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }

    const data = await makeTrayRequest<TrayApiResponse<TrayProjectVersion>>(
      url,
      token,
      { region }
    );

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve versions for project ${projectId}`,
          },
        ],
      };
    }

    const versions = data.elements || [];
    if (versions.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No versions found for project ${projectId}`,
          },
        ],
      };
    }

    const versionsText = versions
      .map(
        (version) =>
          `**Version ${version.versionNumber}** (${version.id})\n` +
          `Name: ${version.name}\n` +
          `Description: ${version.description || "N/A"}\n` +
          `Status: ${version.status}\n` +
          `Created: ${new Date(version.createdAt).toLocaleDateString()}\n`
      )
      .join("\n---\n");

    // Add pagination info
    let paginationInfo = "";
    if (data.cursor) {
      paginationInfo += `\n\n**Pagination:**\n`;
      paginationInfo += `Next cursor: ${data.cursor}\n`;
      if (data.hasMore !== undefined) {
        paginationInfo += `Has more: ${data.hasMore}\n`;
      }
      if (data.totalCount !== undefined) {
        paginationInfo += `Total count: ${data.totalCount}\n`;
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Found ${versions.length} versions for project ${projectId}:\n\n${versionsText}${paginationInfo}`,
        },
      ],
    };
  }
);

// Tool: Export Project Version
server.tool(
  "export-project-version",
  "Export a complete project version with all workflow details and dependencies for migration",
  {
    token: z.string().describe("Tray API token with project access"),
    projectId: z.string().describe("Project ID to export"),
    versionNumber: z.string().describe("Version number to export"),
    region: z.enum(["us", "eu", "apac"]).optional().describe("Tray region (default: us)"),
  },
  async ({ token, projectId, versionNumber, region = "us" }) => {
    const url = `/core/v1/projects/${projectId}/versions/${versionNumber}/export`;

    const data = await makeTrayRequest<TrayProjectExport>(
      url,
      token,
      { region }
    );

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to export project ${projectId} version ${versionNumber}`,
          },
        ],
      };
    }

    // Analyze the exported project structure
    const workflows = data.workflows || [];
    const connectors = data.connectors || [];
    const services = data.services || [];
    const authentications = data.authentications || [];
    const dependencies = data.dependencies || {};

    // Create comprehensive migration analysis
    let analysisText = `# Project Export Analysis\n\n`;
    analysisText += `**Project:** ${data.project?.name || "Unknown"} (${projectId})\n`;
    analysisText += `**Version:** ${versionNumber}\n`;
    analysisText += `**Export Date:** ${new Date().toISOString()}\n\n`;

    // Workflow Analysis
    analysisText += `## Workflows (${workflows.length})\n\n`;
    workflows.forEach((workflow) => {
      analysisText += `### ${workflow.name} (${workflow.id})\n`;
      analysisText += `- **Description:** ${workflow.description || "N/A"}\n`;
      analysisText += `- **Enabled:** ${workflow.enabled}\n`;
      analysisText += `- **Steps:** ${workflow.steps?.length || 0}\n`;
      analysisText += `- **Connections:** ${workflow.connections?.length || 0}\n`;
      
      if (workflow.nestedWorkflows && workflow.nestedWorkflows.length > 0) {
        analysisText += `- **Nested Workflows:** ${workflow.nestedWorkflows.length}\n`;
        workflow.nestedWorkflows.forEach((nested) => {
          analysisText += `  - ${nested.workflowName} (${nested.workflowId})\n`;
        });
      }

      if (workflow.triggers && workflow.triggers.length > 0) {
        analysisText += `- **Triggers:**\n`;
        workflow.triggers.forEach((trigger) => {
          analysisText += `  - ${trigger.name}: ${trigger.connector?.name || trigger.trigger?.name}`;
          if (trigger.connector?.operation || trigger.trigger?.operation) {
            analysisText += ` (${trigger.connector?.operation || trigger.trigger?.operation})`;
          }
          analysisText += `\n`;
        });
      }

      if (workflow.steps && workflow.steps.length > 0) {
        analysisText += `- **Step Details:**\n`;
        workflow.steps.forEach((step) => {
          analysisText += `  - **${step.name}** (${step.id})\n`;
          if (step.connector) {
            analysisText += `    - Connector: ${step.connector.name} v${step.connector.version}\n`;
            analysisText += `    - Operation: ${step.connector.operation}\n`;
          }
          if (step.trigger) {
            analysisText += `    - Trigger: ${step.trigger.name} v${step.trigger.version}\n`;
            analysisText += `    - Operation: ${step.trigger.operation}\n`;
          }
          if (step.authentication) {
            analysisText += `    - Authentication: ${step.authentication.name} (${step.authentication.id})\n`;
          }
        });
      }
      analysisText += `\n`;
    });

    // Dependencies Analysis
    analysisText += `## Dependencies\n\n`;
    analysisText += `- **Connectors:** ${connectors.length}\n`;
    analysisText += `- **Services:** ${services.length}\n`;
    analysisText += `- **Authentications:** ${authentications.length}\n`;
    
    if (dependencies.workflows && dependencies.workflows.length > 0) {
      analysisText += `- **Workflow Dependencies:** ${dependencies.workflows.join(", ")}\n`;
    }
    
    if (dependencies.connectors && dependencies.connectors.length > 0) {
      analysisText += `- **Connector Dependencies:** ${dependencies.connectors.join(", ")}\n`;
    }

    analysisText += `\n## Configuration\n\n`;
    if (data.config) {
      analysisText += `Configuration keys: ${Object.keys(data.config).length}\n`;
      analysisText += `\`\`\`json\n${JSON.stringify(data.config, null, 2)}\n\`\`\`\n\n`;
    }

    // Include the full export data for detailed analysis
    analysisText += `## Full Export Data\n\n`;
    analysisText += `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;

    return {
      content: [
        {
          type: "text",
          text: analysisText,
        },
      ],
    };
  }
);

// Tool: Get Project Import Requirements
server.tool(
  "get-project-import-requirements",
  "Analyze import requirements and dependencies for migrating a project to a new environment",
  {
    token: z.string().describe("Tray API token with project access"),
    projectId: z.string().describe("Destination project ID for import analysis"),
    exportedProjectJson: z.any().describe("Exported project JSON data"),
    region: z.enum(["us", "eu", "apac"]).optional().describe("Tray region (default: us)"),
  },
  async ({ token, projectId, exportedProjectJson, region = "us" }) => {
    const url = `/core/v1/projects/${projectId}/imports/requirements`;

    const data = await makeTrayRequest<any>(
      url,
      token,
      { 
        method: "POST",
        body: { exportedProjectJson },
        region 
      }
    );

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to analyze import requirements for project ${projectId}`,
          },
        ],
      };
    }

    let requirementsText = `# Import Requirements Analysis\n\n`;
    requirementsText += `**Target Project:** ${projectId}\n`;
    requirementsText += `**Analysis Date:** ${new Date().toISOString()}\n\n`;

    // Authentication Requirements
    if (data.authenticationsRequirements && data.authenticationsRequirements.length > 0) {
      requirementsText += `## Authentication Requirements (${data.authenticationsRequirements.length})\n\n`;
      data.authenticationsRequirements.forEach((authReq: any) => {
        requirementsText += `### ${authReq.title}\n`;
        requirementsText += `- **Export ID:** ${authReq.authExportId}\n`;
        requirementsText += `- **Service:** ${authReq.service?.name} v${authReq.service?.version}\n`;
        requirementsText += `- **Scopes:** ${authReq.scopes?.join(", ") || "None"}\n`;
        
        if (authReq.resolvedAuthentication) {
          requirementsText += `- **Resolved Authentication:** ${authReq.resolvedAuthentication.title} (${authReq.resolvedAuthentication.id})\n`;
        } else {
          requirementsText += `- **Status:** ⚠️ Requires new authentication\n`;
        }
        requirementsText += `\n`;
      });
    }

    // Configuration Requirements
    if (data.config) {
      requirementsText += `## Configuration Analysis\n\n`;
      requirementsText += `- **New Config Keys:** ${data.newConfigKeys ? "Yes" : "No"}\n`;
      requirementsText += `- **Unresolved Authentications:** ${data.unresolvedAuthentications ? "Yes" : "No"}\n\n`;
      
      if (data.config.source && data.config.target) {
        requirementsText += `### Source Configuration\n`;
        requirementsText += `\`\`\`json\n${JSON.stringify(data.config.source, null, 2)}\n\`\`\`\n\n`;
        
        requirementsText += `### Target Configuration\n`;
        requirementsText += `\`\`\`json\n${JSON.stringify(data.config.target, null, 2)}\n\`\`\`\n\n`;
      }
    }

    // Migration Action Items
    requirementsText += `## Migration Action Items\n\n`;
    
    if (data.unresolvedAuthentications) {
      requirementsText += `- ⚠️ **Create missing authentications** before import\n`;
    }
    
    if (data.newConfigKeys) {
      requirementsText += `- ⚠️ **Review and map new configuration keys**\n`;
    }
    
    if (!data.unresolvedAuthentications && !data.newConfigKeys) {
      requirementsText += `- ✅ **Ready for import** - No blocking issues found\n`;
    }

    requirementsText += `\n## Full Requirements Data\n\n`;
    requirementsText += `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;

    return {
      content: [
        {
          type: "text",
          text: requirementsText,
        },
      ],
    };
  }
);

// Tool: Preview Project Import
server.tool(
  "preview-project-import",
  "Preview the impact of importing a project with workflow migration analysis",
  {
    token: z.string().describe("Tray API token with project access"),
    projectId: z.string().describe("Destination project ID for import preview"),
    exportedProjectJson: z.any().describe("Exported project JSON data"),
    authenticationResolution: z.array(z.any()).optional().describe("Authentication mapping for import"),
    connectorMapping: z.array(z.any()).optional().describe("Connector mapping for import"),
    serviceMapping: z.array(z.any()).optional().describe("Service mapping for import"),
    configOverride: z.any().optional().describe("Configuration overrides"),
    region: z.enum(["us", "eu", "apac"]).optional().describe("Tray region (default: us)"),
  },
  async ({ token, projectId, exportedProjectJson, authenticationResolution = [], connectorMapping = [], serviceMapping = [], configOverride, region = "us" }) => {
    const url = `/core/v1/projects/${projectId}/imports/previews`;

    const requestBody: any = {
      exportedProjectJson,
      authenticationResolution,
      connectorMapping,
      serviceMapping
    };

    if (configOverride) {
      requestBody.configOverride = configOverride;
    }

    const data = await makeTrayRequest<any>(
      url,
      token,
      { 
        method: "POST",
        body: requestBody,
        region 
      }
    );

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to preview import for project ${projectId}`,
          },
        ],
      };
    }

    let previewText = `# Import Preview Analysis\n\n`;
    previewText += `**Target Project:** ${data.importMetadata?.projectName || projectId}\n`;
    previewText += `**Source Project:** ${data.importMetadata?.importedFrom?.projectName || "Unknown"}\n`;
    
    if (data.importMetadata?.importedFrom?.projectVersion) {
      previewText += `**Source Version:** ${data.importMetadata.importedFrom.projectVersion}\n`;
    }
    
    previewText += `**Preview Date:** ${new Date().toISOString()}\n\n`;

    // Project Impact Analysis
    if (data.projectImpact) {
      previewText += `## Project Impact\n\n`;
      
      // Workflow Changes
      if (data.projectImpact.workflows) {
        const workflows = data.projectImpact.workflows;
        previewText += `### Workflow Changes\n`;
        previewText += `- **Created:** ${workflows.created?.length || 0}\n`;
        previewText += `- **Updated:** ${workflows.updated?.length || 0}\n`;
        previewText += `- **Removed:** ${workflows.removed?.length || 0}\n\n`;
        
        if (workflows.created && workflows.created.length > 0) {
          previewText += `#### Workflows to be Created:\n`;
          workflows.created.forEach((workflow: any) => {
            previewText += `- **${workflow.name}** (from ${workflow.importedFromId})\n`;
          });
          previewText += `\n`;
        }
        
        if (workflows.updated && workflows.updated.length > 0) {
          previewText += `#### Workflows to be Updated:\n`;
          workflows.updated.forEach((workflow: any) => {
            previewText += `- **${workflow.name}** (${workflow.id}) ← from ${workflow.importedFromId}\n`;
          });
          previewText += `\n`;
        }
        
        if (workflows.removed && workflows.removed.length > 0) {
          previewText += `#### Workflows to be Removed:\n`;
          workflows.removed.forEach((workflow: any) => {
            previewText += `- **${workflow.name}** (${workflow.id})\n`;
          });
          previewText += `\n`;
        }
      }
      
      // Configuration Changes
      if (data.projectImpact.config) {
        const config = data.projectImpact.config;
        previewText += `### Configuration Changes\n`;
        previewText += `- **Created:** ${config.created?.length || 0}\n`;
        previewText += `- **Updated:** ${config.updated?.length || 0}\n`;
        previewText += `- **Removed:** ${config.removed?.length || 0}\n\n`;
      }
    }

    // Solution Impact (if applicable)
    if (data.solutionImpact) {
      previewText += `## Solution Impact\n\n`;
      previewText += `- **Change Type:** ${data.solutionImpact.changeType}\n`;
      previewText += `- **Breaking Changes:** ${data.solutionImpact.breakingChanges ? "⚠️ Yes" : "✅ No"}\n`;
      previewText += `- **Requires New User Input:** ${data.solutionImpact.requiresNewUserInput ? "Yes" : "No"}\n`;
      previewText += `- **Requires New System Input:** ${data.solutionImpact.requiresNewSystemInput ? "Yes" : "No"}\n\n`;
      
      if (data.solutionImpact.breakingChanges) {
        previewText += `⚠️ **Warning:** This import introduces breaking changes to the solution. Existing solution instances may require manual upgrade.\n\n`;
      }
    }

    // Migration Recommendations
    previewText += `## Migration Recommendations\n\n`;
    
    let hasWarnings = false;
    
    if (data.solutionImpact?.breakingChanges) {
      previewText += `- ⚠️ **Breaking Changes Detected:** Review solution instances before import\n`;
      hasWarnings = true;
    }
    
    if (data.projectImpact?.workflows?.removed?.length > 0) {
      previewText += `- ⚠️ **Workflows Will Be Removed:** ${data.projectImpact.workflows.removed.length} workflows\n`;
      hasWarnings = true;
    }
    
    if (data.solutionImpact?.requiresNewUserInput) {
      previewText += `- ⚠️ **User Input Required:** Solution will require new end-user configuration\n`;
      hasWarnings = true;
    }
    
    if (!hasWarnings) {
      previewText += `- ✅ **Safe to Import:** No breaking changes or warnings detected\n`;
    }

    previewText += `\n## Full Preview Data\n\n`;
    previewText += `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;

    return {
      content: [
        {
          type: "text",
          text: previewText,
        },
      ],
    };
  }
);

// Tool: Analyze Workflow Dependencies
server.tool(
  "analyze-workflow-dependencies",
  "Analyze workflow dependencies and nested workflow calls for migration planning",
  {
    token: z.string().describe("Tray API token with project access"),
    projectExport: z.any().describe("Exported project JSON containing workflow data"),
    region: z.enum(["us", "eu", "apac"]).optional().describe("Tray region (default: us)"),
  },
  async ({ token, projectExport, region = "us" }) => {
    // Analyze the project export for workflow dependencies
    const workflows = projectExport.workflows || [];
    const authentications = projectExport.authentications || [];
    const connectors = projectExport.connectors || [];
    const services = projectExport.services || [];

    let analysisText = `# Workflow Dependencies Analysis\n\n`;
    analysisText += `**Analysis Date:** ${new Date().toISOString()}\n`;
    analysisText += `**Project:** ${projectExport.project?.name || "Unknown"}\n\n`;

    // Dependency Summary
    analysisText += `## Summary\n\n`;
    analysisText += `- **Total Workflows:** ${workflows.length}\n`;
    analysisText += `- **Total Connectors:** ${connectors.length}\n`;
    analysisText += `- **Total Services:** ${services.length}\n`;
    analysisText += `- **Total Authentications:** ${authentications.length}\n\n`;

    // Detailed Workflow Analysis
    analysisText += `## Workflow Dependencies\n\n`;

    const dependencyMap = new Map<string, Set<string>>();
    const connectorUsage = new Map<string, Set<string>>();
    const authenticationUsage = new Map<string, Set<string>>();
    const nestedWorkflows = new Map<string, string[]>();

    workflows.forEach((workflow: any) => {
      const workflowId = workflow.id;
      const deps = new Set<string>();
      
      // Analyze steps for dependencies
      if (workflow.steps) {
        workflow.steps.forEach((step: any) => {
          // Connector dependencies
          if (step.connector) {
            const connectorKey = `${step.connector.name}:${step.connector.version}`;
            deps.add(`connector:${connectorKey}`);
            
            if (!connectorUsage.has(connectorKey)) {
              connectorUsage.set(connectorKey, new Set());
            }
            connectorUsage.get(connectorKey)!.add(workflow.name);
          }
          
          // Trigger dependencies
          if (step.trigger) {
            const triggerKey = `${step.trigger.name}:${step.trigger.version}`;
            deps.add(`trigger:${triggerKey}`);
          }
          
          // Authentication dependencies
          if (step.authentication) {
            const authKey = step.authentication.id;
            deps.add(`auth:${authKey}`);
            
            if (!authenticationUsage.has(authKey)) {
              authenticationUsage.set(authKey, new Set());
            }
            authenticationUsage.get(authKey)!.add(workflow.name);
          }
        });
      }
      
      // Check for nested workflows
      if (workflow.nestedWorkflows && workflow.nestedWorkflows.length > 0) {
        nestedWorkflows.set(workflowId, workflow.nestedWorkflows.map((nw: any) => nw.workflowName));
        workflow.nestedWorkflows.forEach((nested: any) => {
          deps.add(`workflow:${nested.workflowName}`);
        });
      }
      
      dependencyMap.set(workflowId, deps);
    });

    // Output detailed analysis for each workflow
    workflows.forEach((workflow: any) => {
      analysisText += `### ${workflow.name} (${workflow.id})\n`;
      analysisText += `- **Description:** ${workflow.description || "N/A"}\n`;
      analysisText += `- **Enabled:** ${workflow.enabled}\n`;
      analysisText += `- **Steps:** ${workflow.steps?.length || 0}\n`;
      
      const deps = dependencyMap.get(workflow.id) || new Set();
      analysisText += `- **Total Dependencies:** ${deps.size}\n`;
      
      // Connector dependencies
      const connectorDeps = Array.from(deps).filter(d => d.startsWith('connector:'));
      if (connectorDeps.length > 0) {
        analysisText += `- **Connectors Used:**\n`;
        connectorDeps.forEach(dep => {
          const connectorInfo = dep.replace('connector:', '');
          analysisText += `  - ${connectorInfo}\n`;
        });
      }
      
      // Authentication dependencies
      const authDeps = Array.from(deps).filter(d => d.startsWith('auth:'));
      if (authDeps.length > 0) {
        analysisText += `- **Authentications Required:**\n`;
        authDeps.forEach(dep => {
          const authId = dep.replace('auth:', '');
          const auth = authentications.find((a: any) => a.id === authId);
          analysisText += `  - ${auth?.name || authId} (${authId})\n`;
        });
      }
      
      // Nested workflow dependencies
      if (nestedWorkflows.has(workflow.id)) {
        analysisText += `- **Nested Workflows:**\n`;
        nestedWorkflows.get(workflow.id)!.forEach(nestedName => {
          analysisText += `  - ${nestedName}\n`;
        });
      }
      
      analysisText += `\n`;
    });

    // Cross-reference analysis
    analysisText += `## Cross-Reference Analysis\n\n`;
    
    // Most used connectors
    if (connectorUsage.size > 0) {
      analysisText += `### Connector Usage\n`;
      const sortedConnectors = Array.from(connectorUsage.entries())
        .sort((a, b) => b[1].size - a[1].size);
      
      sortedConnectors.forEach(([connector, workflows]) => {
        analysisText += `- **${connector}:** Used by ${workflows.size} workflow(s)\n`;
        Array.from(workflows).forEach(workflowName => {
          analysisText += `  - ${workflowName}\n`;
        });
      });
      analysisText += `\n`;
    }
    
    // Most used authentications
    if (authenticationUsage.size > 0) {
      analysisText += `### Authentication Usage\n`;
      const sortedAuths = Array.from(authenticationUsage.entries())
        .sort((a, b) => b[1].size - a[1].size);
      
      sortedAuths.forEach(([authId, workflows]) => {
        const auth = authentications.find((a: any) => a.id === authId);
        analysisText += `- **${auth?.name || authId}:** Used by ${workflows.size} workflow(s)\n`;
        Array.from(workflows).forEach(workflowName => {
          analysisText += `  - ${workflowName}\n`;
        });
      });
      analysisText += `\n`;
    }

    // Migration recommendations
    analysisText += `## Migration Recommendations\n\n`;
    
    if (nestedWorkflows.size > 0) {
      analysisText += `- ⚠️ **Nested Workflows Detected:** ${nestedWorkflows.size} workflows contain nested calls\n`;
      analysisText += `  - Ensure all nested workflows are included in migration\n`;
      analysisText += `  - Verify workflow execution order dependencies\n\n`;
    }
    
    if (connectorUsage.size > 0) {
      analysisText += `- 📋 **Connector Migration Checklist:**\n`;
      connectorUsage.forEach((workflows, connector) => {
        analysisText += `  - [ ] Verify ${connector} availability in target environment\n`;
      });
      analysisText += `\n`;
    }
    
    if (authenticationUsage.size > 0) {
      analysisText += `- 🔑 **Authentication Migration Checklist:**\n`;
      authenticationUsage.forEach((workflows, authId) => {
        const auth = authentications.find((a: any) => a.id === authId);
        analysisText += `  - [ ] Recreate authentication: ${auth?.name || authId}\n`;
      });
      analysisText += `\n`;
    }

    return {
      content: [
        {
          type: "text",
          text: analysisText,
        },
      ],
    };
  }
);

// ================== END WORKFLOW MIGRATION TOOLS ==================

// Main function to run the server
async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Tray MCP Server running on stdio");
}

// Main execution function
async function main() {
  try {
    // Handle command line arguments first
    const shouldExit = await handleCommandLineArgs();
    if (shouldExit) {
      return; // Exit if setup or help was requested
    }

    // Load configuration
    const globalConfig = await loadConfiguration();

    // Check if we have any tokens configured
    if (!globalConfig.masterToken && !globalConfig.userToken) {
      console.error(`
⚠️  No Tray API tokens found!

To use the Tray MCP Server, you need to configure your API tokens.

Run the interactive setup:
  tray-mcp-server --setup

Or set environment variables:
  export TRAY_MASTER_TOKEN="your_master_token"
  export TRAY_USER_TOKEN="your_user_token"

For more information: https://github.com/yourusername/tray-mcp-server
`);
      process.exit(1);
    }

    // Start the MCP server
    await startServer();
    
  } catch (error) {
    console.error("Fatal error in main():", error);
    process.exit(1);
  }
}

// Execute main function
main();
