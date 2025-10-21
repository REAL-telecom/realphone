import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import { checker } from 'vite-plugin-checker';
import readableClassnames from 'vite-plugin-readable-classnames';
import sassDts from 'vite-plugin-sass-dts';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  base: 'realphone',
  plugins: [
    checker({
      typescript: true,
    }),
    react(),
    readableClassnames(),
    sassDts({
      enabledMode: ['development'],
      esmExport: true,
    }),
    tsconfigPaths(),
  ],
  server: {
    open: true,
  },
});
