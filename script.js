// 网站配置
const CONFIG = {
    contentFile: 'website-content.txt',
    defaultLanguage: 'cn', // 默认语言：cn（中文）或 en（英文）
    textContent: {
        cn: {
            noResources: '暂无资源',
            video: '视频',
            image: '图片',
            gif: 'GIF动画',
            toggleLanguage: '切换语言',
            language: '中文',
            loading: '加载中...',
            close: '关闭',
            playVideo: '播放视频',
            websiteTitle: 'ARCIEL UNMAKING THE MORTAL REALM',
            developerName: 'Zlilay',
            copyright: '© 2025-2026 Zlilay'
        },
        en: {
            noResources: 'No resources available',
            video: 'Video',
            image: 'Image',
            gif: 'GIF Animation',
            toggleLanguage: 'Switch Language',
            language: 'English',
            loading: 'Loading...',
            close: 'Close',
            playVideo: 'Play Video',
            websiteTitle: 'ARCIEL UNMAKING THE MORTAL REALM',
            developerName: 'Zlilay',
            copyright: '© 2025-2026 Zlilay'
        }
    }
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
const languageToggle = document.getElementById('language-toggle');
const currentLanguageSpan = document.getElementById('current-language');
const resourcesContainer = document.getElementById('resources-container');
const videoModal = document.getElementById('video-modal');
const modalVideo = document.getElementById('modal-video');
const videoTitle = document.getElementById('video-title');
const closeModal = document.querySelector('.close-modal');
const websiteTitle = document.querySelector('.language-content h1');
const logoTexts = document.querySelectorAll('.logo-text');
const copyrightElement = document.querySelector('.copyright');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initLanguageSelection();
    initEventListeners();
});

// 初始化语言选择
function initLanguageSelection() {
    // 检查是否已选择语言
    const savedLanguage = localStorage.getItem('websiteLanguage');
    if (savedLanguage) {
        currentLanguage = savedLanguage;
        showMainContent();
    }
    
    chineseBtn.addEventListener('click', () => selectLanguage('cn'));
    englishBtn.addEventListener('click', () => selectLanguage('en'));
}

// 选择语言
function selectLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('websiteLanguage', lang);
    showMainContent();
}

// 显示主内容
function showMainContent() {
    // 淡出语言选择页面
    languagePage.style.opacity = '0';
    
    setTimeout(() => {
        languagePage.style.display = 'none';
        mainContent.style.display = 'block';
        
        // 更新语言切换按钮
        updateLanguageToggle();
        
        // 加载网站内容
        loadWebsiteContent();
    }, 500);
}

// 更新语言切换按钮
function updateLanguageToggle() {
    const text = CONFIG.textContent[currentLanguage];
    currentLanguageSpan.textContent = text.language;
    languageToggle.title = text.toggleLanguage;
}

// 初始化事件监听器
function initEventListeners() {
    // 语言切换
    languageToggle.addEventListener('click', toggleLanguage);
    
    // 视频模态框
    closeModal.addEventListener('click', () => {
        closeVideoModal();
    });
    
    // 点击模态框外部关闭
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) {
            closeVideoModal();
        }
    });
    
    // ESC键关闭模态框
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

// 切换语言
function toggleLanguage() {
    currentLanguage = currentLanguage === 'cn' ? 'en' : 'cn';
    localStorage.setItem('websiteLanguage', currentLanguage);
    updateLanguageToggle();
    updateStaticText();
    renderResources();
}

// 更新静态文本
function updateStaticText() {
    const text = CONFIG.textContent[currentLanguage];
    
    // 更新网站标题
    if (websiteTitle) {
        websiteTitle.textContent = text.websiteTitle;
    }
    
    // 更新版权信息
    if (copyrightElement) {
        copyrightElement.textContent = text.copyright;
    }
}

// 加载网站内容
async function loadWebsiteContent() {
    // 显示加载状态
    resourcesContainer.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>${CONFIG.textContent[currentLanguage].loading}</p>
        </div>
    `;
    
    try {
        console.log('开始加载网站内容...');
        console.log('当前协议:', window.location.protocol);
        
        let contentText;
        
        // 检查是否在文件协议下运行// 检查是否在文件协议下运行
        if (window.location.protocol === 'file:') {location.protocol === 'file:') {
            console.log('在文件协议下运行，使用XMLHttpReques 作为回退');onsole.log('在文件协议下运行，使用XMLHttpRequest作为回退');
            contentText = await loadFileWithXHR(CONFIG.contentFile);
        } else {
            // 使用fetch API
            const response = await fetch(CONFIG.contentFile);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            contentText = await response.text();
        }
        
        console.log('内容文件加载成功，长度:', contentText.length);
        
        parseContentFile(contentText);
        console.log('解析完成，找到资源数量:', websiteContent.resources.length);
        
        if (websiteContent.resources.length === 0) {
            console.warn('未找到任何资源');
            showNoResources();
            return;
        }
        
        // 按序号排序
        websiteContent.resources.sort((a, b) => a.order - b.order);
        console.log('资源排序完成');
        
        updateStaticText();
        renderResources();
    } catch (error) {
        console.error('加载网站内容失败:', error);
        showNoResources();
    }
}

// 使用XMLHttpRequest加载文件（用于文件协议）
function loadFileWithXHR(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 0 || xhr.status === 200) {
                    resolve(xhr.responseText);
                } else {
                    reject(new Error(`无法加载文件: ${url}, 状态: ${xhr.status}`));
                }
            }
        };
        xhr.onerror = function() {
            reject(new Error(`网络错误: ${url}`));
        };
        xhr.send();
    });
}

// 检查资源文件是否存在（已移除，因为文件协议下HEAD请求可能失败）

// 解析内容文件
function parseContentFile(contentText) {
    const lines = contentText.split('\n');
    let currentSection = '';
    let resources = [];
    
    console.log('开始解析内容文件，行数:', lines.length);
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('#')) {
            // 章节标题
            currentSection = line.substring(1).trim().toLowerCase();
            console.log(`找到章节: ${currentSection} (原始行: ${line})`);
            continue;
        }
        
        if (line === '') {
            // 空行
            continue;
        }
        
        // 根据当前章节处理内容
        switch (currentSection) {
            case 'resources':
                console.log(`解析资源行: ${line}`);
                // 资源行格式: [序号].[描述].[文件名]
                // 例如: 1.模型与动画演示.1.模型与动画演示.mp4
                const resource = parseResourceLine(line);
                if (resource) {
                    console.log(`成功解析资源:`, resource);
                    resources.push(resource);
                } else {
                    console.warn(`解析资源行失败: ${line}`);
                }
                break;
                
            case 'titles':
                // 标题行格式: [键]=[值]
                const titleMatch = line.match(/^([^=]+)=(.+)$/);
                if (titleMatch) {
                    const key = titleMatch[1].trim();
                    const value = titleMatch[2].trim();
                    websiteContent.titles[key] = value;
                    console.log(`解析标题: ${key} = ${value}`);
                }
                break;
                
            case 'descriptions':
                // 描述行格式: [键]=[中文描述]|[英文描述]
                const descMatch = line.match(/^([^=]+)=([^|]+)\|(.+)$/);
                if (descMatch) {
                    const key = descMatch[1].trim();
                    const cnDesc = descMatch[2].trim();
                    const enDesc = descMatch[3].trim();
                    websiteContent.descriptions[key] = { cn: cnDesc, en: enDesc };
                    console.log(`解析描述: ${key} = ${cnDesc} | ${enDesc}`);
                }
                break;
                
            default:
                console.log(`未识别的章节或空章节: ${currentSection}, 行: ${line}`);
        }
    }
    
    websiteContent.resources = resources;
    console.log('解析完成，总资源数:', resources.length);
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
    
    // 提取序号（第一个部分）
    const order = parseInt(parts[0]);
    if (isNaN(order)) {
        console.warn(`序号不是数字: ${line}`);
        return null;
    }
    
    // 提取描述（中间部分）
    const description = parts[1];
    
    // 提取文件名（剩余部分）
    const filename = parts.slice(2).join('.');
    const filepath = `资源/${filename}`;
    
    // 确定文件类型
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
    const text = CONFIG.textContent[currentLanguage];
    resourcesContainer.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-box-open"></i>
            <p>${text.noResources}</p>
        </div>
    `;
}

// 渲染资源
function renderResources() {
    const text = CONFIG.textContent[currentLanguage];
    
    if (websiteContent.resources.length === 0) {
        showNoResources();
        return;
    }
    
    // 清空容器
    resourcesContainer.innerHTML = '';
    
    // 创建资源卡片
    websiteContent.resources.forEach(resource => {
        const card = createResourceCard(resource, text);
        resourcesContainer.appendChild(card);
    });
}

// 创建资源卡片
function createResourceCard(resource, text) {
    const card = document.createElement('div');
    card.className = 'resource-card';
    
    // 获取描述文本
    let descriptionText = resource.description;
    if (websiteContent.descriptions[resource.description]) {
        descriptionText = websiteContent.descriptions[resource.description][currentLanguage];
    }
    
    // 构建卡片内容
    let mediaContent = '';
    let playButton = '';
    
    if (resource.type === 'video') {
        mediaContent = `
            <video class="resource-preview" muted loop>
                <source src="${resource.filepath}" type="video/mp4">
            </video>
            <div class="video-overlay">
                <div class="play-button" data-video="${resource.filepath}" data-title="${descriptionText}">
                    <i class="fas fa-play"></i>
                </div>
            </div>
        `;
    } else if (resource.type === 'gif') {
        mediaContent = `
            <img src="${resource.filepath}" alt="${descriptionText}" class="resource-preview">
            <div class="video-overlay">
                <div class="play-button" data-gif="${resource.filepath}" data-title="${descriptionText}">
                    <i class="fas fa-play"></i>
                </div>
            </div>
        `;
    } else {
        mediaContent = `<img src="${resource.filepath}" alt="${descriptionText}" class="resource-preview">`;
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
                    <span>${resource.type === 'video' ? text.video : resource.type === 'gif' ? text.gif : text.image}</span>
                </div>
                <div class="resource-filename">${resource.filename}</div>
            </div>
        </div>
    `;
    
    // 添加事件监听器
    if (resource.type === 'video' || resource.type === 'gif') {
        const playButton = card.querySelector('.play-button');
        playButton.addEventListener('click', () => {
            if (resource.type === 'video') {
                playVideo(resource.filepath, descriptionText);
            } else {
                playGif(resource.filepath, descriptionText);
            }
        });
    }
    
    return card;
}

// 播放视频
function playVideo(videoPath, title) {
    modalVideo.src = videoPath;
    videoTitle.textContent = title;
    videoModal.style.display = 'flex';
    
    // 开始播放
    setTimeout(() => {
        modalVideo.play().catch(e => console.error('视频播放失败:', e));
    }, 300);
}

// 播放GIF（全屏显示）
function playGif(gifPath, title) {
    // 对于GIF，我们创建一个全屏显示
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
    
    // 添加关闭事件
    const closeBtn = gifModal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(gifModal);
    });
    
    gifModal.addEventListener('click', (e) => {
        if (e.target === gifModal) {
            document.body.removeChild(gifModal);
        }
    });
    
    // ESC键关闭
    const closeHandler = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(gifModal);
            document.removeEventListener('keydown', closeHandler);
        }
    };
    document.addEventListener('keydown', closeHandler);
}

// 页面加载完成后初始化
updateStaticText();
