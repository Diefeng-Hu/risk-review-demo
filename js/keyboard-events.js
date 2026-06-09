// ============ 键盘事件 ============
        document.addEventListener('keydown', e => {
            const tag = (e.target.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

            // ⌘/Ctrl + S → 提交
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                document.querySelectorAll('.top-bar .btn').forEach(b => {
                    if (b.textContent.includes('提交')) b.click();
                });
                return;
            }
            if (e.metaKey || e.ctrlKey || e.altKey) return;

            const key = e.key;
            const lower = key.toLowerCase();
            const cards = getVisibleCards();
            const card = cards[currentIdx];

            switch (lower) {
                case 'a':
                    // A：接受当前卡片
                    e.preventDefault();
                    if (card) {
                        const btn = card.querySelector('.action-btn.accept');
                        if (btn) { btn.click(); }
                    }
                    break;
                case 'd':
                    // D：剔除当前卡片
                    e.preventDefault();
                    if (card) {
                        const btn = card.querySelector('.action-btn.reject');
                        if (btn) { btn.click(); }
                    }
                    break;
                case 'w':
                    e.preventDefault();
                    document.querySelectorAll('.top-bar .btn').forEach(b => {
                        if (b.textContent.trim().startsWith('拒绝')) b.click();
                    });
                    break;
                case 'c':
                    e.preventDefault();
                    document.querySelectorAll('.bottom-status .btn-primary, .top-bar .btn').forEach(b => {
                        if (b.textContent.trim().startsWith('提交')) b.click();
                    });
                    break;
                case 'g':
                    // g 聚焦当前卡片
                    e.preventDefault();
                    if (card) {
                        document.querySelectorAll('.annot-card').forEach(c => c.classList.remove('focus-current'));
                        card.classList.add('focus-current');
                        showFloatToast('☑ 已聚焦当前卡片');
                    }
                    break;
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        document.querySelectorAll('.annot-card').forEach(c => setCardState(c, 'pending'));
                        document.querySelectorAll('.annot-card').forEach(c => c.classList.remove('focus-current'));
                        showFloatToast('🗑 已全部清除标注');
                    } else {
                        document.querySelectorAll('.annot-card.checked').forEach(c => c.classList.remove('checked'));
                        updateBatchBar();
                        showFloatToast('☐ 已取消多选');
                    }
                    showProgress();
                    break;
                case 'x':
                    e.preventDefault();
                    if (card) {
                        const btn = card.querySelector('.action-btn.reject');
                        if (btn) { btn.click(); }
                    }
                    break;
                case 'e':
                    e.preventDefault();
                    if (card) {
                        const editBtn = card.querySelector('.action-btn.edit');
                        if (editBtn) { editBtn.click(); }
                    }
                    break;
                case 'arrowdown':
                case 'j':
                    e.preventDefault();
                    focusCard(currentIdx + 1);
                    break;
                case 'arrowup':
                case 'k':
                    e.preventDefault();
                    focusCard(currentIdx - 1);
                    break;
                case 'enter':
                    // Enter 接受当前
                    e.preventDefault();
                    if (card) {
                        const btn = card.querySelector('.action-btn.accept');
                        if (btn) { btn.click(); }
                    }
                    break;
                case ' ':
                    e.preventDefault();
                    document.querySelector('.play-btn-mini')?.click();
                    break;
                case 'n':
                    // n 下一题
                    e.preventDefault();
                    const queue = document.querySelectorAll('.queue-item');
                    let curIdx = -1;
                    queue.forEach((q, i) => { if (q.classList.contains('current')) curIdx = i; });
                    if (curIdx >= 0 && curIdx < queue.length - 1) {
                        queue[curIdx + 1].click();
                    }
                    break;
                case '1':
                case '2':
                    e.preventDefault();
                    const targetPane = key === '1' ? 'asr' : 'ocr';
                    const sec = document.querySelector(`.ref-side-section[data-pane="${targetPane}"]`);
                    if (sec) {
                        sec.classList.remove('collapsed');
                        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    break;
                case '?':
                case '/':
                    e.preventDefault();
                    showShortcutModal(true);
                    break;
                case 'escape':
                    showShortcutModal(false);
                    break;
            }
        });
