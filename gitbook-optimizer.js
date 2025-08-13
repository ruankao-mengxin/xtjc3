// GitBook Universal Optimizer - 通用优化脚本
(function() {
    'use strict';
    
    // 检查是否已经初始化过
    if (window.GitBookOptimizerInitialized) {
        return;
    }
    window.GitBookOptimizerInitialized = true;
    
    // 添加优化样式
    function addOptimizationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* 页面切换加载动画 */
            .page-loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(250, 250, 250, 0.95);
                z-index: 9999;
                display: none;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                transition: opacity 0.3s ease-out;
            }
            
            .page-loading-overlay.show {
                display: flex;
            }
            
            .page-loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #e3e3e3;
                border-top: 3px solid #008cff;
                border-radius: 50%;
                animation: page-spin 1s linear infinite;
                margin-bottom: 15px;
            }
            
            @keyframes page-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .page-loading-text {
                color: #666;
                font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                font-size: 14px;
            }
            
            /* 链接点击效果 */
            .book-summary a, .navigation a {
                transition: opacity 0.2s ease;
            }
            
            .book-summary a:active, .navigation a:active {
                opacity: 0.7;
            }
            
            /* 网络状态指示器 */
            .network-status {
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 6px 10px;
                border-radius: 3px;
                font-size: 11px;
                z-index: 10000;
                transition: all 0.3s ease;
                display: none;
            }
            
            .network-status.online {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            
            .network-status.offline {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            
            .network-status.slow {
                background: #fff3cd;
                color: #856404;
                border: 1px solid #ffeaa7;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 创建页面加载覆盖层
    function createPageLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'page-loading-overlay';
        overlay.className = 'page-loading-overlay';
        overlay.innerHTML = `
            <div class="page-loading-spinner"></div>
            <div class="page-loading-text">正在加载页面...</div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }
    
    // 创建网络状态指示器
    function createNetworkStatus() {
        const status = document.createElement('div');
        status.id = 'network-status';
        status.className = 'network-status';
        document.body.appendChild(status);
        return status;
    }
    
    // 显示页面加载动画
    function showPageLoading() {
        const overlay = document.getElementById('page-loading-overlay') || createPageLoadingOverlay();
        overlay.classList.add('show');
        return overlay;
    }
    
    // 隐藏页面加载动画
    function hidePageLoading() {
        const overlay = document.getElementById('page-loading-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }
    
    // 拦截链接点击
    function interceptLinkClicks() {
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a[href]');
            if (!link) return;
            
            const href = link.getAttribute('href');
            
            // 只处理内部链接
            if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('#')) {
                // 显示加载动画
                showPageLoading();
                
                // 添加一个小延迟以确保动画显示
                setTimeout(() => {
                    window.location.href = href;
                }, 50);
                
                e.preventDefault();
                return false;
            }
        });
    }
    
    // 网络状态监控
    function setupNetworkMonitoring() {
        const networkStatus = document.getElementById('network-status') || createNetworkStatus();
        
        function updateNetworkStatus() {
            if (!navigator.onLine) {
                showNetworkStatus('离线状态', 'offline');
            } else {
                // 简单的网络速度检测
                const startTime = Date.now();
                fetch('gitbook/style.css', { method: 'HEAD', cache: 'no-cache' })
                    .then(() => {
                        const loadTime = Date.now() - startTime;
                        if (loadTime > 3000) {
                            showNetworkStatus('网络较慢', 'slow');
                        } else {
                            hideNetworkStatus();
                        }
                    })
                    .catch(() => {
                        showNetworkStatus('网络连接异常', 'offline');
                    });
            }
        }
        
        function showNetworkStatus(message, type) {
            networkStatus.textContent = message;
            networkStatus.className = 'network-status ' + type;
            networkStatus.style.display = 'block';
        }
        
        function hideNetworkStatus() {
            networkStatus.style.display = 'none';
        }
        
        // 监听网络状态变化
        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);
        
        // 初始检测
        setTimeout(updateNetworkStatus, 1000);
    }
    
    // Service Worker 注册
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration.scope);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }
    
    // 页面性能监控
    function monitorPagePerformance() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                if ('performance' in window) {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                        const loadTime = perfData.loadEventEnd - perfData.fetchStart;
                        console.log('Page load time:', loadTime + 'ms');
                    }
                }
            }, 0);
        });
    }
    
    // 预加载链接
    function setupLinkPrefetch() {
        const prefetched = new Set();
        
        document.addEventListener('mouseover', function(e) {
            const link = e.target.closest('a[href]');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('mailto:') && 
                !href.startsWith('#') && !prefetched.has(href)) {
                
                const prefetchLink = document.createElement('link');
                prefetchLink.rel = 'prefetch';
                prefetchLink.href = href;
                document.head.appendChild(prefetchLink);
                prefetched.add(href);
            }
        });
    }
    
    // 初始化所有优化功能
    function initializeOptimizations() {
        addOptimizationStyles();
        interceptLinkClicks();
        setupNetworkMonitoring();
        registerServiceWorker();
        monitorPagePerformance();
        setupLinkPrefetch();
        
        // 页面加载完成后隐藏加载动画
        window.addEventListener('load', () => {
            setTimeout(hidePageLoading, 300);
        });
        
        // 如果页面已经加载完成
        if (document.readyState === 'complete') {
            setTimeout(hidePageLoading, 300);
        }
    }
    
    // 页面卸载时显示加载动画
    window.addEventListener('beforeunload', () => {
        showPageLoading();
    });
    
    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeOptimizations);
    } else {
        initializeOptimizations();
    }
    
})();
