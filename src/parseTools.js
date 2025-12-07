import {parse} from "../node_modules/yaml/browser/index.js"

/**
 * Parse YAML and generate MCP tool definitions
 */
async function parseTools(toolsYAML) {

    const spec = parse(toolsYAML)
    const toolsList = Array.isArray(spec) ? spec : spec?.tools ?? []

    return toolsList.map((tool) => {
        const inputSchema = {
            type: "object",
            properties: {},
            required: [],
        }

        if (tool.arguments) {
            for (const arg of tool.arguments) {
                const property = {description: arg.description || "",}

                // Set type based on argument definition
                switch (arg.type) {
                    case "integer":
                        property.type = "number"
                        break
                    case "boolean":
                        property.type = "boolean"
                        break
                    case "string":
                    default:
                        property.type = "string"
                        if (arg.enumValues)
                            property.enum = arg.enumValues.map((e) => e.value)
                        break
                }

                inputSchema.properties[arg.name] = property

                // Add to required array if not optional
                if (!arg.optional) inputSchema.required.push(arg.name)
            }
        }

        // Remove required array if empty
        if (inputSchema.required.length === 0) delete inputSchema.required

        return {
            name: tool.name,
            description: tool.description || "",
            inputSchema,
            _toolSpec: tool,
        }
    })
}


export default parseTools