#!/usr/bin/env node

/**
 * IGV MCP Server
 *
 * A Model Context Protocol server for controlling IGV (Integrative Genomics Viewer) via socket commands.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import * as net from "net";
import { parse } from "yaml";
import toolsYAML from "./tools.yaml.js";

/**
 * IGV Connection Manager
 */
class IGVConnection {
    /**
     * @param {string} host
     * @param {number} port
     */
    constructor(host = "127.0.0.1", port = 60151) {
        this.host = host;
        this.port = port;
    }

    /**
     * Send a command to IGV and return the response
     * @param {string} command
     * @returns {Promise<string>}
     */
    async sendCommand(command) {
        return new Promise((resolve) => {
            const client = new net.Socket();
            let response = "";
            let resolved = false;

            // Set timeout before connecting
            client.setTimeout(5000);

            client.connect(this.port, this.host, () => {
                console.error(`[IGV] Connected to ${this.host}:${this.port}`);
                client.write(`${command}\n`);
                console.error(`[IGV] Sent command: ${command}`);
            });

            client.on("data", (data) => {
                response += data.toString();
                console.error(`[IGV] Received data: ${data.toString().trim()}`);

                if (!resolved) {
                    resolved = true;
                    client.destroy();
                    resolve(response.trim() || "OK");
                }
            });

            client.on("end", () => {
                console.error(`[IGV] Connection ended`);
                if (!resolved) {
                    resolved = true;
                    client.destroy();
                    resolve(response.trim() || "OK");
                }
            });

            client.on("error", (err) => {
                console.error(`[IGV] Socket error: ${err.message}`);
                if (!resolved) {
                    resolved = true;
                    client.destroy();
                    resolve(`Error: ${err.message}`);
                }
            });

            client.on("timeout", () => {
                console.error(`[IGV] Socket timeout`);
                if (!resolved) {
                    resolved = true;
                    client.destroy();
                    resolve("Error: Connection timeout");
                }
            });

            client.on("close", () => {
                console.error(`[IGV] Socket closed`);
            });
        });
    }
}

/**
 * Global IGV connection instance
 * @type {IGVConnection}
 */
let igvConnection;

/**
 * Parse host:port from arguments
 * @param {string} hostArg
 * @returns {{ host: string, port: number }}
 */
function parseHostPort(hostArg) {
    if (hostArg.includes(":")) {
        const [host, portStr] = hostArg.split(":");
        return { host, port: parseInt(portStr, 10) };
    }
    return { host: hostArg, port: 60151 };
}

/**
 * Parse YAML and generate MCP tool definitions
 */
function parseTools() {
    const spec = parse(toolsYAML);
    const toolsList = Array.isArray(spec) ? spec : spec?.tools ?? [];

    return toolsList.map((tool) => {
        const inputSchema = {
            type: "object",
            properties: {},
            required: [],
        };

        if (tool.arguments) {
            for (const arg of tool.arguments) {
                const property = { description: arg.description || "", };

                // Set type based on argument definition
                switch (arg.type) {
                    case "integer":
                        property.type = "number";
                        break;
                    case "boolean":
                        property.type = "boolean";
                        break;
                    case "string":
                    default:
                        property.type = "string";
                        if (arg.enumValues)
                            property.enum = arg.enumValues.map((e) => e.value);
                        break;
                }

                inputSchema.properties[arg.name] = property;

                // Add to required array if not optional
                if (!arg.optional) inputSchema.required.push(arg.name);
            }
        }

        // Remove required array if empty
        if (inputSchema.required.length === 0) delete inputSchema.required;

        return {
            name: tool.name,
            description: tool.description || "",
            inputSchema,
            _toolSpec: tool,
        };
    });
}

/**
 * Build IGV command from tool specification and arguments
 * @param {object} toolSpec - The tool specification from YAML
 * @param {object} args - The arguments passed to the tool
 * @returns {string} The IGV command string
 */
function buildCommand(toolSpec, args) {
    const parts = [toolSpec.name];

    if (toolSpec.arguments) {
        for (const argSpec of toolSpec.arguments) {
            const argValue = args[argSpec.name];

            // Skip optional arguments that weren't provided
            if (argValue === undefined || argValue === null) continue;

            // Handle special cases for boolean enum values (True/False)
            if (argSpec.enumValues) {
                const enumValue = String(argValue);
                // Convert "True"/"False" to lowercase for IGV
                if (enumValue === "True" || enumValue === "False") parts.push(enumValue.toLowerCase());
                else parts.push(enumValue);
            } else {
                // Regular argument value
                parts.push(String(argValue));
            }
        }
    }

    return parts.join(" ");
}

/**
 * Tool handler - executes the appropriate IGV command based on the tool name
 * @param {string} name
 * @param {any} args
 * @param {object} tool
 * @returns {Promise<string>}
 */
async function handleToolCall(name, args, tool) {
    // Use the _toolSpec from the parsed tool, not the tool itself
    const command = buildCommand(tool._toolSpec, args);
    console.error(`[IGV Command] ${command}`);
    return await igvConnection.sendCommand(command);
}

/**
 * Main server setup
 */
async function main() {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let hostArg = "127.0.0.1:60151";

    for (let i = 0; i < args.length; i++)
        if (args[i] === "--host" && i + 1 < args.length) hostArg = args[i + 1];

    // Initialize IGV connection
    const { host, port } = parseHostPort(hostArg);
    igvConnection = new IGVConnection(host, port);

    console.error(`Starting IGV MCP Server (IGV at ${host}:${port})`);

    // Parse tools from YAML
    const tools = parseTools();
    console.error(`Loaded ${tools.length} tools from YAML configuration`);

    // Create MCP server
    const server = new Server(
        { name: "igv-mcp", version: "1.0.0", },
        { capabilities: { tools: {}, }, }
    );

    // Register tool list handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return { tools };
    });

    // Register tool call handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;

        try {
            // Find the tool specification by name
            const toolSpec = tools.find((t) => t.name === name);

            // If tool specification is not found, return an error
            if (!toolSpec) { throw new Error(`Tool '${name}' not found`); }

            const result = await handleToolCall(name, args || {}, toolSpec);
            return {
                content: [ { type: "text", text: result, }, ],
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            return {
                content: [
                    { type: "text", text: `Error executing tool '${name}': ${errorMessage}`, },
                ],
                isError: true,
            };
        }
    });

    // Start server with stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error("IGV MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
