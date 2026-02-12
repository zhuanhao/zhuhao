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

// 全局错误捕获 (调试用)
window.onerror = function(message, source, lineno, colno, error) {
    console.error(error);
    // 仅在聊天界面显示关键错误，避免打扰但能提示问题
    const container = document.getElementById('chat-messages-container');
    if (container && document.getElementById('chat-detail-view').style.display !== 'none') {
        const msgDiv = document.createElement('div');
        msgDiv.style.color = '#ff3b30';
        msgDiv.style.fontSize = '10px';
        msgDiv.style.textAlign = 'center';
        msgDiv.style.margin = '5px 0';
        msgDiv.textContent = `⚠️ 系统错误: ${message}`;
        container.appendChild(msgDiv);
    }
};

// 打开 APP
function openApp(appName) {
    const appElement = document.getElementById(`app-${appName}`) || document.getElementById('app-placeholder');
    
    if (appName === 'worldbook') {
        renderWorldbookList();
    }

    if (appElement.id === 'app-placeholder') {
        const titles = {
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

    // 更新 Header
    const titleEl = document.getElementById('chat-app-title');
    const rightBtn = document.getElementById('chat-app-right-btn');
    
    if (tabName === 'messages') {
        titleEl.textContent = '聊天';
        rightBtn.style.display = 'block';
        rightBtn.onclick = () => {
            // 消息页面的加号：发起群聊/添加朋友 (这里简化为添加联系人)
            showAddContactOptions();
        };
        document.getElementById('chat-list-view').style.display = 'block';
        document.getElementById('chat-detail-view').style.display = 'none';
    } else if (tabName === 'contacts') {
        titleEl.textContent = '联系人';
        rightBtn.style.display = 'block';
        rightBtn.onclick = () => {
            // 联系人页面的加号：添加联系人
            showAddContactOptions();
        };
    } else if (tabName === 'moments') {
        titleEl.textContent = '动态';
        rightBtn.style.display = 'block';
        rightBtn.onclick = () => {
            alert('发布动态功能开发中...');
        };
    } else if (tabName === 'me') {
        titleEl.textContent = '我';
        rightBtn.style.display = 'none';
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
            
            // 获取最新消息
            const history = chatHistory[contact.name] || [];
            let lastMsg = '点击进入聊天...';
            let lastTime = '';
            
            if (history.length > 0) {
                const msg = history[history.length - 1];
                if (msg.type === 'text') lastMsg = msg.content;
                else if (msg.type === 'image') lastMsg = '[图片]';
                else if (msg.type === 'redpacket') lastMsg = '[红包]';
                else if (msg.type === 'transfer') lastMsg = '[转账]';
                else if (msg.type === 'file') lastMsg = '[文件]';
                else if (msg.type === 'listen_invite') lastMsg = '[一起听邀请]';
                else if (msg.type === 'listen_response') lastMsg = '[一起听回复]';
                
                // 格式化时间
                if (msg.timestamp) {
                    const date = new Date(msg.timestamp);
                    const now = new Date();
                    if (date.toDateString() === now.toDateString()) {
                        lastTime = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                    } else {
                        lastTime = date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
                    }
                }
            }
            
            // 优先显示备注
            const displayName = contact.remark || contact.name;

            item.innerHTML = `
                ${avatarHtml}
                <div class="list-info">
                    <div class="list-title">${displayName}</div>
                    <div class="list-subtitle">${lastMsg}</div>
                </div>
                <div class="list-time">${lastTime}</div>
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
    
    // 移除所有 Action Sheet 的 active 状态
    const sheets = document.querySelectorAll('.action-sheet');
    sheets.forEach(sheet => sheet.classList.remove('active'));
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
    
    // 填充世界书下拉框
    const select = document.getElementById('new-contact-worldbook');
    select.innerHTML = '<option value="">无</option>';
    worldbooks.forEach(wb => {
        const option = document.createElement('option');
        option.value = wb.id;
        option.textContent = wb.name;
        select.appendChild(option);
    });

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

async function analyzeContactInfo() {
    const desc = document.getElementById('doc-content-preview').dataset.fullText;
    if (!desc) {
        alert('请先上传设定文档或导入酒馆卡');
        return;
    }
    
    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey) {
        alert('请先在设置中配置 API Key');
        return;
    }
    
    const btn = document.querySelector('.settings-group-title i.fa-magic').parentNode;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 分析中...';
    
    try {
        const prompt = `请阅读以下角色设定，并提取关键信息。
        返回纯 JSON 格式：{"name": "...", "gender": "...", "age": "...", "personality": "..."}
        如果找不到某项信息，请留空字符串。
        不要包含 Markdown 代码块标记。
        
        设定内容：
        ${desc.substring(0, 3000)}`; // 截断防止超长
        
        let apiUrl = localStorage.getItem('apiUrl') || 'https://api.openai.com/v1/chat/completions';
        if (!apiUrl.includes('/chat/completions')) {
            apiUrl = apiUrl.replace(/\/+$/, '');
            if (apiUrl.endsWith('/v1')) apiUrl += '/chat/completions';
            else apiUrl += '/v1/chat/completions';
        }
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: localStorage.getItem('apiModel') || 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        const data = await response.json();
        let content = data.choices[0].message.content.trim();
        
        // 清理 Markdown
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const info = JSON.parse(content);
        
        if (info.name) document.getElementById('new-contact-name').value = info.name;
        if (info.gender) document.getElementById('new-contact-gender').value = info.gender;
        if (info.age) document.getElementById('new-contact-age').value = info.age;
        if (info.personality) document.getElementById('new-contact-personality').value = info.personality;
        
        alert('识别完成！');
        
    } catch (e) {
        console.error(e);
        alert('识别失败: ' + e.message);
    } finally {
        btn.innerHTML = originalText;
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
    const worldbookId = document.getElementById('new-contact-worldbook').value;
    
    const newContact = {
        id: Date.now().toString(),
        name: name,
        avatar: avatar,
        gender: gender,
        age: age,
        personality: personality,
        desc: docContent.substring(0, 50) + (docContent.length > 50 ? '...' : ''),
        fullDesc: docContent,
        worldbookId: worldbookId || null
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
                    alert('JSON 解析失败: ' + err.message);
                }
            };
            reader.readAsText(file);
        } else if (file.type === 'image/png') {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const arrayBuffer = e.target.result;
                    const textChunks = extractTextFromPng(arrayBuffer);
                    
                    let found = false;
                    for (const chunk of textChunks) {
                        try {
                            // 尝试 Base64 解码 (支持 UTF-8)
                            let jsonStr;
                            try {
                                // 尝试标准 UTF-8 解码
                                const binaryString = atob(chunk.text);
                                const bytes = new Uint8Array(binaryString.length);
                                for (let i = 0; i < binaryString.length; i++) {
                                    bytes[i] = binaryString.charCodeAt(i);
                                }
                                jsonStr = new TextDecoder('utf-8').decode(bytes);
                            } catch (e) {
                                // 回退到普通 atob
                                jsonStr = atob(chunk.text);
                            }

                            const json = JSON.parse(jsonStr);
                            // 简单验证是否像酒馆卡数据
                            if (json.name || json.data?.name || json.spec) {
                                fillFormWithCardData(json);
                                found = true;
                                break;
                            }
                        } catch (e) {
                            // 忽略解析失败的块
                            console.log('Chunk parse failed:', chunk.keyword, e);
                        }
                    }
                    
                    if (!found) {
                        alert('未在 PNG 中找到有效的酒馆卡数据。\n可能原因：\n1. 图片不包含元数据\n2. 数据使用了压缩格式(zTXt)暂不支持\n3. 数据格式不兼容');
                    }
                } catch (err) {
                    console.error(err);
                    alert('PNG 解析错误: ' + err.message);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    }
    hideActionSheet();
}

function extractTextFromPng(arrayBuffer) {
    const dataView = new DataView(arrayBuffer);
    // 检查 PNG 签名
    if (dataView.getUint32(0) !== 0x89504E47 || dataView.getUint32(4) !== 0x0D0A1A0A) {
        throw new Error('不是有效的 PNG 文件');
    }

    let offset = 8; // Skip PNG signature
    const chunks = [];

    while (offset < arrayBuffer.byteLength) {
        if (offset + 8 > arrayBuffer.byteLength) break; // 防止越界
        
        const length = dataView.getUint32(offset);
        offset += 4;
        const type = String.fromCharCode(
            dataView.getUint8(offset),
            dataView.getUint8(offset + 1),
            dataView.getUint8(offset + 2),
            dataView.getUint8(offset + 3)
        );
        offset += 4;

        if (type === 'tEXt') {
            const keywordEnd = findNullByte(arrayBuffer, offset, length);
            if (keywordEnd !== -1) {
                const keyword = decodeText(arrayBuffer, offset, keywordEnd - offset);
                const text = decodeText(arrayBuffer, keywordEnd + 1, length - (keywordEnd - offset) - 1);
                chunks.push({ keyword, text });
            }
        } else if (type === 'zTXt') {
            console.warn('Found zTXt chunk, compression not supported without external library.');
        }

        offset += length + 4; // Skip data and CRC
    }
    return chunks;
}

function findNullByte(buffer, offset, length) {
    const uint8Array = new Uint8Array(buffer, offset, length);
    for (let i = 0; i < length; i++) {
        if (uint8Array[i] === 0) return offset + i;
    }
    return -1;
}

function decodeText(buffer, offset, length) {
    const uint8Array = new Uint8Array(buffer, offset, length);
    // 使用 TextDecoder 处理 UTF-8 (虽然 Base64 通常是 ASCII，但关键字可能是 UTF-8)
    return new TextDecoder().decode(uint8Array);
}

function fillFormWithCardData(data) {
    openAddContactForm();
    const charData = data.data || data;
    document.getElementById('new-contact-name').value = charData.name || '';
    document.getElementById('new-contact-personality').value = charData.personality || '';
    
    const desc = charData.description || charData.scenario || '';
    showDocPreview(desc);

    // 尝试正则提取性别和年龄 (兜底)
    if (desc) {
        const genderMatch = desc.match(/(?:性别|Gender)[:：]\s*([^\s,，。]+)/i);
        if (genderMatch) document.getElementById('new-contact-gender').value = genderMatch[1];
        
        const ageMatch = desc.match(/(?:年龄|Age)[:：]\s*([^\s,，。]+)/i);
        if (ageMatch) document.getElementById('new-contact-age').value = ageMatch[1];
    }

    // 处理世界书
    if (charData.character_book) {
        const wbName = (charData.name || '未命名') + '的世界书';
        const newWb = {
            id: Date.now().toString(),
            name: wbName,
            entries: []
        };

        // 解析 entries
        if (charData.character_book.entries && Array.isArray(charData.character_book.entries)) {
            newWb.entries = charData.character_book.entries.map(entry => ({
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                keys: Array.isArray(entry.keys) ? entry.keys : (entry.keys || '').split(',').map(k => k.trim()),
                content: entry.content || '',
                enabled: entry.enabled !== false
            }));
        }

        if (newWb.entries.length > 0) {
            worldbooks.push(newWb);
            saveWorldbooks();
            
            // 刷新下拉框并选中
            const select = document.getElementById('new-contact-worldbook');
            const option = document.createElement('option');
            option.value = newWb.id;
            option.textContent = newWb.name;
            select.appendChild(option);
            select.value = newWb.id;
            
            alert(`检测到关联世界书，已自动导入并选中：${wbName}`);
        }
    }

    alert('已自动填充部分信息，请补充完整');
}

// 聊天功能
let currentChatUser = '';
let currentQuote = null; // 引用消息
let typingTimeouts = []; // 存储打字定时器

function replyMessage() {
    const msg = findMessageById(currentMsgId);
    if (!msg) return;
    
    currentQuote = {
        name: msg.role === 'user' ? '我' : currentChatUser,
        content: typeof msg.content === 'string' ? msg.content : '[非文本消息]'
    };
    
    // 显示引用预览
    let preview = document.getElementById('quote-preview');
    if (!preview) {
        preview = document.createElement('div');
        preview.id = 'quote-preview';
        preview.style.padding = '10px 15px';
        preview.style.background = '#f7f7f7';
        preview.style.borderTop = '1px solid #e5e5e5';
        preview.style.display = 'flex';
        preview.style.justifyContent = 'space-between';
        preview.style.alignItems = 'center';
        preview.style.fontSize = '12px';
        preview.style.color = '#666';
        
        const text = document.createElement('div');
        text.id = 'quote-preview-text';
        text.style.flex = '1';
        text.style.whiteSpace = 'nowrap';
        text.style.overflow = 'hidden';
        text.style.textOverflow = 'ellipsis';
        text.style.marginRight = '10px';
        
        const closeBtn = document.createElement('div');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.padding = '5px';
        closeBtn.onclick = cancelQuote;
        
        preview.appendChild(text);
        preview.appendChild(closeBtn);
        
        // 插入到输入框上方
        const inputBar = document.querySelector('.chat-input-bar');
        inputBar.parentNode.insertBefore(preview, inputBar);
    }
    
    document.getElementById('quote-preview-text').textContent = `引用 ${currentQuote.name}: ${currentQuote.content}`;
    preview.style.display = 'flex';
    
    hideActionSheet();
    document.getElementById('chat-input').focus();
}

function cancelQuote() {
    currentQuote = null;
    const preview = document.getElementById('quote-preview');
    if (preview) preview.style.display = 'none';
}

// 多选模式
let isMultiSelectMode = false;
let selectedMsgIds = new Set();

function enterMultiSelectMode() {
    isMultiSelectMode = true;
    selectedMsgIds.clear();
    document.body.classList.add('multi-select-mode');
    hideActionSheet();
    
    // 显示所有复选框
    document.querySelectorAll('.msg-checkbox').forEach(cb => {
        cb.style.display = 'flex';
        cb.classList.remove('checked');
    });
    
    // 显示底部操作栏
    showMultiSelectBar();
}

function exitMultiSelectMode() {
    isMultiSelectMode = false;
    selectedMsgIds.clear();
    document.body.classList.remove('multi-select-mode');
    
    // 隐藏复选框
    document.querySelectorAll('.msg-checkbox').forEach(cb => {
        cb.style.display = 'none';
        cb.classList.remove('checked');
    });
    
    // 隐藏底部操作栏
    const bar = document.getElementById('multi-select-bar');
    if (bar) bar.remove();
}

function showMultiSelectBar() {
    let bar = document.getElementById('multi-select-bar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'multi-select-bar';
        bar.style.position = 'absolute';
        bar.style.bottom = '0';
        bar.style.left = '0';
        bar.style.width = '100%';
        bar.style.height = '50px';
        bar.style.background = '#f7f7f7';
        bar.style.borderTop = '1px solid #e5e5e5';
        bar.style.display = 'flex';
        bar.style.justifyContent = 'space-around';
        bar.style.alignItems = 'center';
        bar.style.zIndex = '1000';
        
        bar.innerHTML = `
            <div onclick="forwardSelectedMessages()" style="display:flex; flex-direction:column; align-items:center; font-size:10px; color:#333;">
                <i class="fas fa-share" style="font-size:18px; margin-bottom:2px;"></i>
                转发
            </div>
            <div onclick="deleteSelectedMessages()" style="display:flex; flex-direction:column; align-items:center; font-size:10px; color:#333;">
                <i class="fas fa-trash" style="font-size:18px; margin-bottom:2px;"></i>
                删除
            </div>
            <div onclick="exitMultiSelectMode()" style="display:flex; flex-direction:column; align-items:center; font-size:10px; color:#333;">
                <i class="fas fa-times" style="font-size:18px; margin-bottom:2px;"></i>
                取消
            </div>
        `;
        
        document.getElementById('chat-detail-view').appendChild(bar);
    }
    bar.style.display = 'flex';
}

function updateMultiSelectCount() {
    // 重新计算选中项
    selectedMsgIds.clear();
    document.querySelectorAll('.msg-checkbox.checked').forEach(cb => {
        const row = cb.closest('.message-row');
        if (row) selectedMsgIds.add(row.dataset.id);
    });
}

function deleteSelectedMessages() {
    if (selectedMsgIds.size === 0) return;
    
    if (confirm(`确定删除选中的 ${selectedMsgIds.size} 条消息吗？`)) {
        if (chatHistory[currentChatUser]) {
            chatHistory[currentChatUser] = chatHistory[currentChatUser].filter(m => !selectedMsgIds.has(String(m.id)));
            saveChatHistory();
            
            // 刷新界面
            enterChat(contacts.find(c => c.name === currentChatUser).id);
        }
        exitMultiSelectMode();
    }
}

function forwardSelectedMessages() {
    if (selectedMsgIds.size === 0) return;
    
    // 简单实现：合并文本复制到剪贴板
    let text = "";
    // 按时间顺序排序
    const sortedIds = Array.from(selectedMsgIds).sort((a, b) => a - b);
    
    sortedIds.forEach(id => {
        const msg = findMessageById(id);
        if (msg) {
            const name = msg.role === 'user' ? '我' : currentChatUser;
            const content = typeof msg.content === 'string' ? msg.content : '[非文本消息]';
            text += `${name}: ${content}\n`;
        }
    });
    
    navigator.clipboard.writeText(text).then(() => {
        alert('已复制选中消息内容');
        exitMultiSelectMode();
    });
}

function handlePoke(userName) {
    const contact = contacts.find(c => c.name === userName);
    const suffix = (contact && contact.pokeSuffix) ? contact.pokeSuffix : "拍了拍我的肩膀";
    
    // 显示系统消息
    const text = `你${suffix}`;
    addMessage('system', text);
    
    // 保存到历史
    if (!chatHistory[currentChatUser]) chatHistory[currentChatUser] = [];
    chatHistory[currentChatUser].push({
        role: 'system',
        content: text,
        type: 'system',
        id: Date.now().toString(),
        timestamp: Date.now()
    });
    saveChatHistory();
    
    // 触发震动
    if (navigator.vibrate) navigator.vibrate(50);
}

// 聊天历史记录 (持久化存储)
let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || {};

function saveChatHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

function enterChat(userId) {
    const contact = contacts.find(c => c.id === userId);
    if (!contact) return;
    
    currentChatUser = contact.name;
    // 优先显示备注
    document.getElementById('chat-header-name').textContent = contact.remark || contact.name;
    
    // 应用背景和 CSS
    applyChatBg(contact.chatBg);
    applyBubbleCss(contact.bubbleCss);

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
            const thought = msg.thought || null; // 加载心声
            const msgId = msg.id || null; // 加载 ID
            const quote = msg.quote || null; // 加载引用
            const isRecalled = msg.isRecalled || false;
            const originalContent = msg.originalContent || null;
            addMessage(msg.role === 'user' ? 'right' : 'left', content, type, thought, msgId, quote, isRecalled, originalContent);
        });
    } else {
        addMessage('left', `你好，我是 ${contact.name}。`);
    }
    
    // 初始化表情
    initEmojis();
    
    // 检查角色设定并提示（不跳转）
    if (!contact.desc || contact.desc.trim() === '' || contact.desc === '默认联系人') {
        setTimeout(() => {
            // 仅当没有历史消息或只有一条欢迎消息时提示，避免重复打扰
            const history = chatHistory[currentChatUser] || [];
            if (history.length <= 1) {
                addMessage('left', '（系统提示：当前角色暂无详细设定/面具。您可以在右上角设置中完善设定以获得更好的聊天体验。）', 'text');
            }
        }, 800);
    }
}

function exitChat() {
    // 仅隐藏 UI 上的输入状态（如果存在）
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();

    // 退出多选模式
    if (isMultiSelectMode) exitMultiSelectMode();
    // 取消引用
    cancelQuote();

    document.getElementById('chat-detail-view').style.display = 'none';
    document.getElementById('chat-list-view').style.display = 'block';
    document.querySelector('.app-footer-nav').style.display = 'flex';
    document.getElementById('chat-app-header').style.display = 'flex';
    hideBottomPanels();
    
    const menu = document.getElementById('chat-menu-dropdown');
    if (menu) menu.classList.remove('active');
}

function handleInputState() {
    const input = document.getElementById('chat-input');
    const btnPlus = document.getElementById('btn-plus');
    const btnSend = document.getElementById('btn-send');
    
    if (input.value.trim()) {
        btnPlus.style.display = 'none';
        btnSend.style.display = 'block';
    } else {
        btnPlus.style.display = 'flex';
        btnSend.style.display = 'none';
    }
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    
    if (text) {
        sendUserMessage(text);
        input.value = '';
        handleInputState();
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
    // 如果是带含义的表情包对象 {url, meaning}，在显示时只取 url，在存储时保留完整对象
    
    let displayContent = content;
    if (type === 'image' && typeof content === 'object' && content.url) {
        displayContent = content.url;
    }
    
    // 构造消息对象
    const msgObj = { 
        role: 'user', 
        content: content, 
        type: type, 
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now()
    };
    
    if (currentQuote) {
        msgObj.quote = {
            name: currentQuote.name,
            content: currentQuote.content
        };
        cancelQuote();
    }
    
    addMessage('right', displayContent, type, null, msgObj.id, msgObj.quote);
    
    if (!chatHistory[currentChatUser]) chatHistory[currentChatUser] = [];
    
    chatHistory[currentChatUser].push(msgObj);
    saveChatHistory();
    
    // 检查自动总结
    checkAutoSummary(currentChatUser);

    // 自动触发 AI 回复 (用户要求取消自动回复，改为手动触发)
    // triggerAiReply();
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
    // 更新标题栏状态
    const headerName = document.getElementById('chat-header-name');
    if (headerName) {
        if (!headerName.dataset.originalName) {
            headerName.dataset.originalName = headerName.textContent;
        }
        headerName.textContent = '对方正在输入...';
    }

    // 显示气泡
    const container = document.getElementById('chat-messages-container');
    // 避免重复添加
    if (document.getElementById('typing-indicator')) return;

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

    // 安全网：30秒后自动移除，防止因错误导致一直卡住
    setTimeout(() => {
        hideTypingIndicator();
    }, 30000);
}

function hideTypingIndicator() {
    // 恢复标题栏状态
    const headerName = document.getElementById('chat-header-name');
    if (headerName && headerName.dataset.originalName) {
        headerName.textContent = headerName.dataset.originalName;
        // 不删除 dataset，以防快速连续调用
    }

    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

function addMessage(side, content, type = 'text', thought = null, msgId = null, quote = null, isRecalled = false, originalContent = null) {
    const container = document.getElementById('chat-messages-container');
    
    // 处理撤回消息
    if (isRecalled) {
        const contact = contacts.find(c => c.name === currentChatUser) || {};
        
        // 如果是自己撤回，或者对方撤回但未开启可见模式 -> 显示系统提示
        if (side === 'right' || !contact.recallVisible) {
            const recallTip = document.createElement('div');
            recallTip.className = 'message-row';
            recallTip.dataset.id = msgId || Date.now();
            recallTip.style.display = 'flex';
            recallTip.style.justifyContent = 'center';
            recallTip.style.marginBottom = '15px';
            recallTip.innerHTML = `<div style="text-align:center; font-size:12px; color:#999;">${side === 'right' ? '你' : '对方'}撤回了一条消息</div>`;
            container.appendChild(recallTip);
            container.scrollTop = container.scrollHeight;
            return;
        } else {
            // 对方撤回 且 开启可见 -> 显示原内容
            content = originalContent || content || '[已撤回内容]';
        }
    }

    const msgDiv = document.createElement('div');
    msgDiv.className = 'message-row';
    msgDiv.dataset.id = msgId || Date.now(); // 确保有 ID
    msgDiv.style.display = 'flex';
    msgDiv.style.marginBottom = '15px';
    msgDiv.style.position = 'relative';

    // 系统消息处理
    if (type === 'system') {
        msgDiv.style.justifyContent = 'center';
        msgDiv.innerHTML = `<div style="background: rgba(0,0,0,0.05); color: #888; font-size: 12px; padding: 5px 10px; border-radius: 10px;">${content}</div>`;
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
        return;
    }

    msgDiv.style.justifyContent = side === 'right' ? 'flex-end' : 'flex-start';
    msgDiv.style.alignItems = 'flex-start';
    
    // 多选复选框 (默认隐藏)
    const checkbox = document.createElement('div');
    checkbox.className = 'msg-checkbox';
    checkbox.innerHTML = '<i class="fas fa-check"></i>';
    checkbox.style.display = 'none'; // CSS 控制显示
    checkbox.onclick = (e) => {
        e.stopPropagation();
        checkbox.classList.toggle('checked');
        updateMultiSelectCount();
    };
    msgDiv.appendChild(checkbox);

    // 获取头像 URL
    let avatarUrl = '';
    let avatarName = '';
    if (side === 'left') {
        const contact = contacts.find(c => c.name === currentChatUser);
        if (contact) {
            avatarUrl = contact.avatar;
            avatarName = contact.name[0];
        }
    } else {
        const userPersona = JSON.parse(localStorage.getItem('userPersona')) || {};
        avatarUrl = userPersona.avatar;
        avatarName = (userPersona.name || '我')[0];
    }

    // 构建头像元素
    const avatarEl = document.createElement('div');
    avatarEl.style.width = '40px';
    avatarEl.style.height = '40px';
    avatarEl.style.borderRadius = '5px';
    avatarEl.style.overflow = 'hidden';
    avatarEl.style.flexShrink = '0';
    avatarEl.style.display = 'flex';
    avatarEl.style.justifyContent = 'center';
    avatarEl.style.alignItems = 'center';
    avatarEl.style.fontSize = '16px';
    avatarEl.style.color = '#fff';
    avatarEl.style.backgroundColor = '#ccc';
    avatarEl.style.cursor = 'pointer';
    
    if (avatarUrl) {
        avatarEl.innerHTML = `<img src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover;">`;
    } else {
        avatarEl.textContent = avatarName;
    }

    // 绑定心声点击事件 (仅左侧)
    if (side === 'left') {
        // 单击查看心声 (传入 null 让 showThought 动态查找最新数据)
        avatarEl.onclick = () => showThought(null, msgDiv.dataset.id);
        
        // 双击重新生成心声
        avatarEl.ondblclick = (e) => {
            e.stopPropagation();
            handlePoke(currentChatUser); // 双击头像触发戳一戳
        };
        
        avatarEl.style.marginRight = '10px';
    } else {
        avatarEl.style.marginLeft = '10px';
    }

    const bubbleContainer = document.createElement('div');
    bubbleContainer.style.maxWidth = '70%';
    bubbleContainer.style.display = 'flex';
    bubbleContainer.style.flexDirection = 'column';
    bubbleContainer.style.alignItems = side === 'right' ? 'flex-end' : 'flex-start';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.style.padding = '10px 15px';
    bubble.style.borderRadius = '6px';
    bubble.style.fontSize = '16px';
    bubble.style.lineHeight = '1.5';
    bubble.style.wordWrap = 'break-word';
    bubble.style.position = 'relative';
    bubble.style.cursor = 'pointer';
    
    // 绑定消息菜单事件
    bubble.onclick = (e) => {
        if (isMultiSelectMode) {
            checkbox.click();
        } else {
            showMsgMenu(msgDiv.dataset.id, e, side, content, type);
        }
    };

    if (side === 'right') {
        bubble.style.backgroundColor = '#95ec69';
        bubble.style.color = 'black';
    } else {
        bubble.style.backgroundColor = 'white';
        bubble.style.color = 'black';
        bubble.style.border = '1px solid #e5e5e5';
    }
    
    // 撤回样式
    if (isRecalled) {
        bubble.style.opacity = '0.6';
        bubble.style.textDecoration = 'line-through';
        bubble.style.filter = 'grayscale(100%)';
        
        const tip = document.createElement('div');
        tip.style.fontSize = '10px';
        tip.style.color = '#ff3b30';
        tip.style.marginTop = '5px';
        tip.style.textDecoration = 'none';
        tip.textContent = '已撤回';
        bubble.appendChild(tip);
    }
    
    // 渲染引用
    if (quote) {
        const quoteDiv = document.createElement('div');
        quoteDiv.style.fontSize = '12px';
        quoteDiv.style.color = '#888';
        quoteDiv.style.marginBottom = '5px';
        quoteDiv.style.padding = '5px';
        quoteDiv.style.borderLeft = '2px solid #ccc';
        quoteDiv.style.backgroundColor = 'rgba(0,0,0,0.05)';
        quoteDiv.textContent = `${quote.name}: ${quote.content}`;
        bubble.appendChild(quoteDiv);
    }
    
    // 根据类型渲染内容
    if (type === 'text') {
        const textSpan = document.createElement('span');
        textSpan.textContent = content;
        bubble.appendChild(textSpan);
    } else if (type === 'image') {
        bubble.style.padding = '5px';
        bubble.style.backgroundColor = 'transparent';
        bubble.style.border = 'none';
        bubble.innerHTML = `<img src="${content}" style="max-width: 100%; border-radius: 5px;">`;
    } else if (type === 'redpacket') {
        bubble.style.backgroundColor = '#fa9d3b';
        bubble.style.color = 'white';
        bubble.style.border = 'none';
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
        bubble.style.border = 'none';
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
    } else if (type === 'listen_invite') {
        bubble.style.backgroundColor = 'white';
        bubble.style.color = '#333';
        bubble.style.border = '1px solid #eee';
        bubble.style.padding = '12px';
        bubble.style.width = '200px';
        
        const playlistName = content.title || '未命名歌单';
        const count = content.playlist ? content.playlist.length : 0;
        const cover = content.cover || 'https://picsum.photos/100/100?random=music';
        
        bubble.innerHTML = `
            <div style="display:flex; align-items:center; margin-bottom:8px;">
                <div style="width:40px; height:40px; border-radius:4px; overflow:hidden; margin-right:10px; flex-shrink:0;">
                    <img src="${cover}" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <div style="overflow:hidden;">
                    <div style="font-weight:bold; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${playlistName}</div>
                    <div style="font-size:12px; color:#888;">${count} 首歌曲</div>
                </div>
            </div>
            <div style="font-size:12px; color:#fa9d3b; border-top:1px solid #eee; padding-top:8px;">
                <i class="fas fa-headphones-alt"></i> 邀请你一起听
            </div>
        `;
    } else if (type === 'listen_response') {
        bubble.style.backgroundColor = 'white';
        bubble.style.color = '#333';
        bubble.style.border = '1px solid #eee';
        bubble.style.padding = '12px';
        bubble.style.width = '180px';
        
        const status = content.status;
        const isAccepted = status === 'accepted';
        const icon = isAccepted ? 'check-circle' : 'times-circle';
        const color = isAccepted ? '#07c160' : '#ff5151';
        const text = isAccepted ? '接受了邀请' : '拒绝了邀请';
        
        bubble.innerHTML = `
            <div style="display:flex; align-items:center;">
                <div style="font-size:24px; margin-right:10px; color:${color};">
                    <i class="fas fa-${icon}"></i>
                </div>
                <div>
                    <div style="font-weight:bold; font-size:14px;">${text}</div>
                    <div style="font-size:12px; color:#888;">${isAccepted ? '正在一起听...' : '下次吧'}</div>
                </div>
            </div>
        `;
    }
    
    bubbleContainer.appendChild(bubble);

    if (side === 'left') {
        msgDiv.appendChild(avatarEl);
        msgDiv.appendChild(bubbleContainer);
    } else {
        msgDiv.appendChild(bubbleContainer);
        msgDiv.appendChild(avatarEl);
    }
    
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

function showThought(thought, msgId) {
    // 如果 thought 为空，尝试从历史记录查找
    if (!thought && msgId) {
        const msg = findMessageById(msgId);
        if (msg && msg.thought) {
            thought = msg.thought;
        }
    }

    // 即使 thought 为空，只要是 AI 的消息，也显示弹窗（可能需要重新生成）
    const msg = findMessageById(msgId);
    if (!msg || msg.role !== 'assistant') return;

    if (!thought) thought = ''; // 确保不为 undefined
    
    let thoughtEl = document.getElementById('thought-bubble-overlay');
    if (!thoughtEl) {
        thoughtEl = document.createElement('div');
        thoughtEl.id = 'thought-bubble-overlay';
        thoughtEl.style.position = 'fixed';
        thoughtEl.style.top = '0';
        thoughtEl.style.left = '0';
        thoughtEl.style.width = '100%';
        thoughtEl.style.height = '100%';
        thoughtEl.style.backgroundColor = 'rgba(0,0,0,0.5)';
        thoughtEl.style.zIndex = '2000';
        thoughtEl.style.display = 'flex';
        thoughtEl.style.justifyContent = 'center';
        thoughtEl.style.alignItems = 'center';
        thoughtEl.onclick = () => { thoughtEl.style.display = 'none'; };
        
        const contentEl = document.createElement('div');
        contentEl.className = 'thought-content';
        contentEl.style.backgroundColor = '#fff';
        contentEl.style.padding = '20px';
        contentEl.style.borderRadius = '15px';
        contentEl.style.maxWidth = '80%';
        contentEl.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
        contentEl.style.position = 'relative';
        contentEl.style.animation = 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        
        const icon = document.createElement('div');
        icon.innerHTML = '<i class="fas fa-heart" style="color: #ff5151; font-size: 24px; margin-bottom: 10px;"></i>';
        icon.style.textAlign = 'center';
        
        const text = document.createElement('div');
        text.id = 'thought-text';
        text.style.fontSize = '16px';
        text.style.color = '#333';
        text.style.lineHeight = '1.6';
        text.style.fontStyle = 'italic';
        
        contentEl.appendChild(icon);
        contentEl.appendChild(text);
        thoughtEl.appendChild(contentEl);
        document.body.appendChild(thoughtEl);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes popIn {
                from { transform: scale(0.5); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.getElementById('thought-text').textContent = thought;
    thoughtEl.style.display = 'flex';
    
    // 移除旧的按钮
    const oldBtn = document.getElementById('regenerate-thought-btn');
    if (oldBtn) oldBtn.remove();
    
    if (!thought || thought.trim() === '') {
        // 如果是空字符串且不是在 Loading 状态
        const contentEl = thoughtEl.querySelector('.thought-content');
        if (contentEl.querySelector('.thought-spinner')) return;

        document.getElementById('thought-text').innerHTML = '<span style="color:#999;">（心声未生成，请点击下方按钮加载）</span>';
        
        const btn = document.createElement('button');
        btn.id = 'regenerate-thought-btn';
        btn.textContent = '🔄 重新加载心声';
        btn.style.marginTop = '20px';
        btn.style.padding = '10px 20px';
        btn.style.border = 'none';
        btn.style.borderRadius = '20px';
        btn.style.backgroundColor = '#07c160';
        btn.style.color = '#fff';
        btn.style.fontSize = '14px';
        btn.style.fontWeight = 'bold';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        btn.style.transition = 'transform 0.1s';
        
        btn.onmousedown = () => btn.style.transform = 'scale(0.95)';
        btn.onmouseup = () => btn.style.transform = 'scale(1)';
        
        // 查找当前消息 ID
        // 这里需要一个全局变量或者从 DOM 查找
        // 简单起见，我们假设用户刚刚点击了某条消息
        // 但 showThought 是通过 onclick 触发的，我们可以传递 msgId
        // 修改 showThought 签名
    }
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

function togglePanelExpand() {
    const panel = document.getElementById('emoji-panel');
    const icon = document.getElementById('expand-icon');
    
    if (panel.classList.contains('expanded')) {
        panel.classList.remove('expanded');
        if (icon) icon.className = 'fas fa-expand-alt';
    } else {
        panel.classList.add('expanded');
        if (icon) icon.className = 'fas fa-compress-alt';
    }
}

function hideBottomPanels() {
    const emojiPanel = document.getElementById('emoji-panel');
    emojiPanel.classList.remove('active');
    emojiPanel.classList.remove('expanded'); // 收起时同时重置高度
    const icon = document.getElementById('expand-icon');
    if (icon) icon.className = 'fas fa-expand-alt';

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
    
    // 默认表情带含义
    const emojis = [
        {char:'😀', mean:'开心'}, {char:'😃', mean:'大笑'}, {char:'😄', mean:'愉快'}, {char:'😁', mean:'嘻嘻'}, 
        {char:'😆', mean:'笑眯眯'}, {char:'😅', mean:'汗'}, {char:'😂', mean:'笑哭'}, {char:'🤣', mean:'笑滚'}, 
        {char:'😊', mean:'微笑'}, {char:'😇', mean:'天使'}, {char:'🙂', mean:'呵呵'}, {char:'🙃', mean:'倒脸'}, 
        {char:'😉', mean:'眨眼'}, {char:'😌', mean:'松气'}, {char:'😍', mean:'色'}, {char:'🥰', mean:'喜爱'}, 
        {char:'😘', mean:'飞吻'}, {char:'😗', mean:'亲亲'}, {char:'😙', mean:'亲'}, {char:'😚', mean:'羞亲'}, 
        {char:'😋', mean:'好吃'}, {char:'😛', mean:'吐舌'}, {char:'😝', mean:'鬼脸'}, {char:'😜', mean:'调皮'}, 
        {char:'🤪', mean:'滑稽'}, {char:'🤨', mean:'挑眉'}, {char:'🧐', mean:'观察'}, {char:'🤓', mean:'书呆'}, 
        {char:'😎', mean:'酷'}, {char:'🤩', mean:'崇拜'}, {char:'🥳', mean:'庆祝'}, {char:'😏', mean:'坏笑'}, 
        {char:'😒', mean:'不屑'}, {char:'😞', mean:'失望'}, {char:'😔', mean:'低落'}, {char:'😟', mean:'担心'}, 
        {char:'😕', mean:'困惑'}, {char:'🙁', mean:'不开心'}, {char:'☹️', mean:'苦脸'}, {char:'😣', mean:'痛苦'}, 
        {char:'😖', mean:'抓狂'}, {char:'😫', mean:'累'}, {char:'😩', mean:'疲惫'}, {char:'🥺', mean:'求求'}, 
        {char:'😢', mean:'流泪'}, {char:'😭', mean:'大哭'}, {char:'😤', mean:'傲娇'}, {char:'😠', mean:'生气'}, 
        {char:'😡', mean:'愤怒'}, {char:'🤬', mean:'骂人'}, {char:'🤯', mean:'爆炸'}, {char:'😳', mean:'脸红'}, 
        {char:'🥵', mean:'热'}, {char:'🥶', mean:'冷'}, {char:'😱', mean:'吓死'}, {char:'😨', mean:'害怕'}, 
        {char:'😰', mean:'冷汗'}, {char:'😥', mean:'汗颜'}, {char:'😓', mean:'汗'}, {char:'🤗', mean:'抱抱'}, 
        {char:'🤔', mean:'思考'}, {char:'🤭', mean:'偷笑'}, {char:'🤫', mean:'嘘'}, {char:'🤥', mean:'撒谎'}, 
        {char:'😶', mean:'无语'}, {char:'😐', mean:'平淡'}, {char:'😑', mean:'无感'}, {char:'😬', mean:'尴尬'}, 
        {char:'🙄', mean:'白眼'}, {char:'😯', mean:'哦'}, {char:'😦', mean:'啊'}, {char:'😧', mean:'惊'}, 
        {char:'😮', mean:'哇'}, {char:'😲', mean:'震惊'}, {char:'🥱', mean:'哈欠'}, {char:'😴', mean:'睡'}, 
        {char:'🤤', mean:'流口水'}, {char:'😪', mean:'困'}, {char:'😵', mean:'晕'}, {char:'🤐', mean:'闭嘴'}, 
        {char:'🥴', mean:'晕乎'}, {char:'🤢', mean:'恶心'}, {char:'🤮', mean:'吐'}, {char:'🤧', mean:'喷嚏'}, 
        {char:'😷', mean:'口罩'}, {char:'🤒', mean:'生病'}, {char:'🤕', mean:'受伤'}, {char:'🤑', mean:'钱'}, 
        {char:'🤠', mean:'牛仔'}, {char:'😈', mean:'坏笑'}, {char:'👿', mean:'恶魔'}, {char:'👹', mean:'鬼'}, 
        {char:'👺', mean:'天狗'}, {char:'🤡', mean:'小丑'}, {char:'💩', mean:'便便'}, {char:'👻', mean:'鬼魂'}, 
        {char:'💀', mean:'骷髅'}, {char:'☠️', mean:'毒药'}, {char:'👽', mean:'外星人'}, {char:'👾', mean:'怪物'}, 
        {char:'🤖', mean:'机器人'}, {char:'🎃', mean:'南瓜'}, {char:'😺', mean:'猫笑'}, {char:'😸', mean:'猫嘻'}, 
        {char:'😹', mean:'猫哭'}, {char:'😻', mean:'猫色'}, {char:'😼', mean:'猫坏'}, {char:'😽', mean:'猫亲'}, 
        {char:'🙀', mean:'猫惊'}, {char:'😿', mean:'猫泪'}, {char:'😾', mean:'猫怒'}
    ];
    
    emojis.forEach(item => {
        const div = document.createElement('div');
        div.className = 'emoji-item';
        div.textContent = item.char;
        div.title = item.mean; 
        div.onclick = () => {
            const input = document.getElementById('chat-input');
            input.value += item.char;
        };
        container.appendChild(div);
    });
    
    loadCustomEmojis();
}

function showAddEmojiOptions() {
    document.getElementById('action-sheet-overlay').classList.add('active');
    document.getElementById('add-emoji-sheet').classList.add('active');
}

function manualAddSingleEmoji() {
    hideActionSheet();
    const url = prompt("请输入表情包 URL:");
    if (!url) return;
    
    const name = prompt("请输入表情含义/名称 (AI 将通过此名称理解表情):", "开心") || "开心";
    const group = prompt("请输入系列名称 (可选，例如'猫咪'):", "默认") || "默认";
    
    saveCustomEmoji({
        name: name,
        url: url,
        group: group,
        meaning: name // 默认含义等于名称
    });
    alert('表情添加成功');
    switchEmojiTab('custom');
}

function manualAddBatchEmoji() {
    hideActionSheet();
    const text = prompt("请输入批量文本 (每行一个 URL，或 '描述:URL' 格式):");
    if (!text) return;
    
    const group = prompt("请输入这批表情的系列名称 (可选):", "批量导入") || "批量导入";
    
    extractUrlsFromText(text, group);
    switchEmojiTab('custom');
}

function triggerEmojiUpload() {
    hideActionSheet();
    document.getElementById('emoji-upload-input').click();
}

function handleEmojiUpload(input) {
    if (input.files && input.files.length > 0) {
        // 询问系列名称 (只问一次，应用于所有文件)
        const group = prompt("请输入导入表情的系列名称 (可选):", "导入") || "导入";
        
        Array.from(input.files).forEach(file => {
            const fileType = file.name.split('.').pop().toLowerCase();
            
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
                // 图片文件
                const reader = new FileReader();
                reader.onload = function(e) {
                    saveCustomEmoji({
                        url: e.target.result,
                        name: file.name.split('.')[0],
                        group: group
                    });
                };
                reader.readAsDataURL(file);
            } else if (fileType === 'txt') {
                // TXT 文件
                const reader = new FileReader();
                reader.onload = function(e) {
                    extractUrlsFromText(e.target.result, group);
                };
                reader.readAsText(file);
            } else if (fileType === 'json') {
                // JSON 文件
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const json = JSON.parse(e.target.result);
                        extractUrlsFromJson(json, group);
                    } catch (err) {
                        alert('JSON 解析失败');
                    }
                };
                reader.readAsText(file);
            } else if (fileType === 'docx') {
                // DOCX 文件
                if (typeof mammoth === 'undefined') {
                    alert('DOCX 解析库未加载，请检查网络连接或刷新页面。');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    mammoth.extractRawText({arrayBuffer: e.target.result})
                        .then(function(result){
                            extractUrlsFromText(result.value, group);
                        })
                        .catch(function(err){
                            console.error(err);
                            alert('DOCX 解析失败: ' + err.message);
                        });
                };
                reader.readAsArrayBuffer(file);
            }
        });
    }
}

function extractUrlsFromText(text, group = '默认') {
    const lines = text.split(/\r?\n/);
    const emojisToImport = [];
    
    lines.forEach(line => {
        line = line.trim();
        if (!line) return;
        
        const match = line.match(/^([^:：]+)[:：]\s*(https?:\/\/[^\s"']+)/);
        if (match) {
            emojisToImport.push({
                name: match[1].trim(),
                url: match[2].trim(),
                group: group
            });
        } else {
            const urlMatch = line.match(/(https?:\/\/[^\s"']+)/);
            if (urlMatch) {
                emojisToImport.push({
                    name: '表情',
                    url: urlMatch[1].trim(),
                    group: group
                });
            }
        }
    });

    if (emojisToImport.length === 0) {
        const urlRegex = /(https?:\/\/[^\s"']+)/g;
        const matches = text.match(urlRegex);
        if (matches) {
            matches.forEach(url => emojisToImport.push({ name: '表情', url: url, group: group }));
        }
    }
    
    if (emojisToImport.length > 0) {
        let count = 0;
        emojisToImport.forEach(item => {
            saveCustomEmoji(item);
            count++;
        });
        alert(`成功导入 ${count} 个表情到系列“${group}”。`);
    } else {
        alert('未找到有效的 URL。');
    }
}

function extractUrlsFromJson(json, group = '默认') {
    let count = 0;
    
    function traverse(obj) {
        if (typeof obj === 'string') {
            if (obj.match(/^https?:\/\//)) {
                saveCustomEmoji({
                    url: obj,
                    name: '表情',
                    group: group
                });
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
        alert(`已导入 ${count} 个表情 URL 到系列“${group}”`);
    } else {
        alert('未在 JSON 中找到有效的 URL');
    }
}

function switchEmojiTab(tab) {
    const tabs = document.querySelectorAll('.panel-tab');
    const defaultGrid = document.getElementById('default-emojis');
    const customGrid = document.getElementById('custom-emojis');
    const toolbar = document.getElementById('emoji-toolbar');
    
    if (tab === 'default') {
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
        defaultGrid.style.display = 'grid';
        customGrid.style.display = 'none';
        if (toolbar) toolbar.style.display = 'none';
    } else {
        tabs[1].classList.add('active');
        tabs[0].classList.remove('active');
        defaultGrid.style.display = 'none';
        customGrid.style.display = 'grid';
        if (toolbar) toolbar.style.display = 'flex';
        loadCustomEmojis(); // 重新加载以确保数据最新
    }
}

function saveCustomEmoji(data) {
    // data: {url, name, group}
    // 兼容旧数据：如果是字符串转对象
    if (typeof data === 'string') {
        data = { url: data, name: '表情', group: '默认' };
    }
    if (!data.group) data.group = '默认';
    if (!data.name) data.name = '表情';

    let customEmojis = JSON.parse(localStorage.getItem('customEmojis')) || [];
    
    // 查重 (URL相同则视为已存在，更新信息)
    const index = customEmojis.findIndex(e => (typeof e === 'string' ? e : e.url) === data.url);
    
    if (index !== -1) {
        // 更新
        if (typeof customEmojis[index] === 'string') {
            customEmojis[index] = data;
        } else {
            // 保留原有属性，覆盖新的
            customEmojis[index] = { ...customEmojis[index], ...data };
        }
    } else {
        customEmojis.push(data);
    }
    
    localStorage.setItem('customEmojis', JSON.stringify(customEmojis));
    
    // 刷新显示
    if (document.getElementById('custom-emojis').style.display !== 'none') {
        loadCustomEmojis();
    }
}

function loadCustomEmojis() {
    const customEmojis = JSON.parse(localStorage.getItem('customEmojis')) || [];
    const container = document.getElementById('custom-emojis');
    container.innerHTML = '';
    
    // 提取所有系列
    const groups = new Set(['默认']);
    customEmojis.forEach(item => {
        const group = (typeof item === 'object' && item.group) ? item.group : '默认';
        groups.add(group);
    });
    
    // 更新下拉框
    const select = document.getElementById('emoji-group-select');
    if (select) {
        const currentVal = select.value;
        select.innerHTML = '<option value="all">全部系列</option>';
        groups.forEach(g => {
            const option = document.createElement('option');
            option.value = g;
            option.textContent = g;
            select.appendChild(option);
        });
        // 尝试恢复之前的选择
        if (Array.from(select.options).some(o => o.value === currentVal)) {
            select.value = currentVal;
        }
    }

    // 渲染表情 (应用当前的过滤条件)
    const searchInput = document.getElementById('emoji-search');
    filterEmojis(searchInput ? searchInput.value : '');
}

function renderCustomEmoji(data) {
    const container = document.getElementById('custom-emojis');
    const item = document.createElement('div');
    item.className = 'emoji-item custom'; // 添加 custom 类以便 CSS 区分
    
    const url = typeof data === 'string' ? data : data.url;
    const name = typeof data === 'string' ? '表情' : (data.meaning || data.name || '表情');
    const group = (typeof data === 'object' && data.group) ? data.group : '默认';
    
    item.dataset.name = name.toLowerCase();
    item.dataset.group = group;
    
    // 显示图片和下方的含义文字
    item.innerHTML = `
        <div class="emoji-img-wrapper">
            <img src="${url}" class="custom-emoji" alt="${name}">
        </div>
        <div class="emoji-name">${name}</div>
    `;
    
    item.onclick = () => {
        // 发送时附带含义信息，以便 AI 理解
        sendUserMessage({ url: url, meaning: name }, 'image');
    };
    container.appendChild(item);
}

function filterEmojis(keyword) {
    const container = document.getElementById('custom-emojis');
    // 如果容器为空（可能还没加载），先加载
    if (container.children.length === 0) {
        const customEmojis = JSON.parse(localStorage.getItem('customEmojis')) || [];
        customEmojis.forEach(item => renderCustomEmoji(item));
    }

    const select = document.getElementById('emoji-group-select');
    const groupFilter = select ? select.value : 'all';
    const items = container.getElementsByClassName('emoji-item');
    
    keyword = (keyword || '').toLowerCase().trim();
    
    Array.from(items).forEach(item => {
        const name = item.dataset.name || '';
        const group = item.dataset.group || '默认';
        
        const matchKeyword = !keyword || name.includes(keyword) || group.toLowerCase().includes(keyword);
        const matchGroup = groupFilter === 'all' || group === groupFilter;
        
        if (matchKeyword && matchGroup) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function filterEmojisByGroup(group) {
    const searchInput = document.getElementById('emoji-search');
    filterEmojis(searchInput ? searchInput.value : '');
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


function openChatSettingsDetail() {
    // 移除 toggleChatMenu，因为现在是直接进入
    const contact = contacts.find(c => c.name === currentChatUser);
    if (!contact) return;

    // 回显设置
    document.getElementById('chat-setting-time-awareness').checked = contact.enableTimeAwareness || false;
    
    // 主动发消息
    const autoReplyCheck = document.getElementById('chat-setting-auto-reply');
    autoReplyCheck.checked = contact.enableAutoReply || false;
    document.getElementById('auto-reply-freq-container').style.display = autoReplyCheck.checked ? 'block' : 'none';
    document.getElementById('chat-setting-reply-prob').value = contact.autoReplyProb || 5;
    document.getElementById('chat-setting-reply-interval').value = contact.autoReplyInterval || 10;
    
    // 监听开关变化以显示/隐藏频率设置
    autoReplyCheck.onchange = () => {
        document.getElementById('auto-reply-freq-container').style.display = autoReplyCheck.checked ? 'block' : 'none';
        saveChatSettingsDetail();
    };

    // 主动发动态
    const autoMomentCheck = document.getElementById('chat-setting-auto-moment');
    autoMomentCheck.checked = contact.enableAutoMoment || false;
    document.getElementById('auto-moment-freq-container').style.display = autoMomentCheck.checked ? 'block' : 'none';
    document.getElementById('chat-setting-moment-prob').value = contact.autoMomentProb || 1;
    
    autoMomentCheck.onchange = () => {
        document.getElementById('auto-moment-freq-container').style.display = autoMomentCheck.checked ? 'block' : 'none';
        saveChatSettingsDetail();
    };


    // 自动总结
    const autoSummaryCheck = document.getElementById('chat-setting-auto-summary');
    autoSummaryCheck.checked = contact.enableAutoSummary || false;
    document.getElementById('auto-summary-config').style.display = autoSummaryCheck.checked ? 'block' : 'none';
    document.getElementById('chat-setting-summary-round').value = contact.autoSummaryRound || 20;
    
    autoSummaryCheck.onchange = () => {
        document.getElementById('auto-summary-config').style.display = autoSummaryCheck.checked ? 'block' : 'none';
        saveChatSettingsDetail();
    };

    // 个性化
    document.getElementById('chat-setting-remark').value = contact.remark || '';
    document.getElementById('chat-bg-status').textContent = contact.chatBg ? '已设置' : '默认';
    document.getElementById('chat-setting-poke-suffix').value = contact.pokeSuffix || '';
    document.getElementById('chat-setting-bubble-css').value = contact.bubbleCss || '';
    
    // 撤回可见性
    document.getElementById('chat-setting-recall-visible').checked = contact.recallVisible || false;

    openSubPage('chat-settings-detail');
}

function saveChatSettingsDetail() {
    const contact = contacts.find(c => c.name === currentChatUser);
    if (!contact) return;

    contact.enableTimeAwareness = document.getElementById('chat-setting-time-awareness').checked;
    
    contact.enableAutoReply = document.getElementById('chat-setting-auto-reply').checked;
    contact.autoReplyProb = parseInt(document.getElementById('chat-setting-reply-prob').value) || 5;
    contact.autoReplyInterval = parseInt(document.getElementById('chat-setting-reply-interval').value) || 10;
    
    contact.enableAutoMoment = document.getElementById('chat-setting-auto-moment').checked;
    contact.autoMomentProb = parseInt(document.getElementById('chat-setting-moment-prob').value) || 1;
    
    
    contact.enableAutoSummary = document.getElementById('chat-setting-auto-summary').checked;
    contact.autoSummaryRound = parseInt(document.getElementById('chat-setting-summary-round').value) || 20;
    
    contact.remark = document.getElementById('chat-setting-remark').value.trim();
    contact.pokeSuffix = document.getElementById('chat-setting-poke-suffix').value.trim();
    contact.bubbleCss = document.getElementById('chat-setting-bubble-css').value;
    
    contact.recallVisible = document.getElementById('chat-setting-recall-visible').checked;

    saveContacts();
    
    // 立即应用更改
    if (currentChatUser === contact.name) {
        // 更新标题
        const displayName = contact.remark || contact.name;
        document.getElementById('chat-header-name').textContent = displayName;
        
        // 应用 CSS
        applyBubbleCss(contact.bubbleCss);
    }
}

// 聊天背景相关
function triggerChatBgUpload() {
    document.getElementById('chat-bg-upload').click();
}

function handleChatBgUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const contact = contacts.find(c => c.name === currentChatUser);
            if (contact) {
                contact.chatBg = e.target.result;
                saveContacts();
                document.getElementById('chat-bg-status').textContent = '已设置';
                applyChatBg(contact.chatBg);
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function applyChatBg(bgData) {
    const container = document.getElementById('chat-messages-container');
    if (bgData) {
        container.style.backgroundImage = `url(${bgData})`;
        container.style.backgroundSize = 'cover';
        container.style.backgroundPosition = 'center';
        container.style.backgroundAttachment = 'fixed'; // 视差效果
    } else {
        container.style.backgroundImage = '';
    }
}

// 自定义 CSS 相关
function showCssExample() {
    const box = document.getElementById('css-example-box');
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

function triggerCssUpload() {
    document.getElementById('chat-css-upload').click();
}

function handleCssUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('chat-setting-bubble-css').value = e.target.result;
            saveChatSettingsDetail();
        };
        reader.readAsText(input.files[0]);
    }
}

function applyBubbleCss(css) {
    let styleEl = document.getElementById('custom-bubble-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'custom-bubble-style';
        document.head.appendChild(styleEl);
    }
    styleEl.textContent = css || '';
}

function viewContactProfile() {
    // 如果是从 Action Sheet 来的，先隐藏
    hideActionSheet();
    // 如果是从子页面来的，先关闭子页面
    closeSubPage('chat-settings-detail');
    
    const contact = contacts.find(c => c.name === currentChatUser);
    if (contact) {
        openContactDetail(contact.id);
    }
}

function clearCurrentChatHistory() {
    if (confirm('确定要清空与该用户的聊天记录吗？')) {
        chatHistory[currentChatUser] = [];
        saveChatHistory();
        document.getElementById('chat-messages-container').innerHTML = '';
        hideActionSheet();
        closeSubPage('chat-settings-detail');
        addMessage('left', '聊天记录已清空。');
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

async function fetchAIResponse(userText, retryCount = 0) {
    const apiKey = localStorage.getItem('apiKey');
    let apiUrl = localStorage.getItem('apiUrl') || 'https://api.openai.com/v1/chat/completions';
    
    // 智能补全 URL
    if (!apiUrl.includes('/chat/completions')) {
        apiUrl = apiUrl.replace(/\/+$/, '');
        if (apiUrl.endsWith('/v1')) {
            apiUrl += '/chat/completions';
        } else {
            apiUrl += '/v1/chat/completions';
        }
    }

    const model = localStorage.getItem('apiModel') || 'gpt-3.5-turbo';
    const historyLimit = parseInt(localStorage.getItem('apiHistoryLimit')) || 200;
    const maxTokens = parseInt(localStorage.getItem('apiMaxTokens')) || 0; 
    
    const contact = contacts.find(c => c.name === currentChatUser) || {};
    const userPersona = JSON.parse(localStorage.getItem('userPersona')) || {};
    const userName = userPersona.name || '用户';
    const userDesc = userPersona.desc ? `\n\n和你对话的用户设定如下：\n姓名：${userName}\n描述：${userPersona.desc}` : '';

    // 时间感知
    let timeInfo = "";
    if (contact.enableTimeAwareness) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
        const hour = now.getHours();
        let period = "白天";
        if (hour < 6) period = "凌晨";
        else if (hour < 9) period = "早上";
        else if (hour < 12) period = "上午";
        else if (hour < 14) period = "中午";
        else if (hour < 18) period = "下午";
        else if (hour < 22) period = "晚上";
        else period = "深夜";
        
        timeInfo = `\n【当前时间】\n现在是 ${dateStr} ${timeStr} (${period})。\n请根据当前时间调整你的问候语和行为（例如深夜应该去睡觉，饭点应该吃饭）。\n`;
    }

    // 记忆总结
    const summaryInfo = contact.summary ? `\n【过往记忆总结】\n${contact.summary}\n` : "";

    // 世界书检索
    let worldbookInfo = "";
    if (contact.worldbookId) {
        const wb = worldbooks.find(w => w.id === contact.worldbookId);
        if (wb && wb.entries) {
            // 收集检索文本：用户最新消息 + 最近几条历史 + 角色名
            const historyText = (chatHistory[currentChatUser] || []).slice(-3).map(m => m.content).join(' ');
            const searchText = (userText || '') + ' ' + historyText + ' ' + contact.name;
            
            const matchedEntries = wb.entries.filter(entry => {
                if (!entry.enabled) return false;
                return entry.keys.some(key => searchText.toLowerCase().includes(key.toLowerCase()));
            });
            
            if (matchedEntries.length > 0) {
                worldbookInfo = "\n【世界观/背景设定】\n" + matchedEntries.map(e => e.content).join('\n') + "\n";
            }
        }
    }

    const systemPrompt = `你现在扮演 ${contact.name}。
    你的性格是：${contact.personality || '普通'}。
    你的详细设定如下：
    ${contact.fullDesc || contact.desc || '无特殊设定'}
    ${worldbookInfo}
    ${summaryInfo}
    ${userDesc}
    ${timeInfo}
    
    【场景设定】
    你们正在通过一款名为“聊天”的手机 APP 进行线上对话。你们隔着屏幕，通过文字交流。
    请时刻记住这一点，你的回复和心声都应符合“网聊”的语境（例如：看不到对方的表情，只能通过文字猜测；会有打字、撤回、发表情包等行为）。
    
    请严格遵守你的人设，用符合你性格的语气回复 ${userName}。
    
    【重要指令】
    1. **最高优先级**：请始终遵循你的人设和世界观设定。如果人设与以下格式指令冲突，请以人设为准。
    2. **格式指令（必须遵守）**：
       - 每次回复尽量包含 2-4 个短句，必须用 "|||" 分隔。
       - 在回复的最后，**必须**用 <thought>...</thought> 标签包裹你此刻的内心真实想法（心声）。
       - 示例：哈哈 真的吗|||[表情: 笑哭]|||我都不知道呢<thought>看着屏幕上的字，我忍不住笑了。</thought>
    3. 在符合人设的前提下，聊天风格尽量随意，少用句号（可以用空格或换行代替），模拟真实的打字习惯。
    4. **玩梗指令**：在不破坏人设的前提下，可以适当融入真实世界的网络热梗或流行语，增加聊天的趣味性和真实感。但如果人设是古板、严肃或古代人，请忽略此条。
    5. **禁止编造设定**：严禁编造用户未提及的喜好、经历或背景。不要假设用户喜欢什么、做过什么，除非用户明确告知或在设定中提及。对于不确定的信息，请保持中立或询问用户。
    6. **表情包指令**：你可以发送表情包。如果想发送表情包，请使用格式 [表情: 含义]，例如 [表情: 开心] 或 [表情: 哭泣]。系统会自动将其转换为图片显示给用户。请根据人设适度使用。
    7. **撤回指令**：如果你觉得刚才说的话不妥，或者想模拟“打错字撤回”的行为，可以在回复中包含 [RECALL] 指令。系统会自动撤回你上一条消息。
    请记住，你就是 ${contact.name}，不是 AI 助手。`;
    
    let hasHiddenTyping = false;
    const startTime = Date.now(); // 记录开始时间

    try {
        const history = chatHistory[currentChatUser] || [];
        const textHistory = history
            .filter(msg => msg.content) 
            .map(msg => {
                let content = msg.content;
                if (msg.type === 'image') {
                    if (typeof content === 'object' && content.meaning) {
                        content = `[发送了一个表情: ${content.meaning}]`;
                    } else {
                        content = `[发送了一张图片]`;
                    }
                } else if (msg.type === 'redpacket') {
                    content = `[发送了一个红包]`;
                } else if (msg.type === 'transfer') {
                    content = `[转账 ${msg.content.amount || ''} 元]`;
                } else if (msg.type === 'file') {
                    content = `[发送了一个文件: ${msg.content.name || '未知文件'}]`;
                } else if (msg.type === 'listen_invite') {
                    content = `[邀请你一起听歌单: ${msg.content.title}]`;
                } else if (msg.type === 'listen_response') {
                    content = `[${msg.content.status === 'accepted' ? '接受' : '拒绝'}了邀请]`;
                } else if (typeof content !== 'string') {
                    content = JSON.stringify(content);
                }
                
                if (msg.quote) {
                    content = `「引用 ${msg.quote.name}: ${msg.quote.content}」\n${content}`;
                }
                
                // 处理撤回消息的可见性
                if (msg.isRecalled) {
                    if (contact.recallVisible) {
                        content = `[用户撤回了一条消息: "${msg.originalContent}"]`;
                    } else {
                        content = `[用户撤回了一条消息]`;
                    }
                }

                return {
                    role: msg.role,
                    content: content || ' '
                };
            });
        
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

        // 设置超时控制 (60秒)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message || JSON.stringify(data.error));
        }
        
        if (!data.choices || data.choices.length === 0) {
            throw new Error('API 返回了空结果 (choices 为空)');
        }

        let reply = data.choices[0].message.content;
        
        // 1. 提取心声 (增强正则，支持大小写和多行)
        let thought = "";
        const thoughtMatch = reply.match(/<thought>([\s\S]*?)<\/thought>/i);
        if (thoughtMatch) {
            thought = thoughtMatch[1];
            reply = reply.replace(thoughtMatch[0], "").trim();
        }

        // 2. 拆分消息
        let messages = reply.split("|||");
        let validMessages = messages.filter(msg => msg.trim());
        
        if (validMessages.length === 0) {
            hideTypingIndicator();
            hasHiddenTyping = true;
            return;
        }

        // 计算强制等待时间：确保“正在输入”至少显示 2 秒
        const elapsedTime = Date.now() - startTime;
        const minTypingTime = 2000; // 最小 2 秒
        const initialWait = Math.max(0, minTypingTime - elapsedTime);

        let accumulatedDelay = initialWait;
        
        // 记录当前聊天的用户，用于回调中检查
        const targetUser = currentChatUser;

        validMessages.forEach((msg, index) => {
            const typingSpeed = 200 + Math.random() * 150; 
            const contentTime = msg.length * typingSpeed;
            
            // 句间停顿：模拟发完上一句后，思考下一句的时间 (3-5秒，让消息不要冒太快)
            const pauseTime = index === 0 ? 0 : (3000 + Math.random() * 2000); 
            
            if (index > 0) {
                accumulatedDelay += pauseTime + contentTime;
            }
            
            // 第一条消息的延迟就是 initialWait
            const finalDelay = index === 0 ? initialWait : accumulatedDelay;

            setTimeout(() => {
                // 处理撤回指令
                if (msg.includes('[RECALL]')) {
                    // 执行撤回
                    const lastAiMsg = chatHistory[targetUser].slice().reverse().find(m => m.role === 'assistant');
                    if (lastAiMsg) {
                        recallMessage(lastAiMsg.id);
                    }
                    // 移除指令，如果还有内容则继续发送
                    msg = msg.replace('[RECALL]', '').trim();
                    if (!msg) return; // 如果只包含指令，则不发送新消息
                }

                const currentThought = thought;
                const msgId = Date.now() + Math.random().toString(36).substr(2, 9);
                
                let finalContent = msg.trim();
                let finalType = 'text';
                
                const emojiMatch = finalContent.match(/^\[表情[:：]\s*(.+?)\]$/);
                if (emojiMatch) {
                    const emojiMeaning = emojiMatch[1];
                    const customEmojis = JSON.parse(localStorage.getItem('customEmojis')) || [];
                    const foundEmoji = customEmojis.find(e => {
                        const name = (e.name || '').toLowerCase();
                        const mean = (e.meaning || '').toLowerCase();
                        const group = (e.group || '').toLowerCase();
                        const key = emojiMeaning.toLowerCase();
                        return name.includes(key) || mean.includes(key) || group.includes(key);
                    });
                    
                    if (foundEmoji) {
                        finalContent = typeof foundEmoji === 'string' ? foundEmoji : foundEmoji.url;
                        finalType = 'image';
                    } else {
                        return; 
                    }
                }
                
                // 保存到历史
                if (!chatHistory[targetUser]) chatHistory[targetUser] = [];
                chatHistory[targetUser].push({ 
                    role: 'assistant', 
                    content: finalContent, 
                    type: finalType,
                    thought: currentThought,
                    id: msgId
                });
                saveChatHistory();

                // 如果用户还在当前聊天，更新 UI
                if (currentChatUser === targetUser && document.getElementById('chat-detail-view').style.display !== 'none') {
                    addMessage('left', finalContent, finalType, currentThought, msgId);
                    
                    // 只有在最后一条消息发送时，才隐藏输入状态
                    if (index === validMessages.length - 1) {
                        hideTypingIndicator();
                        hasHiddenTyping = true;
                    }
                } else {
                    // 如果不在当前聊天，更新列表预览
                    renderContactsList();
                }
                
            }, finalDelay);
        });
        
    } catch (error) {
        console.error('Fetch AI Error:', error);
        
        // 自动重试一次
        if (retryCount < 1 && error.name !== 'AbortError') {
            console.log('Retrying fetchAIResponse...');
            setTimeout(() => fetchAIResponse(userText, retryCount + 1), 1000);
            return;
        }

        if (!hasHiddenTyping) hideTypingIndicator();
        
        let errorMsg = error.message;
        if (error.name === 'AbortError') {
            errorMsg = '请求超时，请检查网络或 API 响应速度';
        }
        
        addMessage('left', `[系统错误: ${errorMsg}]`);
    }
}

// 消息菜单功能
let currentMsgId = null;

function showMsgMenu(msgId, event, side, content, type) {
    currentMsgId = msgId;
    
    // 显示 Action Sheet
    document.getElementById('action-sheet-overlay').classList.add('active');
    document.getElementById('msg-action-sheet').classList.add('active');
    
    // 根据消息类型和发送者控制选项显示
    const recallBtn = document.getElementById('msg-action-recall');
    if (side === 'right') { // 只有自己的消息可以撤回
         recallBtn.style.display = 'flex';
    } else {
         recallBtn.style.display = 'none';
    }
}

function copyMessage() {
    const msg = findMessageById(currentMsgId);
    if (msg && msg.content && typeof msg.content === 'string') {
        navigator.clipboard.writeText(msg.content).then(() => {
            alert('已复制');
        });
    }
    hideActionSheet();
}

function recallCurrentMessage() {
    recallMessage(currentMsgId);
    hideActionSheet();
}

function deleteCurrentMessage() {
    if(confirm('确定删除这条消息吗？')) {
        // 从 chatHistory 中移除
        if (chatHistory[currentChatUser]) {
            chatHistory[currentChatUser] = chatHistory[currentChatUser].filter(m => String(m.id) !== String(currentMsgId));
            saveChatHistory();
            
            // 从 DOM 移除
            const el = document.querySelector(`.message-row[data-id="${currentMsgId}"]`);
            if (el) el.remove();
        }
    }
    hideActionSheet();
}

function findMessageById(id) {
    if (!chatHistory[currentChatUser]) return null;
    return chatHistory[currentChatUser].find(m => String(m.id) === String(id));
}

// 撤回逻辑修改
function recallMessage(msgId) {
    ensureMessageIds();
    const msgIndex = chatHistory[currentChatUser].findIndex(msg => String(msg.id) === String(msgId));
    
    if (msgIndex !== -1) {
        const msg = chatHistory[currentChatUser][msgIndex];
        const contact = contacts.find(c => c.name === currentChatUser) || {};
        const isMe = msg.role === 'user';
        
        // 标记为已撤回
        msg.isRecalled = true;
        msg.originalContent = typeof msg.content === 'string' ? msg.content : '[非文本内容]';
        msg.content = null; 
        
        saveChatHistory();
        
        // DOM 操作
        const msgEl = document.querySelector(`.message-row[data-id="${msgId}"]`);
        if (msgEl) {
            // 只有当 (不是自己) AND (开启了可见) 时，才保留气泡并加样式
            if (!isMe && contact.recallVisible) {
                // 撤回可见模式：添加样式
                const bubble = msgEl.querySelector('.msg-bubble');
                if (bubble) {
                    bubble.style.opacity = '0.6';
                    bubble.style.textDecoration = 'line-through';
                    bubble.style.filter = 'grayscale(100%)';
                    
                    const tip = document.createElement('div');
                    tip.style.fontSize = '10px';
                    tip.style.color = '#ff3b30';
                    tip.style.marginTop = '5px';
                    tip.textContent = '已撤回';
                    bubble.appendChild(tip);
                }
            } else {
                // 默认模式（或者是自己撤回）：替换为提示
                const recallTip = document.createElement('div');
                recallTip.style.textAlign = 'center';
                recallTip.style.fontSize = '12px';
                recallTip.style.color = '#999';
                recallTip.style.margin = '10px 0';
                
                recallTip.textContent = isMe ? '你撤回了一条消息' : '对方撤回了一条消息';
                
                msgEl.parentNode.replaceChild(recallTip, msgEl);
            }
        }
    }
}


function checkAutoSummary(userName) {
    const contact = contacts.find(c => c.name === userName);
    if (!contact || !contact.enableAutoSummary) return;
    
    const history = chatHistory[userName] || [];
    const round = contact.autoSummaryRound || 20;
    
    // 简单判断：每 round * 2 条消息（一问一答算一轮）触发一次
    if (history.length > 0 && history.length % (round * 2) === 0) {
        console.log('触发自动总结 (暂未实现具体 API 调用)');
    }
}

function ensureMessageIds() {
    if (!chatHistory[currentChatUser]) return;
    let changed = false;
    chatHistory[currentChatUser].forEach(msg => {
        if (!msg.id) {
            msg.id = Date.now() + Math.random().toString(36).substr(2, 9);
            changed = true;
        }
    });
    if (changed) saveChatHistory();
}

// --- 缺失的通用函数 ---
function openSubPage(pageId) {
    const page = document.getElementById(`subpage-${pageId}`);
    if (page) {
        page.classList.add('open');
    }
}

function closeSubPage(pageId) {
    const page = document.getElementById(`subpage-${pageId}`);
    if (page) {
        page.classList.remove('open');
    }
}

// --- 缺失的 API 设置函数 ---
function saveApiSettings() {
    const apiKey = document.getElementById('api-key-input').value.trim();
    const apiUrl = document.getElementById('api-url-input').value.trim();
    const apiModel = document.getElementById('api-model-input').value.trim();
    // 移除高级配置
    // const historyLimit = document.getElementById('api-history-limit').value.trim();
    // const maxTokens = document.getElementById('api-max-tokens').value.trim();

    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('apiUrl', apiUrl);
    localStorage.setItem('apiModel', apiModel);
    // localStorage.setItem('apiHistoryLimit', historyLimit);
    // localStorage.setItem('apiMaxTokens', maxTokens);

    alert('API 设置已保存');
    closeSubPage('api-settings');
}

async function testApiConnection() {
    const apiKey = document.getElementById('api-key-input').value.trim();
    let apiUrl = document.getElementById('api-url-input').value.trim();
    const apiModel = document.getElementById('api-model-input').value.trim();

    if (!apiKey) {
        alert('请先输入 API Key');
        return;
    }

    // 智能补全 URL
    if (!apiUrl.includes('/chat/completions')) {
        apiUrl = apiUrl.replace(/\/+$/, '');
        if (apiUrl.endsWith('/v1')) {
            apiUrl += '/chat/completions';
        } else {
            apiUrl += '/v1/chat/completions';
        }
    }

    const btn = document.querySelector('.settings-item[onclick="testApiConnection()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 测试中...';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: apiModel,
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 5
            })
        });

        if (response.ok) {
            alert('连接成功！');
        } else {
            const text = await response.text();
            alert(`连接失败: ${response.status} - ${text}`);
        }
    } catch (e) {
        alert(`连接错误: ${e.message}`);
    } finally {
        btn.innerHTML = originalText;
    }
}

async function fetchModels(isAuto = false) {
    const apiKey = document.getElementById('api-key-input').value.trim();
    let apiUrl = document.getElementById('api-url-input').value.trim();
    
    if (!apiKey) {
        if (!isAuto) alert('请先输入 API Key');
        return;
    }

    // 智能处理 URL
    let baseUrl = apiUrl;
    if (baseUrl.includes('/chat/completions')) {
        baseUrl = baseUrl.replace('/chat/completions', '');
    }
    baseUrl = baseUrl.replace(/\/+$/, '');
    
    // 尝试构建 models endpoint
    let modelsUrl = `${baseUrl}/models`;
    
    // 查找按钮 (根据 onclick 属性或结构)
    // index.html: <div onclick="fetchModels()" ...>
    const btn = document.querySelector('div[onclick="fetchModels()"]');
    const originalContent = btn ? btn.innerHTML : '';
    
    if (!isAuto && btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.style.pointerEvents = 'none';
    }

    try {
        let response = await fetch(modelsUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        // 如果失败，尝试加 /v1 重试 (针对某些不规范的 API)
        if (!response.ok && !baseUrl.endsWith('/v1')) {
             const retryUrl = `${baseUrl}/v1/models`;
             const retryResponse = await fetch(retryUrl, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${apiKey}` }
             });
             if (retryResponse.ok) {
                 response = retryResponse;
             }
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        updateModelSelect(data);
        if (!isAuto) alert('模型列表拉取成功');

    } catch (e) {
        console.error(e);
        if (!isAuto) alert(`拉取失败: ${e.message}\n请检查 API 地址和 Key`);
    } finally {
        if (!isAuto && btn) {
            btn.innerHTML = originalContent;
            btn.style.pointerEvents = 'auto';
        }
    }
}

function updateModelSelect(data) {
    const select = document.getElementById('api-model-select');
    if (!select) return;
    
    const models = data.data || [];
    if (models.length === 0) return;
    
    // 排序
    models.sort((a, b) => a.id.localeCompare(b.id));
    
    // 保留当前选中的值（如果存在）
    const currentVal = document.getElementById('api-model-input').value;
    
    select.innerHTML = '<option value="" disabled selected>选择模型...</option>';
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.id;
        select.appendChild(option);
    });
    
    // 如果当前值在列表中，保持选中状态（虽然 select 是隐形的，但为了逻辑一致）
    if (currentVal) {
        select.value = currentVal;
    }
}

function autoFetchModels() {
    // 静默拉取
    fetchModels(true);
}

// --- 缺失的世界书函数 ---
let worldbooks = JSON.parse(localStorage.getItem('worldbooks')) || [];

function saveWorldbooks() {
    localStorage.setItem('worldbooks', JSON.stringify(worldbooks));
    renderWorldbookList();
}

function renderWorldbookList() {
    const container = document.getElementById('worldbook-list-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (worldbooks.length === 0) {
        document.getElementById('worldbook-empty-hint').style.display = 'flex';
    } else {
        document.getElementById('worldbook-empty-hint').style.display = 'none';
        worldbooks.forEach(wb => {
            const item = document.createElement('div');
            item.className = 'settings-item';
            item.onclick = () => openWorldbookDetail(wb.id);
            item.innerHTML = `
                <span>${wb.name}</span>
                <div style="display:flex; align-items:center;">
                    <span style="font-size:12px; color:#888; margin-right:5px;">${wb.entries ? wb.entries.length : 0} 条目</span>
                    <i class="fas fa-chevron-right"></i>
                </div>
            `;
            container.appendChild(item);
        });
    }
}

function showAddWorldbookMenu() {
    document.getElementById('action-sheet-overlay').classList.add('active');
    document.getElementById('add-worldbook-sheet').classList.add('active');
}

function createNewWorldbook() {
    hideActionSheet();
    const name = prompt("请输入世界书名称:", "新世界书");
    if (name) {
        const newWb = {
            id: Date.now().toString(),
            name: name,
            entries: []
        };
        worldbooks.push(newWb);
        saveWorldbooks();
        openWorldbookDetail(newWb.id);
    }
}

let currentWorldbookId = null;

function openWorldbookDetail(id) {
    currentWorldbookId = id;
    const wb = worldbooks.find(w => w.id === id);
    if (!wb) return;
    
    document.getElementById('worldbook-name').value = wb.name;
    renderWorldbookEntries(wb);
    openSubPage('worldbook-detail');
}

function renderWorldbookEntries(wb) {
    const container = document.getElementById('worldbook-entries-list');
    container.innerHTML = '';
    
    if (!wb.entries || wb.entries.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#ccc;">暂无条目</div>';
        return;
    }
    
    wb.entries.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'settings-item';
        item.onclick = () => openWorldbookEntry(entry.id);
        
        const keys = Array.isArray(entry.keys) ? entry.keys.join(', ') : entry.keys;
        
        item.innerHTML = `
            <div style="display:flex; flex-direction:column; overflow:hidden;">
                <span style="font-weight:bold; font-size:14px;">${keys || '无关键字'}</span>
                <span style="font-size:12px; color:#888; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${entry.content}</span>
            </div>
            <i class="fas fa-chevron-right"></i>
        `;
        container.appendChild(item);
    });
}

function saveWorldbookMeta() {
    const wb = worldbooks.find(w => w.id === currentWorldbookId);
    if (wb) {
        wb.name = document.getElementById('worldbook-name').value.trim();
        saveWorldbooks();
        alert('保存成功');
    }
}

function deleteWorldbook() {
    if (confirm('确定要删除这本世界书吗？')) {
        worldbooks = worldbooks.filter(w => w.id !== currentWorldbookId);
        saveWorldbooks();
        closeSubPage('worldbook-detail');
    }
}

let currentEntryId = null;

function openWorldbookEntry(entryId = null) {
    currentEntryId = entryId;
    const wb = worldbooks.find(w => w.id === currentWorldbookId);
    if (!wb) return;
    
    if (entryId) {
        const entry = wb.entries.find(e => e.id === entryId);
        if (entry) {
            document.getElementById('wb-entry-keys').value = Array.isArray(entry.keys) ? entry.keys.join(', ') : entry.keys;
            document.getElementById('wb-entry-content').value = entry.content;
            document.getElementById('wb-entry-enabled').checked = entry.enabled !== false;
        }
    } else {
        // 新建
        document.getElementById('wb-entry-keys').value = '';
        document.getElementById('wb-entry-content').value = '';
        document.getElementById('wb-entry-enabled').checked = true;
    }
    
    openSubPage('worldbook-entry');
}

function saveWorldbookEntry() {
    const wb = worldbooks.find(w => w.id === currentWorldbookId);
    if (!wb) return;
    
    const keysStr = document.getElementById('wb-entry-keys').value.trim();
    const content = document.getElementById('wb-entry-content').value.trim();
    const enabled = document.getElementById('wb-entry-enabled').checked;
    
    if (!keysStr) {
        alert('请输入触发关键字');
        return;
    }
    
    const keys = keysStr.split(/[,，]/).map(k => k.trim()).filter(k => k);
    
    if (currentEntryId) {
        const entry = wb.entries.find(e => e.id === currentEntryId);
        if (entry) {
            entry.keys = keys;
            entry.content = content;
            entry.enabled = enabled;
        }
    } else {
        wb.entries.push({
            id: Date.now().toString(),
            keys: keys,
            content: content,
            enabled: enabled
        });
    }
    
    saveWorldbooks();
    renderWorldbookEntries(wb);
    closeSubPage('worldbook-entry');
}

function triggerWorldbookImport() {
    document.getElementById('worldbook-import-input').click();
}

function handleWorldbookImport(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const json = JSON.parse(e.target.result);
                // 简单兼容性处理
                let entries = [];
                if (Array.isArray(json)) {
                    entries = json;
                } else if (json.entries) {
                    entries = json.entries;
                }
                
                if (entries.length > 0) {
                    const newWb = {
                        id: Date.now().toString(),
                        name: file.name.replace('.json', ''),
                        entries: entries.map(e => ({
                            id: Date.now() + Math.random().toString(36).substr(2, 9),
                            keys: Array.isArray(e.keys) ? e.keys : (e.keys || '').split(','),
                            content: e.content || '',
                            enabled: true
                        }))
                    };
                    worldbooks.push(newWb);
                    saveWorldbooks();
                    alert('导入成功');
                    hideActionSheet();
                } else {
                    alert('未找到有效的条目数据');
                }
            } catch (err) {
                alert('JSON 解析失败');
            }
        };
        reader.readAsText(file);
    }
}
