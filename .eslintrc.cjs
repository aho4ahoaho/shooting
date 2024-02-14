module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react/recommended",
    ],
    overrides: [
        {
            env: {
                node: true,
            },
            files: [".eslintrc.{js,cjs}"],
            parserOptions: {
                sourceType: "script",
            },
        },
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
    },
    plugins: ["@typescript-eslint", "react"],
    rules: {
        "@typescript-eslint/no-floating-promises": "off",
        "prefer-const": "off",
        "no-useless-escape": "off",
        "react/react-in-jsx-scope": "off",
    },
    ignorePatterns: ["node_modules", "dist", "vite.config.ts", ".eslintrc.cjs"],
};
