# Workflow Migration Guide

This guide explains how to use the Tray MCP Server's workflow migration tools to extract complete workflow context from Tray.io and migrate to custom applications.

## Overview

The workflow migration tools provide comprehensive analysis and extraction capabilities to help you migrate Tray workflows to custom Elixir, Python, or other applications. These tools ensure you capture all dependencies, configurations, and nested workflow relationships.

## Migration Process

### Step 1: Discovery and Analysis

First, identify the workflows you want to migrate:

```bash
# List all projects in your workspace
tray-mcp-server list-projects \
  --token="your-tray-token" \
  --workspaceId="your-workspace-id"

# List versions for a specific project
tray-mcp-server list-project-versions \
  --token="your-tray-token" \
  --projectId="project-id-from-above"
```

### Step 2: Export Complete Workflow Context

Export the complete project with all workflow details:

```bash
# Export a specific project version
tray-mcp-server export-project-version \
  --token="your-tray-token" \
  --projectId="your-project-id" \
  --versionNumber="1.0"
```

**What you get:**
- Complete workflow definitions with all steps
- Step-by-step connector and operation details
- Authentication requirements
- Configuration settings
- Nested workflow dependencies
- Connection mappings between steps
- Input/output schemas

### Step 3: Analyze Dependencies

Perform deep dependency analysis to understand migration requirements:

```bash
# Analyze workflow dependencies
tray-mcp-server analyze-workflow-dependencies \
  --token="your-tray-token" \
  --projectExport="$(cat exported-project.json)"
```

**Analysis includes:**
- Cross-workflow dependency mapping
- Connector usage patterns
- Authentication usage analysis
- Nested workflow call chains
- Migration priority recommendations
- Comprehensive migration checklist

### Step 4: Plan Migration to New Environment (Optional)

If migrating to another Tray environment first:

```bash
# Get import requirements
tray-mcp-server get-project-import-requirements \
  --token="target-environment-token" \
  --projectId="target-project-id" \
  --exportedProjectJson="$(cat exported-project.json)"

# Preview import impact
tray-mcp-server preview-project-import \
  --token="target-environment-token" \
  --projectId="target-project-id" \
  --exportedProjectJson="$(cat exported-project.json)"
```

## Migration to Custom Applications

### Elixir Migration Example

Here's how to use the exported data to rebuild workflows in Elixir:

```elixir
# Example: Processing exported workflow data
defmodule WorkflowMigrator do
  def migrate_workflow(exported_project) do
    workflows = exported_project["workflows"]
    
    Enum.map(workflows, fn workflow ->
      %{
        name: workflow["name"],
        description: workflow["description"],
        enabled: workflow["enabled"],
        steps: migrate_steps(workflow["steps"]),
        connections: migrate_connections(workflow["connections"]),
        config: workflow["config"]
      }
    end)
  end
  
  defp migrate_steps(steps) do
    Enum.map(steps, fn step ->
      %{
        id: step["id"],
        name: step["name"],
        connector: extract_connector_info(step["connector"]),
        input: step["input"],
        position: step["position"]
      }
    end)
  end
  
  defp extract_connector_info(nil), do: nil
  defp extract_connector_info(connector) do
    %{
      name: connector["name"],
      version: connector["version"],
      operation: connector["operation"],
      title: connector["title"]
    }
  end
  
  defp migrate_connections(connections) do
    Enum.map(connections, fn conn ->
      %{
        source: %{
          step_id: conn["source"]["stepId"],
          output_port: conn["source"]["outputPort"]
        },
        target: %{
          step_id: conn["target"]["stepId"],
          input_port: conn["target"]["inputPort"]
        }
      }
    end)
  end
end
```

### Python Migration Example

Here's how to process the exported data in Python:

```python
import json
from typing import Dict, List, Any

class WorkflowMigrator:
    def __init__(self, exported_project: Dict[str, Any]):
        self.exported_project = exported_project
        self.workflows = exported_project.get('workflows', [])
        self.authentications = exported_project.get('authentications', [])
        self.dependencies = exported_project.get('dependencies', {})
    
    def migrate_workflows(self) -> List[Dict[str, Any]]:
        """Convert Tray workflows to custom format."""
        migrated_workflows = []
        
        for workflow in self.workflows:
            migrated_workflow = {
                'name': workflow.get('name'),
                'description': workflow.get('description'),
                'enabled': workflow.get('enabled', True),
                'steps': self._migrate_steps(workflow.get('steps', [])),
                'connections': self._migrate_connections(workflow.get('connections', [])),
                'triggers': self._extract_triggers(workflow.get('triggers', [])),
                'config': workflow.get('config', {})
            }
            migrated_workflows.append(migrated_workflow)
        
        return migrated_workflows
    
    def _migrate_steps(self, steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Convert workflow steps to custom format."""
        migrated_steps = []
        
        for step in steps:
            migrated_step = {
                'id': step.get('id'),
                'name': step.get('name'),
                'type': self._determine_step_type(step),
                'connector_info': self._extract_connector_info(step.get('connector')),
                'input_parameters': step.get('input', {}),
                'position': step.get('position', {}),
                'authentication': self._extract_auth_info(step.get('authentication'))
            }
            migrated_steps.append(migrated_step)
        
        return migrated_steps
    
    def _determine_step_type(self, step: Dict[str, Any]) -> str:
        """Determine the type of step for custom implementation."""
        if step.get('connector'):
            return 'connector_operation'
        elif step.get('trigger'):
            return 'trigger_operation'
        else:
            return 'unknown'
    
    def _extract_connector_info(self, connector: Dict[str, Any]) -> Dict[str, Any]:
        """Extract connector information for custom implementation."""
        if not connector:
            return {}
        
        return {
            'name': connector.get('name'),
            'version': connector.get('version'),
            'operation': connector.get('operation'),
            'title': connector.get('title')
        }
    
    def _extract_auth_info(self, auth: Dict[str, Any]) -> Dict[str, Any]:
        """Extract authentication information."""
        if not auth:
            return {}
        
        return {
            'id': auth.get('id'),
            'name': auth.get('name')
        }
    
    def _migrate_connections(self, connections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Convert workflow connections to custom format."""
        return [
            {
                'source': {
                    'step_id': conn['source']['stepId'],
                    'output_port': conn['source'].get('outputPort')
                },
                'target': {
                    'step_id': conn['target']['stepId'],
                    'input_port': conn['target'].get('inputPort')
                }
            }
            for conn in connections
        ]
    
    def _extract_triggers(self, triggers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract trigger information."""
        return [
            {
                'name': trigger.get('name'),
                'type': 'webhook' if trigger.get('trigger') else 'unknown',
                'config': trigger.get('input', {})
            }
            for trigger in triggers
        ]
    
    def generate_migration_report(self) -> str:
        """Generate a comprehensive migration report."""
        report = []
        report.append("# Workflow Migration Report\n")
        
        report.append(f"## Summary")
        report.append(f"- Total Workflows: {len(self.workflows)}")
        report.append(f"- Total Authentications: {len(self.authentications)}")
        report.append(f"- Dependencies: {self.dependencies}\n")
        
        for workflow in self.workflows:
            report.append(f"### Workflow: {workflow.get('name')}")
            report.append(f"- Description: {workflow.get('description', 'N/A')}")
            report.append(f"- Steps: {len(workflow.get('steps', []))}")
            report.append(f"- Connections: {len(workflow.get('connections', []))}")
            
            if workflow.get('nestedWorkflows'):
                report.append(f"- Nested Workflows:")
                for nested in workflow['nestedWorkflows']:
                    report.append(f"  - {nested['workflowName']}")
            
            report.append("")
        
        return "\n".join(report)

# Usage example
def migrate_tray_project(exported_project_file: str):
    with open(exported_project_file, 'r') as f:
        exported_project = json.load(f)
    
    migrator = WorkflowMigrator(exported_project)
    migrated_workflows = migrator.migrate_workflows()
    
    # Save migrated workflows
    with open('migrated_workflows.json', 'w') as f:
        json.dump(migrated_workflows, f, indent=2)
    
    # Generate migration report
    report = migrator.generate_migration_report()
    with open('migration_report.md', 'w') as f:
        f.write(report)
    
    print("Migration completed successfully!")
    print(f"Migrated {len(migrated_workflows)} workflows")
```

## Key Migration Considerations

### 1. Authentication Mapping
- Map Tray authentications to your custom auth system
- Ensure all required scopes are available
- Consider credential management in your target application

### 2. Connector Operations
- Map Tray connector operations to equivalent API calls
- Implement rate limiting and error handling
- Consider async/await patterns for external API calls

### 3. Workflow Orchestration
- Implement workflow execution engine in your target language
- Handle step dependencies and data flow
- Consider error handling and retry mechanisms

### 4. Configuration Management
- Map Tray configuration to your application's config system
- Consider environment-specific settings
- Implement secure configuration storage

### 5. Nested Workflows
- Implement sub-workflow execution
- Handle workflow composition and dependencies
- Consider performance implications

## Best Practices

1. **Start Small**: Begin with simple workflows before tackling complex ones
2. **Test Thoroughly**: Validate migrated workflows against original behavior
3. **Document Dependencies**: Keep track of all external dependencies
4. **Implement Monitoring**: Add logging and monitoring to migrated workflows
5. **Consider Performance**: Optimize for your target application's performance characteristics

## Troubleshooting

### Common Issues

1. **Missing Dependencies**: Use `analyze-workflow-dependencies` to identify all requirements
2. **Authentication Errors**: Ensure all authentications are properly mapped
3. **Configuration Mismatch**: Use `get-project-import-requirements` to identify config issues
4. **Nested Workflow Issues**: Pay special attention to workflow call hierarchies

### Getting Help

- Review the exported JSON structure carefully
- Use the dependency analysis tools to understand relationships
- Test migration incrementally
- Refer to Tray.io documentation for operation details

## Example Scripts

Check the `examples/` directory for complete migration scripts in various languages:
- `examples/migrate_to_elixir.exs` - Elixir migration script
- `examples/migrate_to_python.py` - Python migration script
- `examples/analyze_dependencies.sh` - Shell script for dependency analysis

This guide provides a comprehensive approach to migrating your Tray workflows to custom applications while preserving all functionality and dependencies.
