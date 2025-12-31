/*eslint-env node */

module.exports = {
    extends: ['eslint:recommended', 'prettier'],
    parserOptions: {
        project: null,
    },
    rules: {
        'prettier/prettier': 'error',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-require-imports': 'off',
        'agrid-js/no-direct-null-check': 'off',
        'agrid-js/no-direct-boolean-check': 'off',
    },
    env: {
        node: true,
    },
    overrides: [],
}
