import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'data/'] },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    // Express error middleware needs all four arguments, so allow unused ones prefixed with _.
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
