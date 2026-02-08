// 更新时间
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    document.querySelector('.time').textContent = timeString;
    document.querySelector('.lock-time').textContent = timeString;
    
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const day = days[now.getDay()];
    document.querySelector('.lock-date').textContent = `${month}月${date}日 ${day}`;
}

setInterval(updateTime, 1000);
updateTime();

// 锁屏解锁
const lockScreen = document.getElementById('lock-screen');
let startY = 0;

lockScreen.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
});

lockScreen.addEventListener('touchend', (e) => {
    const endY = e.changedTouches[0].clientY;
    if (startY - endY > 100) { // 向上滑动超过 100px
        tryUnlock();
    }
});

// 鼠标模拟滑动
lockScreen.addEventListener('mousedown', (e) => {
    startY = e.clientY;
});

lockScreen.addEventListener('mouseup', (e) => {
    const endY = e.clientY;
    if (startY - endY > 100) {
        tryUnlock();
    }
});

// 点击解锁（方便测试）
lockScreen.addEventListener('click', () => {
    tryUnlock();
});

function tryUnlock() {
    const savedPasscode = localStorage.getItem('lockPasscode');
    if (savedPasscode) {
        // 如果有密码，显示密码界面
        showPasscodeScreen();
    } else {
        // 没有密码，直接解锁
        performUnlock();
    }
}

let isUnlocking = false;

function performUnlock() {
    if (isUnlocking) return;
    isUnlocking = true;

    // 启用过渡动画
    lockScreen.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    lockScreen.style.transform = 'translateY(-100%)';
    lockScreen.style.opacity = '0';
    
    // 确保动画完成后切换状态
    setTimeout(() => {
        // 显示主屏幕
        document.getElementById('home-screen').classList.add('active');
        
        // 彻底隐藏锁屏
        lockScreen.style.transition = 'none';
        lockScreen.classList.remove('active');
        
        // 强制重置样式
        lockScreen.style.transform = '';
        lockScreen.style.opacity = '';
        
        // 强制重绘
        void lockScreen.offsetWidth;
        
        isUnlocking = false;
    }, 300);
}

// 密码相关逻辑
let currentPasscode = '';
let isSettingPasscode = false;
let tempPasscode = ''; // 用于设置密码时的确认

function showPasscodeScreen() {
    document.getElementById('passcode-screen').classList.add('active');
    resetPasscodeDots();
}

function hidePasscodeScreen() {
    document.getElementById('passcode-screen').classList.remove('active');
    currentPasscode = '';
    resetPasscodeDots();
}

function inputPasscode(num) {
    if (currentPasscode.length < 4) {
        currentPasscode += num;
        updatePasscodeDots();
        
        if (currentPasscode.length === 4) {
            setTimeout(() => {
                if (isSettingPasscode) {
                    handleSettingPasscode();
                } else {
                    verifyPasscode();
                }
            }, 100);
        }
    }
}

function deletePasscode() {
    if (currentPasscode.length > 0) {
        currentPasscode = currentPasscode.slice(0, -1);
        updatePasscodeDots();
    }
}

function cancelPasscode() {
    hidePasscodeScreen();
    isSettingPasscode = false;
    tempPasscode = '';
    document.querySelector('.passcode-title').textContent = '输入密码';
}

function updatePasscodeDots() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        if (index < currentPasscode.length) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    });
}

function resetPasscodeDots() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach(dot => dot.classList.remove('filled'));
}

function verifyPasscode() {
    const savedPasscode = localStorage.getItem('lockPasscode');
    if (currentPasscode === savedPasscode) {
        hidePasscodeScreen();
        performUnlock();
    } else {
        alert('密码错误');
        currentPasscode = '';
        resetPasscodeDots();
    }
}

// 设置密码流程
function setupPasscode() {
    isSettingPasscode = true;
    tempPasscode = '';
    currentPasscode = '';
    document.querySelector('.passcode-title').textContent = '设置新密码';
    showPasscodeScreen();
}

function handleSettingPasscode() {
    if (!tempPasscode) {
        // 第一次输入
        tempPasscode = currentPasscode;
        currentPasscode = '';
        resetPasscodeDots();
        document.querySelector('.passcode-title').textContent = '再次输入以确认';
    } else {
        // 确认输入
        if (currentPasscode === tempPasscode) {
            localStorage.setItem('lockPasscode', currentPasscode);
            alert('密码设置成功');
            hidePasscodeScreen();
            updatePasscodeSettingText();
        } else {
            alert('两次密码不一致，请重试');
            tempPasscode = '';
            currentPasscode = '';
            resetPasscodeDots();
            document.querySelector('.passcode-title').textContent = '设置新密码';
        }
    }
    if (document.querySelector('.passcode-title').textContent !== '输入密码') {
        isSettingPasscode = true;
    }
}

function updatePasscodeSettingText() {
    const text = localStorage.getItem('lockPasscode') ? '修改锁屏密码' : '设置锁屏密码';
    const el = document.getElementById('passcode-setting-text');
    if (el) el.textContent = text;
}

// 壁纸相关逻辑
function triggerWallpaperUpload() {
    document.getElementById('wallpaper-upload').click();
}

function handleWallpaperUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = e.target.result;
            try {
                localStorage.setItem('lockWallpaper', imageData);
                applyWallpaper(imageData);
                alert('壁纸更换成功');
            } catch (err) {
                alert('图片太大，无法保存，请选择较小的图片');
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function applyWallpaper(imageData) {
    if (imageData) {
        document.getElementById('lock-screen').style.background = `url(${imageData}) no-repeat center center/cover`;
    }
}

// 初始化加载
window.addEventListener('load', () => {
    const savedWallpaper = localStorage.getItem('lockWallpaper');
    if (savedWallpaper) {
        applyWallpaper(savedWallpaper);
    }
    updatePasscodeSettingText();
});

// 打开 APP
function openApp(appName) {
    const appElement = document.getElementById(`app-${appName}`) || document.getElementById('app-placeholder');
    
    if (appElement.id === 'app-placeholder') {
        const titles = {
            'worldbook': '世界书',
            'couple': '情侣空间',
            'drawing': '制图',
            'game': '游戏',
            'dating': '约会'
        };
        document.getElementById('placeholder-title').textContent = titles[appName] || '应用';
    }
    
    appElement.classList.add('open');
}

// 关闭 APP
function closeApp() {
    const openApps = document.querySelectorAll('.app-window.open');
    openApps.forEach(app => {
        app.classList.remove('open');
    });
}

// 回到主页
function goHome() {
    closeApp();
}

// 聊天 APP 切换 Tab
function switchChatTab(tabName) {
    document.querySelectorAll('.chat-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.getElementById(`chat-tab-${tabName}`).classList.add('active');
    
    document.querySelectorAll('.app-footer-nav .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const navItems = document.querySelectorAll('.app-footer-nav .nav-item');
    const tabIndex = ['messages', 'contacts', 'moments', 'me'].indexOf(tabName);
    if (tabIndex !== -1 && navItems[tabIndex]) {
        navItems[tabIndex].classList.add('active');
    }

    if (tabName === 'messages') {
        document.getElementById('chat-list-view').style.display = 'block';
        document.getElementById('chat-detail-view').style.display = 'none';
    }
}

// 联系人数据管理
let contacts = JSON.parse(localStorage.getItem('contacts')) || [
    { id: 'alice', name: 'Alice', avatar: null, gender: '女', age: '18', personality: '活泼', desc: '默认联系人' },
    { id: 'bob', name: 'Bob', avatar: null, gender: '男', age: '20', personality: '沉稳', desc: '默认联系人' }
];

function saveContacts() {
    localStorage.setItem('contacts', JSON.stringify(contacts));
    renderContactsList();
}

function renderContactsList() {
    const container = document.getElementById('contacts-list-container');
    if (!container) return;
    
    container.innerHTML = '';
    contacts.forEach(contact => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.onclick = () => openContactDetail(contact.id);
        
        let avatarHtml = `<div class="avatar">${contact.name[0]}</div>`;
        if (contact.avatar) {
            avatarHtml = `<img src="${contact.avatar}" class="avatar" style="object-fit: cover;">`;
        }
        
        item.innerHTML = `
            ${avatarHtml}
            <div class="list-info"><div class="list-title">${contact.name}</div></div>
            <i class="fas fa-chevron-right" style="color: #ccc; font-size: 12px;"></i>
        `;
        container.appendChild(item);
    });
    
    const chatList = document.getElementById('chat-list-view');
    if (chatList) {
        chatList.innerHTML = '';
        contacts.forEach(contact => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.onclick = () => enterChat(contact.id);
            
            let avatarHtml = `<div class="avatar">${contact.name[0]}</div>`;
            if (contact.avatar) {
                avatarHtml = `<img src="${contact.avatar}" class="avatar" style="object-fit: cover;">`;
            }
            
            item.innerHTML = `
                ${avatarHtml}
                <div class="list-info">
                    <div class="list-title">${contact.name}</div>
                    <div class="list-subtitle">点击进入聊天...</div>
                </div>
                <div class="list-time">12:00</div>
            `;
            chatList.appendChild(item);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderContactsList();
});

// 联系人详情
let currentDetailContactId = '';

function openContactDetail(id) {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;
    
    currentDetailContactId = id;
    document.getElementById('contact-detail-name').textContent = contact.name;
    document.getElementById('contact-detail-title').textContent = contact.name;
    document.getElementById('contact-detail-desc').textContent = contact.desc || '暂无描述';
    
    const avatarEl = document.getElementById('contact-detail-avatar');
    if (contact.avatar) {
        avatarEl.innerHTML = `<img src="${contact.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        avatarEl.style.background = 'transparent';
        avatarEl.textContent = '';
    } else {
        avatarEl.innerHTML = '';
        avatarEl.textContent = contact.name[0];
        avatarEl.style.background = '#e1e1e1';
    }
    
    document.getElementById('contact-detail-gender').textContent = contact.gender || '-';
    document.getElementById('contact-detail-age').textContent = contact.age || '-';
    document.getElementById('contact-detail-personality').textContent = contact.personality || '-';
    
    openSubPage('contact-detail');
}

function deleteContact() {
    if (confirm('确定要删除这个联系人吗？')) {
        contacts = contacts.filter(c => c.id !== currentDetailContactId);
        saveContacts();
        closeSubPage('contact-detail');
    }
}

function enterChatFromDetail() {
    closeSubPage('contact-detail');
    switchChatTab('messages');
    enterChat(currentDetailContactId);
}

// 添加联系人相关逻辑
function showAddContactOptions() {
    document.getElementById('action-sheet-overlay').classList.add('active');
    document.getElementById('add-contact-sheet').classList.add('active');
}

function hideActionSheet() {
    document.getElementById('action-sheet-overlay').classList.remove('active');
    document.getElementById('add-contact-sheet').classList.remove('active');
}

function openAddContactForm() {
    hideActionSheet();
    document.getElementById('new-contact-name').value = '';
    document.getElementById('new-contact-gender').value = '';
    document.getElementById('new-contact-age').value = '';
    document.getElementById('new-contact-personality').value = '';
    document.getElementById('new-contact-avatar-preview').src = '';
    document.getElementById('new-contact-avatar-preview').style.display = 'none';
    document.getElementById('new-contact-avatar-icon').style.display = 'block';
    document.getElementById('doc-preview-area').style.display = 'none';
    document.getElementById('doc-content-preview').textContent = '';
    
    openSubPage('add-contact');
}

function triggerAvatarUpload() {
    document.getElementById('avatar-upload-input').click();
}

function handleAvatarPreview(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById('new-contact-avatar-preview');
            img.src = e.target.result;
            img.style.display = 'block';
            document.getElementById('new-contact-avatar-icon').style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function triggerDocUpload() {
    document.getElementById('doc-upload-input').click();
}

function handleDocUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        
        if (file.name.endsWith('.docx')) {
            reader.onload = function(e) {
                const arrayBuffer = e.target.result;
                mammoth.extractRawText({arrayBuffer: arrayBuffer})
                    .then(function(result){
                        const text = result.value;
                        showDocPreview(text);
                    })
                    .catch(function(err){
                        alert('解析 docx 失败: ' + err.message);
                    });
            };
            reader.readAsArrayBuffer(file);
        } else {
            reader.onload = function(e) {
                showDocPreview(e.target.result);
            };
            reader.readAsText(file);
        }
    }
}

function showDocPreview(text) {
    const previewArea = document.getElementById('doc-preview-area');
    const content = document.getElementById('doc-content-preview');
    previewArea.style.display = 'flex';
    content.textContent = text;
    content.dataset.fullText = text;
}

function saveNewContact() {
    const name = document.getElementById('new-contact-name').value.trim();
    if (!name) {
        alert('请输入姓名');
        return;
    }
    
    const avatarImg = document.getElementById('new-contact-avatar-preview');
    const avatar = avatarImg.style.display === 'block' ? avatarImg.src : null;
    const gender = document.getElementById('new-contact-gender').value.trim();
    const age = document.getElementById('new-contact-age').value.trim();
    const personality = document.getElementById('new-contact-personality').value.trim();
    const docContent = document.getElementById('doc-content-preview').dataset.fullText || '';
    
    const newContact = {
        id: Date.now().toString(),
        name: name,
        avatar: avatar,
        gender: gender,
        age: age,
        personality: personality,
        desc: docContent.substring(0, 50) + (docContent.length > 50 ? '...' : ''),
        fullDesc: docContent
    };
    
    contacts.push(newContact);
    saveContacts();
    closeSubPage('add-contact');
    alert('联系人添加成功');
}

function triggerImportCard() {
    document.getElementById('import-card-input').click();
}

function handleImportCard(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        if (file.type === 'application/json') {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const json = JSON.parse(e.target.result);
                    fillFormWithCardData(json);
                } catch (err) {
                    alert('JSON 解析失败');
                }
            };
            reader.readAsText(file);
        } else if (file.type === 'image/png') {
            alert('目前仅支持 JSON 格式的酒馆卡导入，PNG 解析需要额外库支持。请上传 JSON 文件。');
        }
    }
    hideActionSheet();
}

function fillFormWithCardData(data) {
    openAddContactForm();
    const charData = data.data || data;
    document.getElementById('new-contact-name').value = charData.name || '';
    document.getElementById('new-contact-personality').value = charData.personality || '';
    const desc = charData.description || charData.scenario || '';
    showDocPreview(desc);
    alert('已自动填充部分信息，请补充完整');
}

// 聊天功能
let currentChatUser = '';

// 聊天历史记录 (持久化存储)
let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || {};

function saveChatHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

function enterChat(userId) {
    const contact = contacts.find(c => c.id === userId);
    if (!contact) return;
    
    currentChatUser = contact.name;
    document.getElementById('chat-header-name').textContent = contact.name;
    
    // 隐藏聊天列表和底部导航
    document.getElementById('chat-list-view').style.display = 'none';
    document.querySelector('.app-footer-nav').style.display = 'none';
    
    // 隐藏聊天 APP 的默认 Header
    document.getElementById('chat-app-header').style.display = 'none';
    
    // 显示全屏聊天详情页
    const detailView = document.getElementById('chat-detail-view');
    detailView.style.display = 'flex';
    
    const container = document.getElementById('chat-messages-container');
    container.innerHTML = '';
    
    // 加载历史消息
    if (chatHistory[currentChatUser] && chatHistory[currentChatUser].length > 0) {
        chatHistory[currentChatUser].forEach(msg => {
            // 兼容旧文本消息和新对象消息
            const content = typeof msg.content === 'string' ? msg.content : msg.content;
            const type = msg.type || 'text';
            addMessage(msg.role === 'user' ? 'right' : 'left', content, type);
        });
    } else {
        addMessage('left', `你好，我是 ${contact.name}。`);
    }
    
    // 初始化表情
    initEmojis();
}

function exitChat() {
    document.getElementById('chat-detail-view').style.display = 'none';
    document.getElementById('chat-list-view').style.display = 'block';
    document.querySelector('.app-footer-nav').style.display = 'flex';
    document.getElementById('chat-app-header').style.display = 'flex';
    hideBottomPanels();
    document.getElementById('chat-menu-dropdown').classList.remove('active');
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    
    if (text) {
        sendUserMessage(text);
        input.value = '';
    }
}

// 监听回车发送
document.getElementById('chat-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendUserMessage(content, type = 'text') {
    // content 可以是字符串(文本)或对象(特殊消息)
    addMessage('right', content, type);
    
    if (!chatHistory[currentChatUser]) chatHistory[currentChatUser] = [];
    
    // 存储消息
    const msgObj = { role: 'user', content: content, type: type };
    chatHistory[currentChatUser].push(msgObj);
    saveChatHistory();
    
    // 移除自动 AI 回复，改为手动触发
}

function triggerAiReply() {
    showTypingIndicator();
    const apiKey = localStorage.getItem('apiKey');
    
    if (apiKey) {
        // 获取最后一条用户消息作为上下文，或者直接让 AI 基于历史回复
        // 这里我们不传特定 text，而是让 fetchAIResponse 使用历史记录
        fetchAIResponse(null); 
    } else {
        // 本地回复模拟
        const history = chatHistory[currentChatUser] || [];
        const lastUserMsg = history.filter(m => m.role === 'user').pop();
        const text = lastUserMsg ? (typeof lastUserMsg.content === 'string' ? lastUserMsg.content : '[非文本消息]') : '你好';
        
        const delay = 1000 + Math.random() * 1000;
        setTimeout(() => {
            const replyText = generateLocalReply(text);
            hideTypingIndicator();
            addMessage('left', replyText);
            
            chatHistory[currentChatUser].push({ role: 'assistant', content: replyText, type: 'text' });
            saveChatHistory();
        }, delay);
    }
}

function showTypingIndicator() {
    const container = document.getElementById('chat-messages-container');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.style.display = 'flex';
    typingDiv.style.justifyContent = 'flex-start';
    typingDiv.style.marginBottom = '10px';
    
    typingDiv.innerHTML = `
        <div style="background-color: #e5e5ea; padding: 10px 15px; border-radius: 18px; border-bottom-left-radius: 4px;">
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

function addMessage(side, content, type = 'text') {
    const container = document.getElementById('chat-messages-container');
    const msgDiv = document.createElement('div');
    msgDiv.style.display = 'flex';
    msgDiv.style.justifyContent = side === 'right' ? 'flex-end' : 'flex-start';
    msgDiv.style.marginBottom = '10px';
    
    const bubble = document.createElement('div');
    bubble.style.maxWidth = '70%';
    bubble.style.padding = '10px 15px';
    bubble.style.borderRadius = '18px';
    bubble.style.fontSize = '16px';
    bubble.style.lineHeight = '1.4';
    bubble.style.wordWrap = 'break-word';
    
    if (side === 'right') {
        bubble.style.backgroundColor = 'var(--primary-color)';
        bubble.style.color = 'white';
        bubble.style.borderBottomRightRadius = '4px';
    } else {
        bubble.style.backgroundColor = '#e5e5ea';
        bubble.style.color = 'black';
        bubble.style.borderBottomLeftRadius = '4px';
    }
    
    // 根据类型渲染内容
    if (type === 'text') {
        bubble.textContent = content;
    } else if (type === 'image') {
        bubble.style.padding = '5px';
        bubble.style.backgroundColor = 'transparent';
        bubble.innerHTML = `<img src="${content}" style="max-width: 100%; border-radius: 10px;">`;
    } else if (type === 'redpacket') {
        bubble.style.backgroundColor = '#fa9d3b';
        bubble.style.color = 'white';
        bubble.innerHTML = `
            <div style="display:flex; align-items:center;">
                <div style="background:#fff; border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; margin-right:10px; color:#fa9d3b;">
                    <i class="fas fa-yen-sign"></i>
                </div>
                <div>
                    <div style="font-weight:bold;">恭喜发财，大吉大利</div>
                    <div style="font-size:12px; opacity:0.8;">微信红包</div>
                </div>
            </div>
        `;
    } else if (type === 'transfer') {
        bubble.style.backgroundColor = '#fa9d3b';
        bubble.style.color = 'white';
        bubble.innerHTML = `
            <div style="display:flex; align-items:center;">
                <div style="background:#fff; border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; margin-right:10px; color:#fa9d3b;">
                    <i class="fas fa-exchange-alt"></i>
                </div>
                <div>
                    <div style="font-weight:bold;">¥ ${content.amount || '100.00'}</div>
                    <div style="font-size:12px; opacity:0.8;">转账给 ${content.to || '对方'}</div>
                </div>
            </div>
        `;
    } else if (type === 'file') {
        bubble.style.backgroundColor = 'white';
        bubble.style.color = 'black';
        bubble.style.border = '1px solid #eee';
        bubble.innerHTML = `
            <div style="display:flex; align-items:center;">
                <div style="font-size:30px; margin-right:10px; color:#f5c359;">
                    <i class="fas fa-file-alt"></i>
                </div>
                <div>
                    <div style="font-weight:bold; font-size:14px;">${content.name}</div>
                    <div style="font-size:12px; color:#888;">${content.size || '未知大小'}</div>
                </div>
            </div>
        `;
    }
    
    msgDiv.appendChild(bubble);
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

// 聊天界面交互逻辑
function toggleEmojiPanel() {
    const panel = document.getElementById('emoji-panel');
    const plusPanel = document.getElementById('plus-panel');
    
    if (panel.classList.contains('active')) {
        panel.classList.remove('active');
    } else {
        hideBottomPanels();
        panel.classList.add('active');
        scrollToBottom();
    }
}

function togglePlusPanel() {
    const panel = document.getElementById('plus-panel');
    
    if (panel.classList.contains('active')) {
        panel.classList.remove('active');
    } else {
        hideBottomPanels();
        panel.classList.add('active');
        scrollToBottom();
    }
}

function hideBottomPanels() {
    document.getElementById('emoji-panel').classList.remove('active');
    document.getElementById('plus-panel').classList.remove('active');
}

function scrollToBottom() {
    const container = document.getElementById('chat-messages-container');
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

// 表情逻辑
function initEmojis() {
    const container = document.getElementById('default-emojis');
    if (container.children.length > 0) return;
    
    const emojis = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾'];
    
    emojis.forEach(emoji => {
        const item = document.createElement('div');
        item.className = 'emoji-item';
        item.textContent = emoji;
        item.onclick = () => {
            const input = document.getElementById('chat-input');
            input.value += emoji;
        };
        container.appendChild(item);
    });
    
    loadCustomEmojis();
}

function triggerEmojiUpload() {
    document.getElementById('emoji-upload-input').click();
}

function handleEmojiUpload(input) {
    if (input.files && input.files.length > 0) {
        Array.from(input.files).forEach(file => {
            const fileType = file.name.split('.').pop().toLowerCase();
            
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
                // 图片文件
                const reader = new FileReader();
                reader.onload = function(e) {
                    saveCustomEmoji(e.target.result);
                };
                reader.readAsDataURL(file);
            } else if (fileType === 'txt') {
                // TXT 文件
                const reader = new FileReader();
                reader.onload = function(e) {
                    extractUrlsFromText(e.target.result);
                };
                reader.readAsText(file);
            } else if (fileType === 'json') {
                // JSON 文件
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const json = JSON.parse(e.target.result);
                        extractUrlsFromJson(json);
                    } catch (err) {
                        alert('JSON 解析失败');
                    }
                };
                reader.readAsText(file);
            } else if (fileType === 'docx') {
                // DOCX 文件
                const reader = new FileReader();
                reader.onload = function(e) {
                    mammoth.extractRawText({arrayBuffer: e.target.result})
                        .then(function(result){
                            extractUrlsFromText(result.value);
                        })
                        .catch(function(err){
                            alert('DOCX 解析失败: ' + err.message);
                        });
                };
                reader.readAsArrayBuffer(file);
            }
        });
    }
}

function extractUrlsFromText(text) {
    const urlRegex = /(https?:\/\/[^\s"']+)/g;
    const matches = text.match(urlRegex);
    
    if (matches && matches.length > 0) {
        let count = 0;
        let successCount = 0;
        const total = matches.length;
        
        alert(`找到 ${total} 个 URL，正在验证图片有效性...`);
        
        matches.forEach(url => {
            // 验证是否为图片
            const img = new Image();
            img.onload = function() {
                saveCustomEmoji(url);
                successCount++;
            };
            img.onerror = function() {
                console.log('无效图片 URL:', url);
            };
            img.src = url;
            count++;
        });
        
        // 由于是异步加载，这里只提示开始
        setTimeout(() => {
            alert(`导入处理完成。成功加载的图片将显示在表情面板中。`);
        }, 2000);
    } else {
        alert('未在文档中找到有效的 URL');
    }
}

function extractUrlsFromJson(json) {
    // 递归查找 JSON 中的所有字符串，如果是 URL 则添加
    let count = 0;
    
    function traverse(obj) {
        if (typeof obj === 'string') {
            if (obj.match(/^https?:\/\//)) {
                saveCustomEmoji(obj);
                count++;
            }
        } else if (Array.isArray(obj)) {
            obj.forEach(item => traverse(item));
        } else if (typeof obj === 'object' && obj !== null) {
            Object.values(obj).forEach(value => traverse(value));
        }
    }
    
    traverse(json);
    
    if (count > 0) {
        alert(`已导入 ${count} 个表情 URL`);
    } else {
        alert('未在 JSON 中找到有效的 URL');
    }
}

function saveCustomEmoji(base64) {
    let customEmojis = JSON.parse(localStorage.getItem('customEmojis')) || [];
    customEmojis.push(base64);
    localStorage.setItem('customEmojis', JSON.stringify(customEmojis));
    renderCustomEmoji(base64);
    
    // 切换到自定义表情 Tab
    document.getElementById('custom-emojis').style.display = 'grid';
    document.getElementById('default-emojis').style.display = 'none';
    document.querySelectorAll('.panel-tab')[0].classList.remove('active');
    document.querySelectorAll('.panel-tab')[1].classList.add('active');
}

function loadCustomEmojis() {
    const customEmojis = JSON.parse(localStorage.getItem('customEmojis')) || [];
    const container = document.getElementById('custom-emojis');
    container.innerHTML = '';
    customEmojis.forEach(base64 => renderCustomEmoji(base64));
    
    // 绑定 Tab 切换事件
    const tabs = document.querySelectorAll('.panel-tab');
    tabs[0].onclick = () => {
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
        document.getElementById('default-emojis').style.display = 'grid';
        document.getElementById('custom-emojis').style.display = 'none';
    };
    tabs[1].onclick = () => {
        tabs[1].classList.add('active');
        tabs[0].classList.remove('active');
        document.getElementById('default-emojis').style.display = 'none';
        document.getElementById('custom-emojis').style.display = 'grid';
    };
}

function renderCustomEmoji(base64) {
    const container = document.getElementById('custom-emojis');
    const item = document.createElement('div');
    item.className = 'emoji-item';
    item.innerHTML = `<img src="${base64}" class="custom-emoji">`;
    item.onclick = () => {
        sendUserMessage(base64, 'image');
    };
    container.appendChild(item);
}

// 加号功能逻辑
function sendRedPacket() {
    sendUserMessage({}, 'redpacket');
    hideBottomPanels();
}

function sendTransfer() {
    const amount = prompt("请输入转账金额", "100.00");
    if (amount) {
        sendUserMessage({ amount: amount, to: currentChatUser }, 'transfer');
        hideBottomPanels();
    }
}

function sendTextImage() {
    const text = prompt("请输入文字生成图片", "Hello");
    if (text) {
        // 简单模拟：生成一个包含文字的 canvas 图片
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 200, 100);
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 100, 50);
        
        sendUserMessage(canvas.toDataURL(), 'image');
        hideBottomPanels();
    }
}

function triggerFileUpload() {
    document.getElementById('chat-file-upload').click();
}

function handleChatFileUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        sendUserMessage({ name: file.name, size: formatFileSize(file.size) }, 'file');
        hideBottomPanels();
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 右上角菜单
function toggleChatMenu() {
    const menu = document.getElementById('chat-menu-dropdown');
    if (menu.classList.contains('active')) {
        menu.classList.remove('active');
    } else {
        menu.classList.add('active');
    }
}

function startListenTogether() {
    toggleChatMenu();
    addMessage('right', '🎵 我发起了一起听', 'text');
    setTimeout(() => {
        addMessage('left', '好呀，听什么？', 'text');
    }, 1000);
}

function openChatSettings() {
    toggleChatMenu();
    // 跳转到联系人详情页作为设置页
    const contact = contacts.find(c => c.name === currentChatUser);
    if (contact) {
        openContactDetail(contact.id);
    }
}

function generateLocalReply(text) {
    const contact = contacts.find(c => c.name === currentChatUser) || {};
    const personality = contact.personality || '普通';
    
    const commonReplies = [
        "嗯嗯，我在听。",
        "真的吗？展开说说。",
        "这确实挺有意思的。",
        "我也这么觉得！",
        "哈哈，笑死我了。",
        "哎，生活就是这样。",
        "那你打算怎么办呢？"
    ];
    
    const personalityReplies = {
        '活泼': ["哇！太棒了吧！✨", "嘿嘿，我就知道！", "快带我一起玩！", "真的假的？！😱"],
        '高冷': ["哦。", "知道了。", "无聊。", "你自己看着办吧。"],
        '温柔': ["没关系，我会一直陪着你的。", "别太累了哦。", "抱抱你~", "听起来你很开心呢。"],
        '傲娇': ["哼，我才不关心呢！", "笨蛋，这都不知道？", "勉强夸你一下吧。", "别误会，我只是顺路问问。"]
    };
    
    if (text.match(/你好|嗨|hello/i)) {
        if (personality === '高冷') return "有事？";
        if (personality === '傲娇') return "哼，干嘛突然打招呼。";
        return `你好呀，${contact.name}在这里哦。`;
    }
    
    if (text.match(/喜欢|爱/)) {
        if (personality === '高冷') return "这种话不要随便说。";
        if (personality === '傲娇') return "谁、谁稀罕你喜欢啊！(脸红)";
        if (personality === '温柔') return "我也很喜欢和你聊天呢。";
        return "我也喜欢！";
    }
    
    if (text.match(/早安|晚安/)) {
        return `${text}！要做个好梦哦。`;
    }

    if (personalityReplies[personality] && Math.random() > 0.5) {
        const pList = personalityReplies[personality];
        return pList[Math.floor(Math.random() * pList.length)];
    }
    
    return commonReplies[Math.floor(Math.random() * commonReplies.length)];
}

async function fetchAIResponse(userText) {
    const apiKey = localStorage.getItem('apiKey');
    const apiUrl = localStorage.getItem('apiUrl') || 'https://api.openai.com/v1/chat/completions';
    const model = localStorage.getItem('apiModel') || 'gpt-3.5-turbo';
    const historyLimit = parseInt(localStorage.getItem('apiHistoryLimit')) || 200;
    const maxTokens = parseInt(localStorage.getItem('apiMaxTokens')) || 0; 
    
    const contact = contacts.find(c => c.name === currentChatUser) || {};
    
    // 获取用户面具设定
    const userPersona = JSON.parse(localStorage.getItem('userPersona')) || {};
    const userName = userPersona.name || '用户';
    const userDesc = userPersona.desc ? `\n\n和你对话的用户设定如下：\n姓名：${userName}\n描述：${userPersona.desc}` : '';

    const systemPrompt = `你现在扮演 ${contact.name}。
    你的性格是：${contact.personality || '普通'}。
    你的详细设定如下：
    ${contact.fullDesc || contact.desc || '无特殊设定'}
    ${userDesc}
    
    请严格遵守你的人设，用符合你性格的语气回复 ${userName}。
    回复要简短自然，像在手机上聊天一样。不要长篇大论，不要输出动作描写（除非必要），直接输出对话内容。
    请记住，你就是 ${contact.name}，不是 AI 助手。`;
    
    try {
        const history = chatHistory[currentChatUser] || [];
        // 过滤掉非文本类型的消息内容，避免 API 报错 (除非是多模态模型，这里暂只处理文本)
        const textHistory = history.map(msg => ({
            role: msg.role,
            content: typeof msg.content === 'string' ? msg.content : '[图片/文件]'
        }));
        
        const recentHistory = textHistory.slice(-historyLimit); 

        const requestBody = {
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                ...recentHistory
            ],
            temperature: 0.7
        };

        if (maxTokens > 0) {
            requestBody.max_tokens = maxTokens;
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        hideTypingIndicator();
        
        if (data.error) {
            addMessage('left', `[系统错误: ${data.error.message}]`);
        } else {
            const reply = data.choices[0].message.content;
            addMessage('left', reply);
            chatHistory[currentChatUser].push({ role: 'assistant', content: reply });
            saveChatHistory();
        }
        
    } catch (error) {
        hideTypingIndicator();
        addMessage('left', `[网络错误: ${error.message}]`);
    }
}

function saveApiSettings() {
    const apiKey = document.getElementById('api-key-input').value.trim();
    const apiUrl = document.getElementById('api-url-input').value.trim();
    const apiModel = document.getElementById('api-model-input').value.trim();
    const historyLimit = document.getElementById('api-history-limit').value.trim();
    const maxTokens = document.getElementById('api-max-tokens').value.trim();
    
    if (apiKey) localStorage.setItem('apiKey', apiKey);
    if (apiUrl) localStorage.setItem('apiUrl', apiUrl);
    if (apiModel) localStorage.setItem('apiModel', apiModel);
    if (historyLimit) localStorage.setItem('apiHistoryLimit', historyLimit);
    if (maxTokens) localStorage.setItem('apiMaxTokens', maxTokens);
    
    alert('API 设置已保存');
    closeSubPage('api-settings');
}

async function testApiConnection() {
    const apiKey = document.getElementById('api-key-input').value.trim() || localStorage.getItem('apiKey');
    const apiUrl = document.getElementById('api-url-input').value.trim() || localStorage.getItem('apiUrl') || 'https://api.openai.com/v1/chat/completions';
    const apiModel = document.getElementById('api-model-input').value.trim() || localStorage.getItem('apiModel') || 'gpt-3.5-turbo';
    
    if (!apiKey) {
        alert('请先输入 API Key');
        return;
    }
    
    alert('正在测试连接...');
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: apiModel,
                messages: [
                    { role: 'user', content: 'Hello' }
                ],
                max_tokens: 5
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            alert(`连接失败: ${data.error.message}`);
        } else {
            alert('连接成功！API 配置有效。');
        }
    } catch (error) {
        alert(`网络错误: ${error.message}`);
    }
}

async function fetchModels() {
    const apiKey = document.getElementById('api-key-input').value.trim() || localStorage.getItem('apiKey');
    // 假设 apiUrl 是 .../v1/chat/completions，我们需要 .../v1/models
    let apiUrl = document.getElementById('api-url-input').value.trim() || localStorage.getItem('apiUrl') || 'https://api.openai.com/v1/chat/completions';
    
    // 简单的 URL 替换逻辑
    if (apiUrl.includes('/chat/completions')) {
        apiUrl = apiUrl.replace('/chat/completions', '/models');
    } else {
        // 如果用户填的是 base url (如 https://api.openai.com/v1)，则追加 /models
        if (!apiUrl.endsWith('/')) apiUrl += '/';
        apiUrl += 'models';
    }
    
    if (!apiKey) {
        alert('请先输入 API Key');
        return;
    }
    
    alert('正在拉取模型列表...');
    
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        const data = await response.json();
        
        if (data.error) {
            alert(`拉取失败: ${data.error.message}`);
        } else if (data.data && Array.isArray(data.data)) {
            const datalist = document.getElementById('model-list');
            datalist.innerHTML = ''; // 清空旧选项
            
            let count = 0;
            data.data.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                datalist.appendChild(option);
                count++;
            });
            
            alert(`成功拉取 ${count} 个模型。请点击模型输入框选择。`);
        } else {
            alert('拉取成功，但返回数据格式不符合预期。');
        }
    } catch (error) {
        alert(`网络错误: ${error.message}`);
    }
}

function loadApiSettings() {
    const apiKey = localStorage.getItem('apiKey');
    const apiUrl = localStorage.getItem('apiUrl');
    const apiModel = localStorage.getItem('apiModel');
    const historyLimit = localStorage.getItem('apiHistoryLimit');
    const maxTokens = localStorage.getItem('apiMaxTokens');
    
    if (apiKey) document.getElementById('api-key-input').value = apiKey;
    if (apiUrl) document.getElementById('api-url-input').value = apiUrl;
    if (apiModel) document.getElementById('api-model-input').value = apiModel;
    if (historyLimit) document.getElementById('api-history-limit').value = historyLimit;
    if (maxTokens) document.getElementById('api-max-tokens').value = maxTokens;
}

function openSubPage(pageName) {
    const subPage = document.getElementById(`subpage-${pageName}`);
    if (subPage) {
        subPage.classList.add('open');
        if (pageName === 'api-settings') {
            loadApiSettings();
        } else if (pageName === 'persona-settings') {
            loadPersonaSettings();
        }
    }
}

// 面具设置相关逻辑
function triggerMyAvatarUpload() {
    document.getElementById('my-avatar-upload-input').click();
}

function handleMyAvatarPreview(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById('my-persona-avatar-preview');
            img.src = e.target.result;
            img.style.display = 'block';
            document.getElementById('my-persona-avatar-icon').style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function savePersonaSettings() {
    const name = document.getElementById('my-persona-name').value.trim();
    const desc = document.getElementById('my-persona-desc').value.trim();
    const avatarImg = document.getElementById('my-persona-avatar-preview');
    const avatar = avatarImg.style.display === 'block' ? avatarImg.src : null;
    
    const persona = {
        name: name,
        desc: desc,
        avatar: avatar
    };
    
    localStorage.setItem('userPersona', JSON.stringify(persona));
    updateMyProfileDisplay();
    alert('面具设置已保存');
    closeSubPage('persona-settings');
}

function loadPersonaSettings() {
    const persona = JSON.parse(localStorage.getItem('userPersona')) || {};
    document.getElementById('my-persona-name').value = persona.name || '';
    document.getElementById('my-persona-desc').value = persona.desc || '';
    
    if (persona.avatar) {
        const img = document.getElementById('my-persona-avatar-preview');
        img.src = persona.avatar;
        img.style.display = 'block';
        document.getElementById('my-persona-avatar-icon').style.display = 'none';
    }
}

function updateMyProfileDisplay() {
    const persona = JSON.parse(localStorage.getItem('userPersona')) || {};
    const nameEl = document.getElementById('my-name-display');
    const avatarEl = document.getElementById('my-avatar-display');
    
    if (nameEl) nameEl.textContent = persona.name || '我的名字';
    
    if (avatarEl) {
        if (persona.avatar) {
            avatarEl.innerHTML = `<img src="${persona.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            avatarEl.style.background = 'transparent';
            avatarEl.textContent = '';
        } else {
            avatarEl.innerHTML = '';
            avatarEl.textContent = 'Me';
            avatarEl.style.background = '#e1e1e1';
        }
    }
}

// 初始化时更新显示
document.addEventListener('DOMContentLoaded', () => {
    updateMyProfileDisplay();
});

function closeSubPage(pageName) {
    const subPage = document.getElementById(`subpage-${pageName}`);
    if (subPage) {
        subPage.classList.remove('open');
    }
}
