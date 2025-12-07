#!/usr/bin/env node

/**
 * IGV MCP Server
 *
 * A Model Context Protocol server for controlling IGV (Integrative Genomics Viewer) via socket commands.
 */


import IGVConnection from "./igvConnection.js"
import startServer from "./mcpServer.js"


/**
 * Parse host:port from arguments
 * @param {string} hostArg
 * @returns {{ host: string, port: number }}
 */
function parseHostPort(hostArg) {
    if (hostArg.includes(":")) {
        const [host, portStr] = hostArg.split(":")
        return {host, port: parseInt(portStr, 10)}
    }
    return {host: hostArg, port: 60151}
}


/**
 * Main server setup
 */
async function main() {

    // Parse command line arguments
    const args = process.argv.slice(2)
    let host = "localhost"
    let port = 60151
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--host" && i + 1 < args.length) host = args[i + 1]
        else if (args[i] === "--port" && i + 1 < args.length) port = parseInt(args[i + 1], 10)
    }

    // Initialize IGV connection
    const igvConnection = new IGVConnection(host, port)

    console.error(`Starting IGV MCP Server (IGV at ${host}:${port})`)
    await startServer(igvConnection)
}

main().catch((error) => {
    console.error("Fatal error:", error)
    process.exit(1)
})
