// eslint.config.js
import js from '@eslint/js';
import * as tseslint from 'typescript-eslint';

export default [
  // Apply ignores to all files
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.mastra/**',
      '**/*.min.js',
      '**/vendor/**'
    ]
  },

  // Include JavaScript recommended rules
  js.configs.recommended,

  // Explicitly configure for your TypeScript source files
  {
    // Target your source files
    files: ['src/mastra/**/*.ts', 'src/**/*.js', 'src/**/*.tsx', 'src/**/*.jsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        // Add browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        // Add Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        // Add other globals
        AbortController: 'readonly',
        TextEncoder: 'readonly',
        ReadableStream: 'readonly',
        TransformStream: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        structuredClone: 'readonly',
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin
    },
    rules: {
      // Basic rules that are good to have
      'no-console': 'warn',
      'no-unused-vars': 'warn',
      'prefer-const': 'warn',
      'no-undef': 'error',
      // Disable some rules that might be too strict for your project
      'no-useless-escape': 'warn',
      'no-prototype-builtins': 'warn',
      // Add more rules as needed
    },
  }
];
