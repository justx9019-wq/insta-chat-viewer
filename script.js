// اسم حسابك لتحديد من المُرسل والمُستقبل
const myUsername = "upinthehellof"; 

// أسماء الملفات الوهمية التي سيقرأها الكود من نفس المجلد
// الترتيب هنا يبدأ من الأقدم للأحدث لمعالجتها بشكل صحيح
const filesToLoad = ['message_3.html', 'message_2.html', 'message_1.html'];

let allMessages = [];

// وظيفة جلب الملفات تلقائياً عند فتح الموقع
async function loadConversations() {
    allMessages = [];
    let globalIndex = 0;

    for (const fileName of filesToLoad) {
        try {
            // جلب الملف من نفس المجلد
            const response = await fetch(fileName);
            if (!response.ok) {
                console.warn(`الملف ${fileName} غير موجود أو لم يتم رفعه.`);
                continue;
            }
            const htmlString = await response.text();
            
            // إرسال الكود للتحليل
            parseHTML(htmlString, globalIndex);
            globalIndex += 10000; // مسافة أمان لتسلسل الملفات
        } catch (error) {
            console.error(`خطأ في قراءة ${fileName}:`, error);
        }
    }

    // الترتيب النهائي والدقيق للرسائل
    finalizeAndRender();
}

function parseHTML(htmlString, fileBaseIndex) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    
    // جلب كل الرسائل من الملف
    const messageDivs = Array.from(doc.querySelectorAll('.pam._3-95._2ph-._a6-g.uiBoxWhite.noborder'));
    
    // *السر هنا*: إنستغرام يضع الأحدث في أعلى الملف، لذا نعكس المصفوفة لتصبح من الأقدم للأحدث داخل هذا الملف.
    messageDivs.reverse();

    messageDivs.forEach((div, index) => {
        const senderEl = div.querySelector('h2');
        if (!senderEl) return;
        const sender = senderEl.innerText.trim();
        
        let content = '';
        const messageContainer = div.querySelector('div._3-95._a6-p');
        if (messageContainer) {
            const textSpan = messageContainer.querySelector('span');
            if (textSpan && textSpan.innerText.trim() !== "") {
                content = textSpan.innerText;
            } else {
                content = "🖼️ [وسائط مرسلة]"; // إذا كانت صورة أو فيديو
            }
        }

        const timeText = div.querySelector('div._3-94._a6-o').innerText.trim();
        const dateObj = new Date(timeText);

        if (content !== '') {
            allMessages.push({
                id: `msg-${fileBaseIndex + index}`,
                originalIndex: fileBaseIndex + index, // للحفاظ على الترتيب داخل نفس الدقيقة
                sender: sender,
                content: content,
                dateObj: dateObj
            });
        }
    });
}

function finalizeAndRender() {
    // ترتيب الرسائل: أولاً حسب التاريخ، وإذا تطابقت الدقيقة، نرتبها حسب موقعها الأصلي المعكوس
    allMessages.sort((a, b) => {
        if (a.dateObj.getTime() === b.dateObj.getTime()) {
            return a.originalIndex - b.originalIndex;
        }
        return a.dateObj - b.dateObj;
    });

    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML = ''; // مسح علامة التحميل

    if (allMessages.length === 0) {
        chatBox.innerHTML = '<div style="text-align:center; color:#8E8E93; margin-top:50px;">لم يتم العثور على رسائل. تأكد من رفع الملفات الوهمية بجوار ملفات الموقع.</div>';
        return;
    }

    let lastDate = '';

    allMessages.forEach(msg => {
        // فاصل التاريخ
        const msgDate = msg.dateObj.toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
        if (msgDate !== lastDate) {
            const dateDiv = document.createElement('div');
            dateDiv.className = 'date-divider';
            dateDiv.innerText = msgDate;
            chatBox.appendChild(dateDiv);
            lastDate = msgDate;
        }

        // فقاعة الرسالة
        const wrapper = document.createElement('div');
        wrapper.id = msg.id;
        const isMe = msg.sender === myUsername;
        wrapper.className = `message-wrapper ${isMe ? 'me' : 'them'}`;

        const msgDiv = document.createElement('div');
        msgDiv.className = 'message';
        msgDiv.innerText = msg.content;

        const timeDiv = document.createElement('div');
        timeDiv.className = 'time';
        timeDiv.innerText = msg.dateObj.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute:'2-digit' });

        wrapper.appendChild(msgDiv);
        wrapper.appendChild(timeDiv);
        chatBox.appendChild(wrapper);
    });

    // النزول لآخر المحادثة
    setTimeout(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 100);
}

// ---------------- واجهة البحث المستقلة ----------------

const searchOverlay = document.getElementById('searchOverlay');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

document.getElementById('openSearchBtn').addEventListener('click', () => {
    searchOverlay.classList.add('active'); // إظهار واجهة البحث
    searchInput.focus();
});

document.getElementById('closeSearchBtn').addEventListener('click', () => {
    searchOverlay.classList.remove('active'); // إخفاء واجهة البحث
});

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    searchResults.innerHTML = '';
    
    if (!term) {
        searchResults.innerHTML = '<div class="empty-search">اكتب للبحث في الرسائل...</div>';
        return;
    }

    const filtered = allMessages.filter(m => m.content.toLowerCase().includes(term));
    
    if(filtered.length === 0) {
        searchResults.innerHTML = '<div class="empty-search">لا توجد نتائج.</div>';
        return;
    }

    filtered.forEach(msg => {
        const item = document.createElement('div');
        item.className = 'result-item';
        
        const avatarIcon = msg.sender === myUsername ? '👤' : '👥';
        const dateStr = msg.dateObj.toLocaleDateString('ar-IQ');

        item.innerHTML = `
            <div class="result-avatar">${avatarIcon}</div>
            <div class="result-details">
                <div class="result-name">${msg.sender}</div>
                <div class="result-text">${msg.content}</div>
                <div class="result-date">${dateStr}</div>
            </div>
        `;
        
        item.addEventListener('click', () => {
            searchOverlay.classList.remove('active'); // إغلاق البحث
            jumpToMessage(msg.id); // الذهاب للرسالة
        });
        
        searchResults.appendChild(item);
    });
});

function jumpToMessage(msgId) {
    const element = document.getElementById(msgId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('highlight-msg');
        setTimeout(() => {
            element.classList.remove('highlight-msg');
        }, 2000);
    }
}

// تشغيل الكود بمجرد تحميل الصفحة
window.onload = loadConversations;
