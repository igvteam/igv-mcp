# IGV MCP Server

A Model Context Protocol (MCP) server for controlling [IGV]](https://github.com/igvteam/igv)
programmatically through its port interface. This is an experimental project for demonstrating control of IGV-Webapp
using MCP from a desktop client, specifically Claude Desktop.

## Prerequisites

- **Node.js** 18 or higher
- **IGV** running with port command listener enabled (default port: 60151)

## Installation

To install the MCP server as a Claude Desktop extension select "Settings" -> "Extensions" -> "Advanced Settings" ->
"Install Extension" and select the `igvweb.mcpb` file from this repository root. Note that currently Claude Desktop
runs extensions in a non-sandboxed mode, so it will have full access to your system. Claude will warn you about this.

## Development

Clone this repository and install dependencies:

```bash
npm install
```

To run in development mode with the MCP inspector:

```bash
npx @modelcontextprotocol/inspector node src/main.js
```

To build a production version:

```bash
npm run build
```

This will build a bundled `igv-mcp.js` file in the `dist` folder, as well as a Claude 'mcpb' package in the root folder.

## Usage

### Example MCP Client Configuration

The easiest way to configure the client is to add the 'igvweb.mcpb' as an extension to Claude or your client of
choice. To manually configure a client add the following to the client configuration json. See the client documentation
for more details. The --port must match the port setting in IGV. IGV must be running with port listener enabled. To
enable the port listener in IGV, go to `View` -> `Preferences` -> `Advanced` -> and ensure the port option is checked.

```json
{
  "mcpServers": {
    "igv": {
      "command": "node",
      "args": [
        "<oath to>dist/igv-mcp.js",
        "port",
        "60151"
      ]
    }
  }
}
```

For development, the `dist/igv-mcp.js` bundle can be replaced with`src/main.js`,
but dependencies must be installed. 

### Running the Server

Normally the server will be started by an MCP client, but you can also start it manually for testing or other purposes

```bash
# Default (connects to IGV at 127.0.0.1:60151)
npm start

# Specify custom IGV host/port
node src/main.js --host 127.0.0.1:60151

# Or with a different host
node src/main.js --host 192.168.1.100:60151
```

## Available Tools

The server provides 23 tools for controlling IGV.

#### Session Management

- `new` - Reset IGV to a clean state by unloading all data tracks
- `saveSession` - Save the current IGV session

#### Genome & Data Loading

- `genome` - Load a reference genome by ID (e.g., hg38, mm10) or file path
- `load` - Load data files (BAM, SAM, VCF, etc.)

#### Navigation & View Control

- `goto` - Navigate to a genomic locus
- `zoomin` - Zoom in the view
- `zoomout` - Zoom out the view

#### Track Visualization

- `collapse` - Collapse track to compact representation
- `squish` - Squish track by reducing row height
- `expand` - Expand track by increasing row height
- `setColor` - Set the primary display color for tracks

#### Region of Interest

- `region` - Define a region of interest

#### Alignment Track Organization

- `group` - Group alignment reads by properties
- `sort` - Sort reads by various criteria
- `viewAsPairs` - Toggle paired-end read visualization mode

#### Sequence Track

- `setSequenceStrand` - Set which DNA strand to display
- `setSequenceShowTranslation` - Toggle translation display

#### Track Overlay

- `overlay` - Combine multiple wig tracks into a single overlaid track
- `separate` - Separate an overlaid wig track into component tracks

#### Snapshots

- `snapshot` - Capture a snapshot image of the current IGV view
- `snapshotDirectory` - Set the directory where snapshots will be saved
- `maxPanelHeight` - Set maximum height for track panels in snapshots
