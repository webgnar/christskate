export default {
  root: 'src',
  base: '/',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.js')) {
            return 'assets/[name]-[hash][extname]';
          }
          return 'assets/textures/[name][extname]';
        }
      }
    }
  },
  server: {
    open: true
  }
} 