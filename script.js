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
        unlockPhone();
    }
});

// 鼠标模拟滑动
lockScreen.addEventListener('mousedown', (e) => {
    startY = e.clientY;
});

lockScreen.addEventListener('mouseup', (e) => {
    const endY = e.clientY;
    if (startY - endY > 100) {
        unlockPhone();
    }
});

// 点击解锁（方便测试）
lockScreen.addEventListener('click', () => {
    unlockPhone();
});

function unlockPhone() {
    lockScreen.style.transform = 'translateY(-100%)';
    setTimeout(() => {
        lockScreen.classList.remove('active');
        lockScreen.style.transform = '';
        document.getElementById('home-screen').classList.add('active');
    }, 300);
}

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
