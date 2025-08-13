// Service Worker for GitBook Performance Optimization
const CACHE_NAME = 'gitbook-cache-v1';
const STATIC_CACHE = 'gitbook-static-v1';
const DYNAMIC_CACHE = 'gitbook-dynamic-v1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
    './',
    './index.html',
    './gitbook/style.css',
    './gitbook/gitbook.js',
    './gitbook/theme.js',
    './gitbook/images/favicon.ico',
    './gitbook/fonts/fontawesome/fontawesome-webfont.woff2',
    './gitbook/gitbook-plugin-search/search.css',
    './gitbook/gitbook-plugin-fontsettings/website.css'
];

// 需要网络优先的资源
const NETWORK_FIRST = [
    './search_index.json'
];

// 缓存优先的资源模式
const CACHE_FIRST_PATTERNS = [
    /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
    /\.(?:css|js)$/,
    /\.(?:woff|woff2|ttf|eot)$/
];

// 安装事件 - 预缓存静态资源
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Static assets cached');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Failed to cache static assets', error);
            })
    );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// 拦截请求
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // 只处理同源请求
    if (url.origin !== location.origin) {
        return;
    }
    
    // 网络优先策略
    if (NETWORK_FIRST.some(pattern => request.url.includes(pattern))) {
        event.respondWith(networkFirst(request));
        return;
    }
    
    // 缓存优先策略
    if (CACHE_FIRST_PATTERNS.some(pattern => pattern.test(request.url))) {
        event.respondWith(cacheFirst(request));
        return;
    }
    
    // HTML 文件使用网络优先，回退到缓存
    if (request.headers.get('accept').includes('text/html')) {
        event.respondWith(networkFirst(request));
        return;
    }
    
    // 默认策略：缓存优先
    event.respondWith(cacheFirst(request));
});

// 缓存优先策略
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('Service Worker: Serving from cache', request.url);
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        
        // 缓存成功的响应
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
            console.log('Service Worker: Cached new resource', request.url);
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Service Worker: Cache first failed', error);
        
        // 如果是HTML请求，返回离线页面
        if (request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
        }
        
        throw error;
    }
}

// 网络优先策略
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // 缓存成功的响应
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
            console.log('Service Worker: Updated cache from network', request.url);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Network failed, trying cache', request.url);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// 消息处理
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_CACHE_SIZE') {
        getCacheSize().then(size => {
            event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
        });
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        clearCache().then(() => {
            event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
        });
    }
});

// 获取缓存大小
async function getCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
            }
        }
    }
    
    return totalSize;
}

// 清理缓存
async function clearCache() {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
}

// 后台同步
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    console.log('Service Worker: Background sync triggered');
    // 这里可以添加后台同步逻辑
}
