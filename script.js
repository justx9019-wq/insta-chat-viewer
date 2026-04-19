const myUsername = "upinthehellof"; 

// ================= قاعدة بيانات المحادثات =================
// من هنا يمكنك إضافة أي محادثة جديدة في المستقبل!
const chatsDatabase = [
    {
        id: "chat_maryam",
        name: "مريم",             // الاسم الذي سيظهر بدلاً من Instagram user
        avatar: "👩",             // صورة أو إيموجي العرض
        previewMsg: "نشط منذ ساعتين", // نص تحت الاسم في القائمة
        // ضع هنا أسماء ملفات مريم من الأقدم للأحدث
        files: ['message_3.html', 'message_2.html', 'message_1.html'] 
    },
    // مثال لإضافة محادثة جديدة (امسح علامات // لتفعيلها مستقبلاً):
    /*
    {
        id: "chat_ahmed",
        name: "أحمد العراقي",
        avatar: "👨",
        previewMsg: "نشط الآن",
        files: ['ahmed_msg_1.html'] 
    }
    */
];

let allMessages = [];
let currentActiveChat = null;

// ================= نظام إدارة الشاشات =================
const inboxScreen = document.getElementById('inboxScreen');
const chatScreen = document.getElementById('chatScreen');
const inboxList = document.getElementById('inboxList');

// بناء قائمة الدايركت (Inbox) عند فتح الموقع
function renderInbox() {
    inboxList.innerHTML = '';
    
    chatsDatabase.forEach(chat => {
        const item = document.createElement('div');
        item.className = 'inbox-item';
        item.onclick = () => openChat(chat); // عند الضغط يفتح المحادثة
        
        item.innerHTML = `
            <div class="inbox-avatar">${chat.avatar}</div>
            <div class="inbox-details">
                <div class="inbox-name">${chat.name}</div>
                <div class="inbox-preview">
                    <span>${chat.previewMsg}</span>
                </div>
            </div>
            <div class="inbox-camera">📷</div>
        `;
        inboxList.appendChild(item);
    });
}

// فتح محادثة معينة
async function openChat(chatConfig) {
    currentActiveChat = chatConfig;
    
    // تغيير الشاشة
    inboxScreen.classList.remove('active');
    chatScreen.classList.add('active');
    
    // تحديث الهيدر باسم مريم
    document.getElementById('chatHeaderName').innerText = chatConfig.name;
    document.getElementById('chatHeaderAvatar').innerText = chatConfig.avatar;
    
    // تحميل الرسائل
    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML = '<div class="loading-state"><p>جاري تحميل المحادثة...</p></div>';
    
    allMessages = [];
    let globalIndex = 0;

    for (const fileName of chatConfig.files) {
        try {
            const response = await fetch(fileName);
            if (!response.ok) continue;
            const htmlString = await response.text();
            parseHTML(htmlString, globalIndex);
            globalIndex += 10000; 
        } catch (error) {
            console.error(`خطأ في قراءة ${fileName}`);
        }
    }
    finalizeAndRender();
}

// العودة للقائمة
document.getElementById('backToInboxBtn').addEventListener('click', () => {
    chatScreen.classList.remove('active');
    inboxScreen.classList.add('active');
});

// ================= معالجة وقراءة الرسائل =================
function parseHTML(htmlString, fileBaseIndex) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const messageDivs = Array.from(doc.querySelectorAll('.pam._3-95._2ph-._a6-g.uiBoxWhite.noborder'));
    messageDivs.reverse();

    messageDivs.forEach((div, index) => {
        const senderEl = div.querySelector('h2');
        if (!senderEl) return;
        
        // **هنا السر**: إذا لم يكن المرسل أنت، فاستبدل اسمه باسم الشخص الحالي (مثلاً "مريم")
        let originalSender = senderEl.innerText.trim();
        let finalSenderName = (originalSender === myUsername) ? myUsername : currentActiveChat.name;
        
        let content = '';
        const messageContainer = div.querySelector('div._3-95._a6-p');
        if (messageContainer) {
            const textSpan = messageContainer.querySelector('span');
            if (textSpan && textSpan.innerText.trim() !== "") {
                content = textSpan.innerText;
            } else {
                content = "🖼️ [وسائط مرسلة]"; 
            }
        }

        const timeText = div.querySelector('div._3-94._a6-o').innerText.trim();
        const dateObj = new Date(timeText);

        if (content !== '') {
            allMessages.push({
                id: `msg-${fileBaseIndex + index}`,
                originalIndex: fileBaseIndex + index,
                sender: finalSenderName,
                isMe: (originalSender === myUsername), // للتمييز بين المرسل والمستقبل
                content: content,
                dateObj: dateObj,
                monthKey: `${dateObj.getFullYear()}-${dateObj.getMonth()}`,
                monthLabel: dateObj.toLocaleDateString('ar-IQ', { month: 'long', year: 'numeric' })
            });
        }
    });
}

function finalizeAndRender() {
    allMessages.sort((a, b) => {
        if (a.dateObj.getTime() === b.dateObj.getTime()) return a.originalIndex - b.originalIndex;
        return a.dateObj - b.dateObj;
    });

    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML = ''; 

    if (allMessages.length === 0) {
        chatBox.innerHTML = '<div style="text-align:center; color:#8E8E93; margin-top:50px;">لم يتم العثور على رسائل لهذا المستخدم.</div>';
        return;
    }

    let lastDate = '';

    allMessages.forEach(msg => {
        const msgDate = msg.dateObj.toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
        if (msgDate !== lastDate) {
            const dateDiv = document.createElement('div');
            dateDiv.className = 'date-divider';
            dateDiv.innerText = msgDate;
            chatBox.appendChild(dateDiv);
            lastDate = msgDate;
        }

        const wrapper = document.createElement('div');
        wrapper.id = msg.id;
        wrapper.className = `message-wrapper ${msg.isMe ? 'me' : 'them'}`;

        const msgDiv = document.createElement('div');
        msgDiv.className = 'message';
        msgDiv.innerText = msg.content;

        const fullDateStr = msg.dateObj.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const timeStr = msg.dateObj.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute:'2-digit' });
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'time';
        timeDiv.innerText = `${fullDateStr} • ${timeStr}`;

        wrapper.appendChild(msgDiv);
        wrapper.appendChild(timeDiv);
        chatBox.appendChild(wrapper);
    });

    populateDateFilter(); 
    setTimeout(() => { chatBox.scrollTop = chatBox.scrollHeight; }, 100);
}

// ================= الفلتر والبحث (كما برمجناه سابقاً) =================
function populateDateFilter() {
    const filterSelect = document.getElementById('monthFilter');
    filterSelect.innerHTML = '<option value="">تصفية التاريخ 🗓️</option>';
    const uniqueMonths = new Map();
    allMessages.forEach(msg => { if (!uniqueMonths.has(msg.monthKey)) uniqueMonths.set(msg.monthKey, msg.monthLabel); });
    uniqueMonths.forEach((label, key) => {
        const opt = document.createElement('option'); opt.value = key; opt.innerText = label; filterSelect.appendChild(opt);
    });
}

document.getElementById('monthFilter').addEventListener('change', (e) => {
    const targetMsg = allMessages.find(m => m.monthKey === e.target.value);
    if (targetMsg) jumpToMessage(targetMsg.id);
    e.target.value = ''; 
});

const searchOverlay = document.getElementById('searchOverlay');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

document.getElementById('openSearchBtn').addEventListener('click', () => { searchOverlay.classList.add('active'); searchInput.focus(); });
document.getElementById('closeSearchBtn').addEventListener('click', () => { searchOverlay.classList.remove('active'); });

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    searchResults.innerHTML = '';
    if (!term) { searchResults.innerHTML = '<div class="empty-search">اكتب للبحث...</div>'; return; }
    const filtered = allMessages.filter(m => m.content.toLowerCase().includes(term));
    if(filtered.length === 0) { searchResults.innerHTML = '<div class="empty-search">لا توجد نتائج.</div>'; return; }
    
    filtered.forEach(msg => {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.innerHTML = `<div class="result-avatar">${msg.isMe ? '👤' : currentActiveChat.avatar}</div>
                          <div class="result-details">
                              <div class="result-name">${msg.sender}</div>
                              <div class="result-text">${msg.content}</div>
                              <div class="result-date">${msg.dateObj.toLocaleDateString('ar-IQ')}</div>
                          </div>`;
        item.addEventListener('click', () => { searchOverlay.classList.remove('active'); jumpToMessage(msg.id); });
        searchResults.appendChild(item);
    });
});

function jumpToMessage(msgId) {
    const element = document.getElementById(msgId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('highlight-msg');
        setTimeout(() => { element.classList.remove('highlight-msg'); }, 2000);
    }
}

// تشغيل النظام
window.onload = renderInbox;
