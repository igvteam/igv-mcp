import * as net from "net"

/**
 * IGV Connection Manager
 */
export default class IGVConnection {
    /**
     * @param {string} host
     * @param {number} port
     */
    constructor(host = "127.0.0.1", port = 60151) {
        this.host = host
        this.port = port
    }

    /**
     * Send a command to IGV and return the response
     * @param {string} command
     * @returns {Promise<string>}
     */
    async sendCommand(command) {
        return new Promise((resolve) => {
            const client = new net.Socket()
            let response = ""
            let resolved = false

            // Set timeout before connecting
            client.setTimeout(60000)

            client.connect(this.port, this.host, () => {
                console.error(`[IGV] Connected to ${this.host}:${this.port}`)
                client.write(`${command}\n`)
                console.error(`[IGV] Sent command: ${command}`)
            })

            client.on("data", (data) => {
                response += data.toString()

                // IGV responses are single-line ending with newline
                if (response.endsWith("\n")) {
                    resolved = true
                    client.destroy()
                    resolve(response.trim() || "OK")
                }
            })

            client.on("end", () => {
                console.error(`[IGV] Connection ended`)
                if (!resolved) {
                    resolved = true
                    client.destroy()
                    resolve(response.trim() || "OK")
                }
            })

            client.on("error", (err) => {
                console.error(`[IGV] Socket error: ${err.message}`)
                if (!resolved) {
                    resolved = true
                    client.destroy()
                    resolve(`Error: ${err.message}`)
                }
            })

            client.on("timeout", () => {
                console.error(`[IGV] Socket timeout`)
                if (!resolved) {
                    resolved = true
                    client.destroy()
                    resolve("Error: Connection timeout")
                }
            })

            client.on("close", () => {
                console.error(`[IGV] Socket closed`)
            })
        })
    }
}

