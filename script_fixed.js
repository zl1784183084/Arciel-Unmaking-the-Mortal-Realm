// 网站配置
const CONFIG = {
    contentFile: 'website-content.txt',
    defaultLanguage: 'cn'
};

// 从txt文件加载的文本内容
let textContent = {
    cn: {},
    en: {}
};

// 全局状态
let currentLanguage = CONFIG.defaultLanguage;
let websiteContent = {
    resources: [],
    titles: {},
    descriptions: {}
};

// DOM元素
const languagePage = document.getElementById('language-page');
const mainContent = document.getElementById('main-content');
const chineseBtn = document.getElementById('chinese-btn');
const englishBtn = document.getElementById('english-btn');
const latestProgressBtn = document.getElementById('latest-progress-btn');
const resourcesContainer = document.getElementById('resources-container');
const videoModal = document.getElementById('video-modal');
const modalVideo = document.getElementById('modal-video');
const videoTitle = document.getElementById('video-title');
const closeModal = document.querySelector('.close-modal');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initLanguageSelection();
    initEventListeners();
});

// 初始化语言选择
function initLanguageSelection() {
    // 注释掉自动跳转，让用户必须手动选择语言
    // const savedLanguage = localStorage.getItem('websiteLanguage');
    // if (savedLanguage) {
    //     currentLanguage = savedLanguage;
    //     showMainContent();
    // }
    
    chineseBtn.addEventListener('click', () => selectLanguage('cn'));
    englishBtn.addEventListener('click', () => selectLanguage('en'));
}

// 选择语言
function selectLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('websiteLanguage', lang);
    
    // 显示加载状态
    showLoadingState();
    
    // 开始预加载资源
    preloadResources().then(() => {
        // 资源加载完成后显示主内容
        showMainContent();
    }).catch((error) => {
        console.error('资源预加载失败:', error);
        // 即使预加载失败，也显示主内容
        showMainContent();
    });
}

// 显示加载状态
function showLoadingState() {
    const languageButtons = document.querySelector('.language-buttons');
    const languageTitle = document.querySelector('.language-title-text');
    
    if (languageButtons && languageTitle) {
        languageButtons.style.display = 'none';
        
        // 根据当前语言显示不同的加载文本
        if (currentLanguage === 'cn') {
            languageTitle.textContent = '加载资源中...';
        } else {
            languageTitle.textContent = 'Loading resources...';
        }
        
        // 添加加载动画
        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'loading-spinner';
        loadingSpinner.style.margin = '20px auto';
        loadingSpinner.style.width = '40px';
        loadingSpinner.style.height = '40px';
        loadingSpinner.style.border = '3px solid var(--border-color)';
        loadingSpinner.style.borderTopColor = 'var(--accent-color)';
        loadingSpinner.style.borderRadius = '50%';
        loadingSpinner.style.animation = 'spin 1s linear infinite';
        
        languageTitle.parentNode.appendChild(loadingSpinner);
    }
}

// 预加载资源
function preloadResources() {
    return new Promise((resolve, reject) => {
        // 先加载内容文件
        loadWebsiteContentForPreload().then(() => {
            // 然后预加载所有媒体资源
            preloadMediaResources().then(resolve).catch(resolve);
        }).catch(resolve); // 即使失败也继续
    });
}

// 为预加载加载网站内容
function loadWebsiteContentForPreload() {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', CONFIG.contentFile, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 0 || xhr.status === 200) {
                    const contentText = xhr.responseText;
                    parseContentFile(contentText);
                    resolve();
                } else {
                    reject(new Error(`加载内容文件失败，状态码: ${xhr.status}`));
                }
            }
        };
        xhr.onerror = function() {
            reject(new Error('网络错误，无法加载内容文件'));
        };
        xhr.send();
    });
}

// 预加载媒体资源
function preloadMediaResources() {
    return new Promise((resolve) => {
        if (websiteContent.resources.length === 0) {
            resolve();
            return;
        }
        
        let loadedCount = 0;
        const totalCount = websiteContent.resources.length;
        
        websiteContent.resources.forEach(resource => {
            if (resource.type === 'video' || resource.type === 'gif' || resource.type === 'image') {
                const media = resource.type === 'video' ? document.createElement('video') : document.createElement('img');
                
                media.onload = () => {
                    loadedCount++;
                    checkAllLoaded();
                };
                
                media.onerror = () => {
                    loadedCount++;
                    checkAllLoaded();
                };
                
                media.src = resource.filepath;
                
                // 对于视频，设置预加载属性
                if (resource.type === 'video') {
                    media.preload = 'auto';
                }
            } else {
                loadedCount++;
                checkAllLoaded();
            }
        });
        
        function checkAllLoaded() {
            if (loadedCount >= totalCount) {
                resolve();
            }
        }
        
        // 设置超时，避免某些资源加载过慢
        setTimeout(() => {
            resolve();
        }, 5000); // 5秒超时
    });
}

// 显示主内容
function showMainContent() {
    languagePage.style.opacity = '0';
    
    setTimeout(() => {
        languagePage.style.display = 'none';
        mainContent.style.display = 'block';
        renderResources(); // 直接渲染资源，因为已经解析过了
    }, 500);
}

// 初始化事件监听器
function initEventListeners() {
    // 最新进度按钮点击事件 - 跳转到页面最下方
    latestProgressBtn.addEventListener('click', () => {
        // 滚动到页面最下方
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    });
    
    closeModal.addEventListener('click', () => {
        closeVideoModal();
    });
    
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) {
            closeVideoModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && videoModal.style.display === 'flex') {
            closeVideoModal();
        }
    });
}

// 关闭视频模态框
function closeVideoModal() {
    videoModal.style.display = 'none';
    modalVideo.pause();
    modalVideo.currentTime = 0;
}

// 加载网站内容 - 使用异步XMLHttpRequest（兼容GitHub Pages）
function loadWebsiteContent() {
    resourcesContainer.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>${getText('loading')}</p>
        </div>
    `;
    
    console.log('开始加载网站内容...');
    
    // 使用异步XMLHttpRequest
    const xhr = new XMLHttpRequest();
    xhr.open('GET', CONFIG.contentFile, true); // true表示异步
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            console.log(`XMLHttpRequest状态: ${xhr.status}, 内容长度: ${xhr.responseText?.length || 0}`);
            
            if (xhr.status === 0 || xhr.status === 200) {
                const contentText = xhr.responseText;
                console.log('成功加载内容文件');
                parseContentFile(contentText);
                
                console.log(`解析到 ${websiteContent.resources.length} 个资源`);
                
                if (websiteContent.resources.length === 0) {
                    console.warn('未找到任何资源');
                    showNoResources();
                    return;
                }
                
                websiteContent.resources.sort((a, b) => a.order - b.order);
                console.log('资源排序完成，开始渲染');
                renderResources();
            } else {
                console.error('加载网站内容失败，状态码:', xhr.status);
                showNoResources();
            }
        }
    };
    xhr.onerror = function() {
        console.error('网络错误，无法加载内容文件');
        showNoResources();
    };
    xhr.send();
}

// 获取文本内容
function getText(key) {
    return textContent[currentLanguage][key] || key;
}

// 解析内容文件
function parseContentFile(contentText) {
    const lines = contentText.split('\n');
    let currentSection = '';
    let resources = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('#')) {
            currentSection = line.substring(1).trim().toLowerCase();
            continue;
        }
        
        if (line === '') {
            continue;
        }
        
        switch (currentSection) {
            case 'resources':
                const resource = parseResourceLine(line);
                if (resource) {
                    resources.push(resource);
                }
                break;
                
            case 'titles':
                const titleMatch = line.match(/^([^=]+)=(.+)$/);
                if (titleMatch) {
                    const key = titleMatch[1].trim();
                    const value = titleMatch[2].trim();
                    websiteContent.titles[key] = value;
                }
                break;
                
            case 'descriptions':
                const descMatch = line.match(/^([^=]+)=([^|]+)\|(.+)$/);
                if (descMatch) {
                    const key = descMatch[1].trim();
                    const cnDesc = descMatch[2].trim();
                    const enDesc = descMatch[3].trim();
                    websiteContent.descriptions[key] = { cn: cnDesc, en: enDesc };
                }
                break;
                
            case 'ui_text':
                const uiMatch = line.match(/^([^=]+)=([^|]+)\|(.+)$/);
                if (uiMatch) {
                    const key = uiMatch[1].trim();
                    const cnText = uiMatch[2].trim();
                    const enText = uiMatch[3].trim();
                    textContent.cn[key] = cnText;
                    textContent.en[key] = enText;
                }
                break;
        }
    }
    
    websiteContent.resources = resources;
}

// 解析资源行
function parseResourceLine(line) {
    // 格式: [序号].[描述].[文件名]
    // 例如: 1.模型与动画演示.1.模型与动画演示.mp4
    
    const parts = line.split('.');
    if (parts.length < 3) {
        console.warn(`资源行格式不正确: ${line}`);
        return null;
    }
    
    const order = parseInt(parts[0]);
    if (isNaN(order)) {
        console.warn(`序号不是数字: ${line}`);
        return null;
    }
    
    const description = parts[1];
    const filename = parts.slice(2).join('.');
    const filepath = `./资源/${filename}`; // 使用 ./ 明确表示相对于当前目录
    
    const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    let type = 'unknown';
    
    if (['.mp4', '.webm', '.ogg', '.mov'].includes(extension)) {
        type = 'video';
    } else if (extension === '.gif') {
        type = 'gif';
    } else if (['.png', '.jpg', '.jpeg', '.webp'].includes(extension)) {
        type = 'image';
    }
    
    return {
        order: order,
        description: description,
        filename: filename,
        filepath: filepath,
        type: type,
        extension: extension
    };
}

// 显示无资源状态
function showNoResources() {
    resourcesContainer.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-box-open"></i>
            <p>${getText('no_resources')}</p>
        </div>
    `;
}

// 渲染资源
function renderResources() {
    if (websiteContent.resources.length === 0) {
        showNoResources();
        return;
    }
    
    resourcesContainer.innerHTML = '';
    
    websiteContent.resources.forEach(resource => {
        const card = createResourceCard(resource);
        resourcesContainer.appendChild(card);
    });
}

// 创建资源卡片
function createResourceCard(resource) {
    const card = document.createElement('div');
    card.className = 'resource-card';
    
    let descriptionText = resource.description;
    if (websiteContent.descriptions[resource.description]) {
        descriptionText = websiteContent.descriptions[resource.description][currentLanguage];
    }
    
    console.log(`创建资源卡片: ${resource.filename}, 类型: ${resource.type}, 路径: ${resource.filepath}`);
    
    let mediaContent = '';
    
    if (resource.type === 'video') {
        // 添加视频加载错误处理
        mediaContent = `
            <video class="resource-preview" muted loop onerror="console.error('视频加载失败:', this.src)">
                <source src="${resource.filepath}" type="video/mp4">
                您的浏览器不支持视频标签。
            </video>
            <div class="video-overlay">
                <div class="play-button" data-video="${resource.filepath}" data-title="${descriptionText}">
                    <i class="fas fa-play"></i>
                </div>
            </div>
        `;
    } else if (resource.type === 'gif') {
        mediaContent = `
            <img src="${resource.filepath}" alt="${descriptionText}" class="resource-preview" onerror="console.error('图片加载失败:', this.src)">
            <div class="video-overlay">
                <div class="play-button" data-gif="${resource.filepath}" data-title="${descriptionText}">
                    <i class="fas fa-play"></i>
                </div>
            </div>
        `;
    } else {
        // 普通图片也添加预览功能
        mediaContent = `
            <img src="${resource.filepath}" alt="${descriptionText}" class="resource-preview" onerror="console.error('图片加载失败:', this.src)">
            <div class="video-overlay">
                <div class="play-button" data-image="${resource.filepath}" data-title="${descriptionText}">
                    <i class="fas fa-expand"></i>
                </div>
            </div>
        `;
    }
    
    card.innerHTML = `
        <div class="resource-media">
            ${mediaContent}
        </div>
        <div class="resource-info">
            <div class="resource-order">#${resource.order.toString().padStart(2, '0')}</div>
            <div class="resource-description ${currentLanguage}">${descriptionText}</div>
            <div class="resource-meta">
                <div class="resource-type">
                    <i class="fas fa-${resource.type === 'video' ? 'video' : resource.type === 'gif' ? 'film' : 'image'}"></i>
                    <span>${resource.type === 'video' ? getText('video') : resource.type === 'gif' ? getText('gif') : getText('image')}</span>
                </div>
                <div class="resource-filename">${resource.filename}</div>
            </div>
        </div>
    `;
    
    // 为所有媒体类型添加点击事件
    const playButton = card.querySelector('.play-button');
    if (playButton) {
        playButton.addEventListener('click', () => {
            console.log(`预览 ${resource.type}: ${resource.filepath}`);
            if (resource.type === 'video') {
                playVideo(resource.filepath, descriptionText);
            } else if (resource.type === 'gif') {
                playGif(resource.filepath, descriptionText);
            } else {
                // 普通图片预览
                playImage(resource.filepath, descriptionText);
            }
        });
    }
    
    // 添加媒体加载测试
    setTimeout(() => {
        const media = card.querySelector('.resource-preview');
        if (media) {
            media.onload = () => console.log(`媒体加载成功: ${resource.filepath}`);
            media.onerror = () => console.error(`媒体加载失败: ${resource.filepath}`);
        }
    }, 100);
    
    return card;
}

// 播放视频
function playVideo(videoPath, title) {
    modalVideo.src = videoPath;
    videoTitle.textContent = title;
    videoModal.style.display = 'flex';
    
    setTimeout(() => {
        modalVideo.play().catch(e => console.error('视频播放失败:', e));
    }, 300);
}

// 播放GIF
function playGif(gifPath, title) {
    const gifModal = document.createElement('div');
    gifModal.className = 'video-modal';
    gifModal.style.display = 'flex';
    gifModal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <span class="close-modal">&times;</span>
            <div class="video-container" style="padding-top: 100%;">
                <img src="${gifPath}" alt="${title}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain;">
            </div>
            <div class="video-info">
                <h3>${title}</h3>
            </div>
        </div>
    `;
    
    document.body.appendChild(gifModal);
    
    const closeBtn = gifModal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(gifModal);
    });
    
    gifModal.addEventListener('click', (e) => {
        if (e.target === gifModal) {
            document.body.removeChild(gifModal);
        }
    });
    
    const closeHandler = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(gifModal);
            document.removeEventListener('keydown', closeHandler);
        }
    };
    document.addEventListener('keydown', closeHandler);
}

// 播放图片（预览）
function playImage(imagePath, title) {
    const imageModal = document.createElement('div');
    imageModal.className = 'video-modal';
    imageModal.style.display = 'flex';
    imageModal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <span class="close-modal">&times;</span>
            <div class="video-container" style="padding-top: 100%;">
                <img src="${imagePath}" alt="${title}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain;">
            </div>
            <div class="video-info">
                <h3>${title}</h3>
            </div>
        </div>
    `;
    
    document.body.appendChild(imageModal);
    
    const closeBtn = imageModal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(imageModal);
    });
    
    imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal) {
            document.body.removeChild(imageModal);
        }
    });
    
    const closeHandler = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(imageModal);
            document.removeEventListener('keydown', closeHandler);
        }
    };
    document.addEventListener('keydown', closeHandler);
}
