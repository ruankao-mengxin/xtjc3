// Network Optimization and Error Handling for GitBook
(function() {
    'use strict';
    
    // 网络优化器
    window.NetworkOptimizer = {
        config: null,
        retryQueue: [],
        connectionType: 'unknown',
        isOnline: navigator.onLine,
        
        init: function(config) {
            this.config = config || window.GitBookPerformanceConfig?.network || {};
            this.setupNetworkMonitoring();
            this.setupConnectionTypeDetection();
            this.setupRetryMechanism();
            this.patchFetch();
        },
        
        // 网络状态监控
        setupNetworkMonitoring: function() {
            const self = this;
            
            window.addEventListener('online', () => {
                self.isOnline = true;
                self.handleOnline();
            });
            
            window.addEventListener('offline', () => {
                self.isOnline = false;
                self.handleOffline();
            });
            
            // 定期检查网络质量
            if (this.config.checkInterval) {
                setInterval(() => {
                    this.checkNetworkQuality();
                }, this.config.checkInterval);
            }
        },
        
        // 连接类型检测
        setupConnectionTypeDetection: function() {
            if ('connection' in navigator) {
                const connection = navigator.connection;
                this.connectionType = connection.effectiveType || 'unknown';
                
                connection.addEventListener('change', () => {
                    this.connectionType = connection.effectiveType;
                    this.handleConnectionChange();
                });
            }
        },
        
        // 重试机制
        setupRetryMechanism: function() {
            this.retryQueue = [];
        },
        
        // 增强 fetch 函数
        patchFetch: function() {
            const originalFetch = window.fetch;
            const self = this;
            
            window.fetch = function(url, options = {}) {
                return self.enhancedFetch(url, options, originalFetch);
            };
        },
        
        // 增强的 fetch 函数
        enhancedFetch: async function(url, options, originalFetch) {
            const maxRetries = this.config.retryAttempts || 3;
            const retryDelay = this.config.retryDelay || 1000;
            
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    // 添加超时控制
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Request timeout')), 
                                 this.config.timeoutThreshold || 10000);
                    });
                    
                    const fetchPromise = originalFetch(url, {
                        ...options,
                        headers: {
                            ...options.headers,
                            'Cache-Control': this.getCacheControl(),
                        }
                    });
                    
                    const response = await Promise.race([fetchPromise, timeoutPromise]);
                    
                    if (response.ok) {
                        return response;
                    } else if (response.status >= 500 && attempt < maxRetries) {
                        // 服务器错误，重试
                        await this.delay(retryDelay * Math.pow(2, attempt));
                        continue;
                    } else {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    if (attempt === maxRetries) {
                        this.handleFetchError(url, error);
                        throw error;
                    }
                    
                    // 网络错误，等待后重试
                    await this.delay(retryDelay * Math.pow(2, attempt));
                }
            }
        },
        
        // 获取缓存控制策略
        getCacheControl: function() {
            switch (this.connectionType) {
                case 'slow-2g':
                case '2g':
                    return 'max-age=3600'; // 1小时
                case '3g':
                    return 'max-age=1800'; // 30分钟
                case '4g':
                default:
                    return 'max-age=300'; // 5分钟
            }
        },
        
        // 检查网络质量
        checkNetworkQuality: async function() {
            if (!this.isOnline) return;
            
            try {
                const startTime = Date.now();
                const response = await fetch('./gitbook/style.css', { 
                    method: 'HEAD', 
                    cache: 'no-cache' 
                });
                const endTime = Date.now();
                const latency = endTime - startTime;
                
                this.updateNetworkStatus(latency, response.ok);
            } catch (error) {
                this.updateNetworkStatus(null, false);
            }
        },
        
        // 更新网络状态
        updateNetworkStatus: function(latency, isSuccessful) {
            const statusElement = document.getElementById('network-status');
            if (!statusElement) return;
            
            if (!isSuccessful) {
                this.showNetworkStatus('网络连接异常', 'offline');
            } else if (latency > this.config.timeoutThreshold) {
                this.showNetworkStatus('网络较慢', 'slow');
            } else {
                this.hideNetworkStatus();
            }
        },
        
        // 显示网络状态
        showNetworkStatus: function(message, type) {
            const statusElement = document.getElementById('network-status');
            if (statusElement) {
                statusElement.textContent = message;
                statusElement.className = 'network-status ' + type;
                statusElement.style.display = 'block';
            }
        },
        
        // 隐藏网络状态
        hideNetworkStatus: function() {
            const statusElement = document.getElementById('network-status');
            if (statusElement) {
                statusElement.style.display = 'none';
            }
        },
        
        // 处理上线事件
        handleOnline: function() {
            console.log('Network: Back online');
            this.hideNetworkStatus();
            this.processRetryQueue();
        },
        
        // 处理离线事件
        handleOffline: function() {
            console.log('Network: Gone offline');
            this.showNetworkStatus('离线状态', 'offline');
        },
        
        // 处理连接变化
        handleConnectionChange: function() {
            console.log('Network: Connection type changed to', this.connectionType);
            
            // 根据连接类型调整策略
            if (this.connectionType === 'slow-2g' || this.connectionType === '2g') {
                this.enableDataSavingMode();
            } else {
                this.disableDataSavingMode();
            }
        },
        
        // 启用数据节省模式
        enableDataSavingMode: function() {
            console.log('Network: Enabling data saving mode');
            
            // 禁用非关键资源的预加载
            const preloadLinks = document.querySelectorAll('link[rel="preload"]');
            preloadLinks.forEach(link => {
                if (!link.href.includes('style.css') && !link.href.includes('gitbook.js')) {
                    link.remove();
                }
            });
            
            // 降低图片质量
            const images = document.querySelectorAll('img');
            images.forEach(img => {
                if (img.src && !img.dataset.originalSrc) {
                    img.dataset.originalSrc = img.src;
                    // 这里可以替换为低质量版本的图片
                }
            });
        },
        
        // 禁用数据节省模式
        disableDataSavingMode: function() {
            console.log('Network: Disabling data saving mode');
            
            // 恢复原始图片
            const images = document.querySelectorAll('img[data-original-src]');
            images.forEach(img => {
                img.src = img.dataset.originalSrc;
                delete img.dataset.originalSrc;
            });
        },
        
        // 处理 fetch 错误
        handleFetchError: function(url, error) {
            console.error('Network: Fetch failed for', url, error);
            
            // 添加到重试队列
            this.retryQueue.push({ url, error, timestamp: Date.now() });
            
            // 显示用户友好的错误信息
            this.showUserFriendlyError(error);
        },
        
        // 显示用户友好的错误信息
        showUserFriendlyError: function(error) {
            const errorElement = this.createErrorElement();
            errorElement.textContent = this.getErrorMessage(error);
            document.body.appendChild(errorElement);
            
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.parentNode.removeChild(errorElement);
                }
            }, 5000);
        },
        
        // 创建错误元素
        createErrorElement: function() {
            const element = document.createElement('div');
            element.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: #f8d7da;
                color: #721c24;
                padding: 12px 20px;
                border-radius: 4px;
                border: 1px solid #f5c6cb;
                z-index: 10001;
                font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                font-size: 14px;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            return element;
        },
        
        // 获取错误信息
        getErrorMessage: function(error) {
            if (error.message.includes('timeout')) {
                return '⏱️ 网络响应超时，请检查网络连接';
            } else if (error.message.includes('Failed to fetch')) {
                return '🌐 网络连接失败，请稍后重试';
            } else if (error.message.includes('500')) {
                return '🔧 服务器暂时不可用，正在重试';
            } else {
                return '❌ 加载失败，请刷新页面重试';
            }
        },
        
        // 处理重试队列
        processRetryQueue: function() {
            if (this.retryQueue.length === 0) return;
            
            console.log('Network: Processing retry queue, items:', this.retryQueue.length);
            
            const itemsToRetry = [...this.retryQueue];
            this.retryQueue = [];
            
            itemsToRetry.forEach(async (item) => {
                try {
                    await fetch(item.url);
                    console.log('Network: Retry successful for', item.url);
                } catch (error) {
                    console.log('Network: Retry failed for', item.url);
                    // 可以选择重新加入队列或放弃
                }
            });
        },
        
        // 延迟函数
        delay: function(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    };
    
    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            NetworkOptimizer.init();
        });
    } else {
        NetworkOptimizer.init();
    }
    
})();
