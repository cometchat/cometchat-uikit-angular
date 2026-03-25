# Storybook Performance Optimizations

This document describes the performance optimizations implemented for the CometChat Angular V5 UIKit Storybook.

## Implemented Optimizations

### 1. Code Splitting

**Location**: `.storybook/main.ts` - `webpackFinal` configuration

The Webpack configuration has been optimized to split code into multiple chunks for better caching and faster load times:

#### Vendor Chunk
- **Purpose**: Separates third-party dependencies from application code
- **Benefit**: Vendor code changes less frequently, so it can be cached longer
- **Configuration**: All `node_modules` are bundled into a `vendors` chunk

#### Story Category Chunks
- **Base Elements**: Stories from `base-elements/` directory are bundled separately
- **Components**: Stories from `components/` directory are bundled separately
- **Benefit**: Users only load the stories they're viewing, reducing initial load time

#### Common Chunk
- **Purpose**: Extracts code shared across multiple stories
- **Configuration**: Code used in 2+ stories is extracted to a common chunk
- **Benefit**: Reduces duplication and improves caching

#### Runtime Chunk
- **Purpose**: Separates Webpack runtime code
- **Benefit**: Improves long-term caching as runtime rarely changes

### 2. Filesystem Caching

**Location**: `.storybook/main.ts` - `webpackFinal` configuration

Webpack filesystem caching has been enabled to speed up rebuilds:

- **Cache Type**: Filesystem-based persistent cache
- **Cache Location**: `node_modules/.cache/storybook`
- **Benefit**: Subsequent builds are significantly faster (up to 10x)
- **Build Dependencies**: Cache is invalidated when configuration changes

### 3. Performance Testing Script

**Location**: `scripts/storybook-performance.js`

A comprehensive performance testing script has been created to measure and monitor Storybook performance:

#### Metrics Measured
1. **Build Time**: Total time to build Storybook
2. **Bundle Size**: Total size of generated files
3. **Chunk Analysis**: Number and size of code chunks
4. **Story File Analysis**: Identifies potentially complex stories

#### Usage
```bash
npm run storybook:perf
```

#### Output
The script provides:
- Build time measurement
- Total file count and size
- List of largest files
- Chunk file analysis
- Story file complexity analysis
- Performance recommendations

## Performance Results

Based on the initial performance test:

- **Build Time**: ~26 seconds (acceptable)
- **Total Files**: 348
- **Total Size**: 19.17 MB
- **Chunk Files**: 32 (code splitting enabled)
- **Story Files**: 19

### Recommendations Status
✓ Build time is acceptable  
✓ Total size is reasonable  
✓ Code splitting is enabled  

## Future Optimizations

Potential areas for further optimization:

1. **Lazy Loading**: Implement dynamic imports for large components
2. **Image Optimization**: Compress and optimize asset files
3. **Tree Shaking**: Ensure unused code is eliminated
4. **Preloading**: Implement strategic preloading for frequently accessed stories
5. **Service Worker**: Add service worker for offline support and faster repeat visits

## Monitoring

To monitor performance over time:

1. Run `npm run storybook:perf` regularly
2. Compare build times and bundle sizes
3. Watch for increases in chunk sizes
4. Monitor largest story files for complexity

## Best Practices

When adding new stories:

1. Keep story files focused and minimal
2. Use mock data factories instead of inline data
3. Avoid importing large dependencies unnecessarily
4. Use lazy loading for heavy components
5. Test performance impact with `npm run storybook:perf`

## Configuration Reference

### Webpack Split Chunks Configuration

```typescript
splitChunks: {
  chunks: 'all',
  cacheGroups: {
    vendor: {
      test: /[\\/]node_modules[\\/]/,
      name: 'vendors',
      priority: 10,
      reuseExistingChunk: true,
    },
    baseElements: {
      test: /[\\/]base-elements[\\/].*\.stories\./,
      name: 'stories-base-elements',
      priority: 5,
      reuseExistingChunk: true,
    },
    components: {
      test: /[\\/]components[\\/].*\.stories\./,
      name: 'stories-components',
      priority: 5,
      reuseExistingChunk: true,
    },
    common: {
      minChunks: 2,
      priority: 3,
      reuseExistingChunk: true,
    },
  },
}
```

### Cache Configuration

```typescript
cache: {
  type: 'filesystem',
  buildDependencies: {
    config: [__filename],
  },
  cacheDirectory: path.resolve(__dirname, '../node_modules/.cache/storybook'),
}
```

## Troubleshooting

### Slow Build Times

If build times increase:
1. Clear the cache: `rm -rf node_modules/.cache/storybook`
2. Check for large story files
3. Review recent changes to dependencies
4. Run performance test to identify bottlenecks

### Large Bundle Sizes

If bundle sizes grow:
1. Analyze chunk files with performance script
2. Check for duplicate dependencies
3. Review imports in story files
4. Consider lazy loading for large components

### Cache Issues

If experiencing cache-related issues:
1. Clear the cache directory
2. Rebuild Storybook
3. Check that cache configuration is correct
4. Verify filesystem permissions

## Related Documentation

- [Webpack Code Splitting](https://webpack.js.org/guides/code-splitting/)
- [Webpack Caching](https://webpack.js.org/guides/caching/)
- [Storybook Performance](https://storybook.js.org/docs/angular/configure/performance)
