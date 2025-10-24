import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
    input: 'src/mcp.js',
    output: {
        file: 'dist/mcp.js',
        format: 'esm'
    },
    plugins: [
        resolve(),
        commonjs(),
        json()
    ]
};

