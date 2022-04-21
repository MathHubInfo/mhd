module.exports = {
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    extends: ["next/core-web-vitals"],
    rules: {
        "quotes": ["error", "double", { avoidEscape: true }],
        "jsx-quotes": ["error", "prefer-double"],
        "no-multi-spaces": ["error"],
        "object-curly-spacing": ["error", "always"],
        "object-curly-newline": ["error", { ImportDeclaration: "never", ExportDeclaration: "never" }],
        "quote-props": ["error", "consistent-as-needed"],
        "comma-dangle": ["error", "always-multiline"],
        "semi": ["error", "never"],
        "no-unused-vars": ["error", { varsIgnorePattern: "^_", args: "none", ignoreRestSiblings: true, vars: "all" }],
        "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports", disallowTypeAnnotations: true }],
    },
}
