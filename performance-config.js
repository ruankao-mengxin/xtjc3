// GitBook Performance Configuration
window.GitBookPerformanceConfig = {
    // 缓存配置
    cache: {
        version: '1.0.0',
        staticCacheName: 'gitbook-static-v1',
        dynamicCacheName: 'gitbook-dynamic-v1',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
        maxEntries: 100
    },
    
    // 加载配置
    loading: {
        showProgress: true,
        showNetworkStatus: true,
        progressUpdateInterval: 200,
        minimumLoadingTime: 1000, // 最小显示时间
        tips: [
            '正在初始化页面资源',
            '正在加载样式文件',
            '正在加载脚本文件',
            '正在渲染页面内容',
            '即将完成加载'
        ]
    },
    
    // 图片懒加载配置
    lazyLoading: {
        enabled: true,
        rootMargin: '50px 0px',
        threshold: 0.01,
        placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNGNUY1RjUiLz48L3N2Zz4='
    },
    
    // 预加载配置
    preloading: {
        enabled: true,
        hoverDelay: 100, // 鼠标悬停延迟
        criticalResources: [
            './gitbook/gitbook-plugin-search/search-engine.js',
            './gitbook/gitbook-plugin-lunr/lunr.min.js',
            './search_index.json'
        ]
    },
    
    // 网络监控配置
    network: {
        enabled: true,
        checkInterval: 30000, // 30秒检查一次
        timeoutThreshold: 3000, // 3秒超时认为网络慢
        retryAttempts: 3,
        retryDelay: 1000
    },
    
    // 性能监控配置
    performance: {
        enabled: true,
        reportToConsole: true,
        reportToAnalytics: false,
        analyticsEndpoint: null,
        metrics: {
            lcp: true, // Largest Contentful Paint
            fid: true, // First Input Delay
            cls: true, // Cumulative Layout Shift
            fcp: true, // First Contentful Paint
            ttfb: true // Time to First Byte
        }
    },
    
    // 错误处理配置
    errorHandling: {
        enabled: true,
        showUserFriendlyMessages: true,
        logToConsole: true,
        retryFailedRequests: true
    },
    
    // 离线支持配置
    offline: {
        enabled: true,
        showOfflineMessage: true,
        offlinePages: ['./index.html'],
        fallbackPage: './index.html'
    },
    
    // 压缩配置
    compression: {
        enabled: true,
        gzip: true,
        brotli: true
    },
    
    // 字体优化配置
    fonts: {
        preload: true,
        display: 'swap',
        fallbacks: {
            'FontAwesome': 'Arial, sans-serif'
        }
    },
    
    // CSS优化配置
    css: {
        critical: true,
        defer: true,
        minify: true
    },
    
    // JavaScript优化配置
    javascript: {
        defer: true,
        async: false,
        minify: true,
        splitChunks: false
    },
    
    // 图片优化配置
    images: {
        lazyLoad: true,
        webp: true,
        responsive: true,
        placeholder: true,
        quality: 85
    },
    
    // 缓存策略配置
    cacheStrategies: {
        html: 'networkFirst',
        css: 'cacheFirst',
        js: 'cacheFirst',
        images: 'cacheFirst',
        fonts: 'cacheFirst',
        api: 'networkFirst'
    },
    
    // 用户体验配置
    ux: {
        smoothScrolling: true,
        focusManagement: true,
        keyboardNavigation: true,
        touchGestures: true
    },
    
    // 调试配置
    debug: {
        enabled: false,
        verbose: false,
        showCacheInfo: false,
        showPerformanceMetrics: false
    }
};

// 配置验证和初始化
(function() {
    'use strict';
    
    const config = window.GitBookPerformanceConfig;
    
    // 验证配置
    function validateConfig() {
        if (!config.cache.version) {
            console.warn('Performance Config: Cache version not specified');
        }
        
        if (config.performance.reportToAnalytics && !config.performance.analyticsEndpoint) {
            console.warn('Performance Config: Analytics enabled but no endpoint specified');
        }
        
        return true;
    }
    
    // 应用配置
    function applyConfig() {
        // 设置字体显示策略
        if (config.fonts.preload) {
            const fontLinks = document.querySelectorAll('link[href*="font"]');
            fontLinks.forEach(link => {
                link.setAttribute('rel', 'preload');
                link.setAttribute('as', 'font');
                link.setAttribute('crossorigin', 'anonymous');
            });
        }
        
        // 设置CSS加载策略
        if (config.css.defer) {
            const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
            cssLinks.forEach((link, index) => {
                if (index > 0) { // 保留第一个CSS文件同步加载
                    link.setAttribute('media', 'print');
                    link.setAttribute('onload', "this.media='all'");
                }
            });
        }
        
        // 设置图片懒加载属性
        if (config.images.lazyLoad) {
            const images = document.querySelectorAll('img[src]');
            images.forEach(img => {
                const src = img.getAttribute('src');
                img.setAttribute('data-src', src);
                img.setAttribute('src', config.lazyLoading.placeholder);
                img.classList.add('lazy');
            });
        }
    }
    
    // 初始化配置
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (validateConfig()) {
                applyConfig();
            }
        });
    } else {
        if (validateConfig()) {
            applyConfig();
        }
    }
    
})();
