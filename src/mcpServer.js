import parseTools from "./parseTools.js"
import {Server} from "../node_modules/@modelcontextprotocol/sdk/dist/esm/server/index.js"
import {
    CallToolRequestSchema,
    ListToolsRequestSchema
} from "../node_modules/@modelcontextprotocol/sdk/dist/esm/types.js"
import {StdioServerTransport} from "../node_modules/@modelcontextprotocol/sdk/dist/esm/server/stdio.js"
import defaultToolsYaml from "./tools.yaml.js" // Important - use browser (esm) version, otherwise rollup fails

async function startServer(igvConnection) {

    // Parse tools from YAML.  First try to fetch from IGV, if no reponse or error, fall back to local YAML.
    const toolsYAML = await getToolsYAML(igvConnection)

    const tools = await parseTools(toolsYAML)
    console.error(`Loaded ${tools.length} tools from YAML configuration`)

    // Create MCP server
    const server = new Server(
        {name: "igv-mcp", version: "1.0.0"},
        {capabilities: {tools: {}}}
    )

    // Register tool list handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {tools}
    })

    // Register tool call handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {

        const {name, arguments: args} = request.params

        try {
            // Find the tool specification by name

            const toolSpec = tools.find((t) => t.name === name)

            // If tool specification is not found, return an error
            if (!toolSpec) {
                throw new Error(`Tool '${name}' not found`)
            }

            // Use the _toolSpec from the parsed tool, not the tool itself
            const command = buildCommand(toolSpec._toolSpec, args)
            console.warn(`[IGV Command] ${command}`)
            const result = await igvConnection.sendCommand(command)

            if ("OK" === result) {
                return {
                    content: [{type: "text", text: result}]
                }
            } else {
                return {
                    content: [
                        {type: "text", text: `Result: ${result}`}
                    ],
                    isError: true
                }
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            return {
                content: [
                    {type: "text", text: `Error executing tool '${name}': ${errorMessage}`}
                ],
                isError: true
            }
        }
    })

    // Start server with stdio transport
    const transport = new StdioServerTransport()
    await server.connect(transport)

    console.error("IGV MCP Server running on stdio")
}


async function getToolsYAML(igvConnection) {
    try {
        console.error("Fetching tools YAML from IGV...")
        let igvYaml = await igvConnection.sendCommand('toolsYaml')
        console.error(igvYaml)
        if (igvYaml && igvYaml.startsWith("-")) {
            //igvYaml = igvYaml.replace(/<br>/g, "\n") + "\n"
            console.error(`Fetched tools YAML from IGV ${igvYaml.length} characters`)
            return igvYaml
        } else {
            console.error("No valid tools YAML response from IGV, using default")
            return defaultToolsYaml
        }
    } catch (e) {
        console.error("Error fetching tools YAML from IGV, using default", e)
        return defaultToolsYaml
    }
}


/**
 * Build IGV command from tool specification and arguments
 * @param {object} toolSpec - The tool specification from YAML
 * @param {object} args - The arguments passed to the tool
 * @returns {string} The IGV command string
 */
function buildCommand(toolSpec, args) {
    const parts = [toolSpec.name]

    if (toolSpec.arguments) {
        for (const argSpec of toolSpec.arguments) {
            const argValue = args[argSpec.name]

            // Skip optional arguments that weren't provided
            if (argValue === undefined || argValue === null) continue

            // Handle special cases for boolean enum values (True/False)
            if (argSpec.enumValues) {
                const enumValue = String(argValue)
                // Convert "True"/"False" to lowercase for IGV
                if (enumValue === "True" || enumValue === "False") parts.push(enumValue.toLowerCase())
                else parts.push(enumValue)
            } else {
                // Regular argument value
                parts.push(String(argValue))
            }
        }
    }

    return parts.join(" ")
}


export default startServer