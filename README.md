# IGV MCP Server

A Model Context Protocol (MCP) server for controlling [IGV (Integrative Genomics Viewer)](https://software.broadinstitute.org/software/igv/) via socket commands.

## Overview

This server allows AI assistants and other MCP clients to programmatically control IGV.

## Prerequisites

- **Node.js** 18 or higher
- **IGV** running with port command listener enabled (default port: 60151)

## Installation

```bash
npm install
```

To build a production version:

```bash
npm run build
```
This will build a bundled `mcp.js` file, as well as a Claude 'mcpb' package, in the `dist` folder.

## Usage

### Example MCP Client Configuration

Add to your MCP client settings (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "igv": {
      "command": "node",
      "args": [
        "<path to>mcp.js",
        "--host",
        "127.0.0.1:60151"
      ]
    }
  }
}
```
Replace `<path to>` with the actual path to the `mcp.js` file in your installation.  For development, you can use `src/mcp.js`
but node_modules must be installed.   For production use `dist/mcp.js` which contains all dependencies bundled.

### Running the Server

Normally the server will be started by an MCP client, but you can also start it manually for testing or other purposes

```bash
# Default (connects to IGV at 127.0.0.1:60151)
npm start

# Specify custom IGV host/port
node src/mcp.js --host 127.0.0.1:60151

# Or with a different host
node src/mcp.js --host 192.168.1.100:60151
```

## Available Tools

The server provides 23 tools for controlling IGV.

### Session Management
- `new` - Reset IGV to a clean state by unloading all data tracks
- `saveSession` - Save the current IGV session

### Genome & Data Loading
- `genome` - Load a reference genome by ID (e.g., hg38, mm10) or file path
- `load` - Load data files (BAM, SAM, VCF, etc.)

### Navigation & View Control
- `goto` - Navigate to a genomic locus
- `zoomin` - Zoom in the view
- `zoomout` - Zoom out the view

### Track Visualization
- `collapse` - Collapse track to compact representation
- `squish` - Squish track by reducing row height
- `expand` - Expand track by increasing row height
- `setColor` - Set the primary display color for tracks

### Region of Interest
- `region` - Define a region of interest

### Alignment Track Organization
- `group` - Group alignment reads by properties
- `sort` - Sort reads by various criteria
- `viewAsPairs` - Toggle paired-end read visualization mode

### Sequence Track
- `setSequenceStrand` - Set which DNA strand to display
- `setSequenceShowTranslation` - Toggle translation display

### Track Overlay
- `overlay` - Combine multiple wig tracks into a single overlaid track
- `separate` - Separate an overlaid wig track into component tracks

### Snapshots
- `snapshot` - Capture a snapshot image of the current IGV view
- `snapshotDirectory` - Set the directory where snapshots will be saved
- `maxPanelHeight` - Set maximum height for track panels in snapshots



