import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = fileURLToPath(new URL('.', import.meta.url));

export default {
  configFile: false,
  plugins: [react()],
  root: frontendRoot,
  resolve: {
    alias: {
      '@': path.resolve(frontendRoot, 'src'),
    },
  },
};
