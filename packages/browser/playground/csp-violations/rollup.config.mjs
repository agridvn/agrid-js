import 'dotenv/config'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'

const prod = process.env.NODE_ENV === 'production'

export default {
    input: {
        agrid: 'src/agrid.js',
        main: 'src/main.js',
    },
    output: {
        dir: 'dist',
        sourcemap: !prod,
    },
    plugins: [
        replace({
            preventAssignment: true,
            'process.env.AGRID_TOKEN': JSON.stringify(process.env.AGRID_TOKEN),
            'process.env.AGRID_API_HOST': JSON.stringify(process.env.AGRID_API_HOST),
            'process.env.AGRID_UI_HOST': JSON.stringify(process.env.AGRID_UI_HOST),
        }),
        resolve(),
        commonjs(),
    ],
}
