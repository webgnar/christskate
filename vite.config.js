export default {
  root: 'src',
  base: '/',
  build: {
    outDir: '../dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]'  // Keep original filenames
      }
    }
  },
  server: {
    open: true
  }
} 