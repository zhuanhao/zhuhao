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

function performUnlock() {
    lockScreen.style.transition = 'transform 0.3s ease';
    lockScreen.style.transform = 'translateY(-100%)';
    
    // 确保动画完成后切换状态
    setTimeout(() => {
        lockScreen.classList.remove('active');
        lockScreen.style.transform = ''; // 重置位置，但因为移除了 active，所以不可见
        document.getElementById('home-screen').classList.add('active');
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
    isSettingPasscode = false; // 重置状态，这里逻辑有点问题，应该保持 true 直到完成或取消
    // 修正：如果是确认阶段失败，应该继续保持设置状态
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
            // 保存到 localStorage (注意：图片太大可能会超出限制)
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
    // 如果在锁屏界面，不做任何操作（或者可以设计为点亮屏幕）
    // 如果在主屏幕，也不做操作
}

// 聊天 APP 切换 Tab
function switchChatTab(tabName) {
    // 隐藏所有 Tab 内容
    document.querySelectorAll('.chat-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 显示选中的 Tab 内容
    document.getElementById(`chat-tab-${tabName}`).classList.add('active');
    
    // 更新底部导航状态
    document.querySelectorAll('.app-footer-nav .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 找到点击的 nav-item 并添加 active 类
    // 这里简单通过 onclick 触发，实际可以通过 event.currentTarget 获取
    const navItems = document.querySelectorAll('.app-footer-nav .nav-item');
    const tabIndex = ['messages', 'contacts', 'moments', 'me'].indexOf(tabName);
    if (tabIndex !== -1 && navItems[tabIndex]) {
        navItems[tabIndex].classList.add('active');
    }
}

// 打开子页面
function openSubPage(pageName) {
    const subPage = document.getElementById(`subpage-${pageName}`);
    if (subPage) {
        subPage.classList.add('open');
    }
}

// 关闭子页面
function closeSubPage(pageName) {
    const subPage = document.getElementById(`subpage-${pageName}`);
    if (subPage) {
        subPage.classList.remove('open');
    }
}
