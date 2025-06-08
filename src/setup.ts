#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { createInterface } from 'readline';
import { existsSync } from 'fs';

// ANSI color codes for better UX
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

let rl: any = null;

interface TrayTokenConfig {
  masterToken?: string;
  userToken?: string;
  region?: 'us' | 'eu' | 'apac';
  workspaceId?: string;
}

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function printHeader() {
  console.log('\n' + colorize('🔧 Tray MCP Server Setup', 'cyan'));
  console.log(colorize('━'.repeat(50), 'dim'));
  console.log(colorize('Welcome to the Tray MCP Server setup wizard!', 'white'));
  console.log(colorize('This will help you configure your Tray.io API tokens.\n', 'dim'));
}

function printTokenInfo() {
  console.log(colorize('📋 Token Types Explained:', 'yellow'));
  console.log(colorize('• Master Token:', 'bright') + ' Full organization access (recommended for most use cases)');
  console.log(colorize('• User Token:', 'bright') + ' User-specific access for end-user operations');
  console.log(colorize('• Both tokens can be used depending on the operation\n', 'dim'));
  
  console.log(colorize('🌍 Regions Available:', 'yellow'));
  console.log(colorize('• US (default):', 'bright') + ' api.tray.io');
  console.log(colorize('• EU:', 'bright') + ' api.eu1.tray.io');
  console.log(colorize('• APAC:', 'bright') + ' api.ap1.tray.io\n');
  
  console.log(colorize('📖 How to get tokens:', 'yellow'));
  console.log('Visit: ' + colorize('https://tray.io/documentation/tray-uac/governance/org-management/creating-api-tokens/', 'blue'));
  console.log('');
}

async function getConfigPath(): Promise<string> {
  const homeDir = homedir();
  const configDir = join(homeDir, '.config', 'tray-mcp-server');
  
  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true });
  }
  
  return join(configDir, 'config.json');
}

async function loadExistingConfig(): Promise<TrayTokenConfig> {
  try {
    const configPath = await getConfigPath();
    if (existsSync(configPath)) {
      const content = await readFile(configPath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    // Config doesn't exist or is invalid, return empty config
  }
  return {};
}

async function saveConfig(config: TrayTokenConfig): Promise<void> {
  const configPath = await getConfigPath();
  await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  console.log(colorize(`✅ Configuration saved to: ${configPath}`, 'green'));
}

async function validateToken(token: string, region: string = 'us'): Promise<boolean> {
  try {
    const baseUrls = {
      us: 'https://api.tray.io',
      eu: 'https://api.eu1.tray.io',
      apac: 'https://api.ap1.tray.io'
    };
    
    const response = await fetch(`${baseUrls[region as keyof typeof baseUrls]}/core/v1/workspaces`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'tray-mcp-server-setup/1.0.0'
      }
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function promptForTokens(): Promise<TrayTokenConfig> {
  const config: TrayTokenConfig = {};
  
  // Region selection
  console.log(colorize('1. Select your Tray region:', 'cyan'));
  console.log('1) US (default)');
  console.log('2) EU');
  console.log('3) APAC');
  
  const regionChoice = await question(colorize('Choose region (1-3, default: 1): ', 'white'));
  const regionMap = { '1': 'us', '2': 'eu', '3': 'apac' };
  config.region = (regionMap[regionChoice as keyof typeof regionMap] || 'us') as 'us' | 'eu' | 'apac';
  
  console.log(colorize(`✓ Selected region: ${config.region.toUpperCase()}`, 'green'));
  
  // Master token
  console.log(colorize('\n2. Configure Master Token (Organization-level access):', 'cyan'));
  const masterToken = await question(colorize('Enter your master token (or press Enter to skip): ', 'white'));
  
  if (masterToken.trim()) {
    console.log(colorize('Validating master token...', 'yellow'));
    const isValid = await validateToken(masterToken.trim(), config.region);
    
    if (isValid) {
      config.masterToken = masterToken.trim();
      console.log(colorize('✅ Master token validated successfully!', 'green'));
    } else {
      console.log(colorize('❌ Master token validation failed. Please check your token and region.', 'red'));
      const proceed = await question(colorize('Save anyway? (y/N): ', 'yellow'));
      if (proceed.toLowerCase() === 'y') {
        config.masterToken = masterToken.trim();
      }
    }
  } else {
    console.log(colorize('⏭️  Skipping master token', 'dim'));
  }
  
  // User token
  console.log(colorize('\n3. Configure User Token (User-specific access):', 'cyan'));
  const userToken = await question(colorize('Enter your user token (or press Enter to skip): ', 'white'));
  
  if (userToken.trim()) {
    console.log(colorize('Validating user token...', 'yellow'));
    const isValid = await validateToken(userToken.trim(), config.region);
    
    if (isValid) {
      config.userToken = userToken.trim();
      console.log(colorize('✅ User token validated successfully!', 'green'));
    } else {
      console.log(colorize('❌ User token validation failed. Please check your token and region.', 'red'));
      const proceed = await question(colorize('Save anyway? (y/N): ', 'yellow'));
      if (proceed.toLowerCase() === 'y') {
        config.userToken = userToken.trim();
      }
    }
  } else {
    console.log(colorize('⏭️  Skipping user token', 'dim'));
  }
  
  // Workspace ID (optional)
  console.log(colorize('\n4. Default Workspace ID (optional):', 'cyan'));
  const workspaceId = await question(colorize('Enter default workspace ID (or press Enter to skip): ', 'white'));
  
  if (workspaceId.trim()) {
    config.workspaceId = workspaceId.trim();
    console.log(colorize('✓ Default workspace ID set', 'green'));
  } else {
    console.log(colorize('⏭️  No default workspace ID', 'dim'));
  }
  
  return config;
}

function printUsageInstructions(config: TrayTokenConfig) {
  console.log('\n' + colorize('🚀 Setup Complete!', 'green'));
  console.log(colorize('━'.repeat(50), 'dim'));
  
  if (config.masterToken || config.userToken) {
    console.log(colorize('Your tokens are now configured. Here\'s how to use them:', 'white'));
    console.log('');
    
    console.log(colorize('📝 Claude Desktop Configuration:', 'yellow'));
    console.log('Add this to your Claude Desktop MCP settings:');
    console.log('');
    console.log(colorize(JSON.stringify({
      "mcpServers": {
        "tray": {
          "command": "tray-mcp-server"
        }
      }
    }, null, 2), 'cyan'));
    console.log('');
    
    console.log(colorize('🔧 Environment Variables (alternative):', 'yellow'));
    if (config.masterToken) {
      console.log(`export TRAY_MASTER_TOKEN="${config.masterToken}"`);
    }
    if (config.userToken) {
      console.log(`export TRAY_USER_TOKEN="${config.userToken}"`);
    }
    console.log(`export TRAY_REGION="${config.region}"`);
    
    if (config.workspaceId) {
      console.log(`export TRAY_WORKSPACE_ID="${config.workspaceId}"`);
    }
    
    console.log('');
    console.log(colorize('📚 Available Tools:', 'yellow'));
    console.log('• list-connectors, get-connector-operations, call-connector');
    console.log('• list-triggers, create-subscription, get-subscriptions');
    console.log('• get-service-environments, create-authentication, delete-authentication');
    console.log('• list-workspaces');
    console.log('• list-projects, export-project-version, analyze-workflow-dependencies');
    console.log('• And more workflow migration tools!');
    
  } else {
    console.log(colorize('⚠️  No tokens were configured.', 'yellow'));
    console.log('You can run this setup again anytime with: ' + colorize('npx tray-mcp-server --setup', 'cyan'));
  }
  
  console.log('');
  console.log(colorize('📖 Documentation:', 'blue') + ' https://github.com/yourusername/tray-mcp-server');
  console.log(colorize('🆘 Support:', 'blue') + ' https://github.com/yourusername/tray-mcp-server/issues');
}

async function checkExistingConfig(): Promise<boolean> {
  const existing = await loadExistingConfig();
  
  if (existing.masterToken || existing.userToken) {
    console.log(colorize('🔍 Existing configuration found:', 'yellow'));
    console.log(`• Region: ${existing.region || 'us'}`);
    console.log(`• Master Token: ${existing.masterToken ? '✓ Configured' : '✗ Not set'}`);
    console.log(`• User Token: ${existing.userToken ? '✓ Configured' : '✗ Not set'}`);
    console.log(`• Workspace ID: ${existing.workspaceId || 'Not set'}`);
    
    const overwrite = await question(colorize('\nWould you like to reconfigure? (y/N): ', 'white'));
    return overwrite.toLowerCase() === 'y';
  }
  
  return true;
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const isAutoSetup = args.includes('--auto-setup');
    
    if (isAutoSetup) {
      // Auto-setup mode for postinstall - check if config exists, if not, show brief info
      const existing = await loadExistingConfig();
      
      if (existing.masterToken || existing.userToken) {
        console.log(colorize('✅ Tray MCP Server tokens already configured!', 'green'));
        console.log('Run ' + colorize('tray-mcp-server --setup', 'cyan') + ' to reconfigure if needed.');
        return;
      } else {
        console.log(colorize('\n🔧 Tray MCP Server installed successfully!', 'cyan'));
        console.log(colorize('To get started, configure your API tokens:', 'white'));
        console.log('');
        console.log(colorize('Interactive setup:', 'yellow') + ' ' + colorize('tray-mcp-server --setup', 'cyan'));
        console.log(colorize('Or set environment variables:', 'yellow'));
        console.log('  export TRAY_MASTER_TOKEN="your_token"');
        console.log('  export TRAY_USER_TOKEN="your_token"');
        console.log('');
        console.log(colorize('Documentation:', 'blue') + ' https://github.com/yourusername/tray-mcp-server');
        return;
      }
    }
    
    // Regular interactive setup mode - only initialize readline here
    if (!rl) {
      rl = createInterface({
        input: process.stdin,
        output: process.stdout
      });
    }
    
    printHeader();
    printTokenInfo();
    
    const shouldConfigure = await checkExistingConfig();
    
    if (shouldConfigure) {
      const config = await promptForTokens();
      
      if (config.masterToken || config.userToken) {
        await saveConfig(config);
        printUsageInstructions(config);
      } else {
        console.log(colorize('\n⚠️  No tokens were provided. Setup cancelled.', 'yellow'));
        console.log('Run ' + colorize('npx tray-mcp-server --setup', 'cyan') + ' to configure tokens later.');
      }
    } else {
      console.log(colorize('\n✅ Keeping existing configuration.', 'green'));
      const existing = await loadExistingConfig();
      printUsageInstructions(existing);
    }
    
  } catch (error) {
    console.error(colorize('\n❌ Setup failed:', 'red'), error);
    process.exit(1);
  } finally {
    if (rl) {
      rl.close();
    }
  }
}

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('setup.js')) {
  main();
}

export { main as setupTrayMCP };
