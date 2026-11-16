import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: ['.next/**', 'node_modules/**', 'src/generated/**', 'next-env.d.ts', 'public/**'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Demo data keeps named handles for readability.
    files: ['prisma/seed.ts'],
    rules: { '@typescript-eslint/no-unused-vars': 'off' },
  },
  {
    // The smoke test is a plain Node script.
    files: ['tests/**/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
];

export default config;
