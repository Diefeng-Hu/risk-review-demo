function showProgress() {
            const cards = document.querySelectorAll('.annot-card');
            const total = cards.length;
            const done = document.querySelectorAll('.annot-card.confirmed').length;
            const rej = document.querySelectorAll('.annot-card.rejected').length;
            const pending = total - done - rej;
            const elDone = document.getElementById('stat-done');
            const elRej = document.getElementById('stat-rej');
            const elTotal = document.getElementById('stat-total');
            if (elDone) elDone.textContent = (done + rej);
            if (elRej) elRej.textContent = rej;
            if (elTotal) elTotal.textContent = total;
            const fillDone = document.getElementById('fill-done');
            const fillRej = document.getElementById('fill-rej');
            const donePct = total ? (done / total * 100) : 0;
            const rejPct = total ? (rej / total * 100) : 0;
            if (fillDone) fillDone.style.width = donePct + '%';
            if (fillRej) { fillRej.style.left = donePct + '%'; fillRej.style.width = rejPct + '%'; }
            // 同步筛选 tab 角标
            const counts = {
                all: total,
                text: document.querySelectorAll('.annot-card[data-type="text"]').length,
                voice: document.querySelectorAll('.annot-card[data-type="voice"]').length,
                scene: document.querySelectorAll('.annot-card[data-type="scene"]').length,
                pending: pending
            };
            Object.keys(counts).forEach(k => {
                const el = document.querySelector(`.badge-num[data-count="${k}"]`);
                if (el) el.textContent = counts[k];
            });
        }

        // 7) 帮助按钮
        document.getElementById('shortcut-help-btn')?.addEventListener('click', () => {
            alert('完整快捷键帮助将在 Step 5 实现\n\n当前可用：\n• 点击卡片 → 聚焦\n• 时间轴片段 → 跳转对应卡片\n• 违规理由 → 展开多选列表');
        });

        // 8) 队列项点击切换
        document.querySelectorAll('.queue-item').forEach(q => {
            q.addEventListener('click', () => {
                const isCurrent = q.classList.contains('current');
                if (isCurrent) return;
                document.querySelectorAll('.queue-item').forEach(x => x.classList.remove('current'));
                q.classList.add('current');
                if (!q.classList.contains('done') && !q.classList.contains('rejected')) {
                    q.querySelector('.q-status').textContent = '▶ 当前';
                }
                // 模拟切题：闪烁视频
                const video = document.querySelector('.video-container img');
                if (video) {
                    const id = q.querySelector('.q-id').textContent.replace('#', '');
                    video.style.opacity = '0.3';
                    setTimeout(() => {
                        video.src = `https://picsum.photos/seed/case${id}/240/427`;
                        video.style.opacity = '1';
                    }, 200);
                }
                showFloatToast(`✓ 已切换到 ${q.querySelector('.q-id').textContent}`);
            });
        });

        // 10) 参考侧栏：分区折叠/展开（ASR / OCR 同时展示）
        document.querySelectorAll('.ref-side-section-head').forEach(head => {
            head.addEventListener('click', () => {
                head.parentElement.classList.toggle('collapsed');
            });
        });

        // 11) 参考侧栏中的 ASR/OCR 行点击 → 弹出操作菜单
        // 已有 data-card → 定位 / 修改风险点；无 data-card → 新增风险点
        let currentMenu = null;
        function closeMenu() {
            if (currentMenu) { currentMenu.remove(); currentMenu = null; }
        }
        document.addEventListener('click', closeMenu);
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

        function buildRowMenu(row, { cardId, timeText, rowText, source }) {
            closeMenu();
            const menu = document.createElement('div');
            menu.className = 'row-action-menu';
            menu.onclick = e => e.stopPropagation();
            const label = timeText ? `${source} · ${timeText}` : source;
            menu.innerHTML = `<div class="menu-header">${label}</div>`;

            // 如果有关联卡片：定位 + 打开修改分类
            if (cardId) {
                const card = document.querySelector(`[data-id="${cardId}"]`);
                if (card) {
                    // 定位卡片
                    const gotoItem = document.createElement('div');
                    gotoItem.className = 'menu-item';
                    gotoItem.innerHTML = '<span class="mi-icon">📌</span> 定位到风险点';
                    gotoItem.onclick = () => {
                        closeMenu();
                        document.querySelectorAll('.annot-card').forEach(c => c.classList.remove('focus-current'));
                        card.classList.add('focus-current');
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // 确保切换到"全部"或相关 filter，让卡片可见
                        const pending = !card.classList.contains('confirmed') && !card.classList.contains('rejected');
                        const targetFilter = pending ? 'pending' : 'resolved';
                        const tab = document.querySelector(`.filter-tab[data-filter="${targetFilter}"], .filter-tab[data-filter="all"]`);
                        if (tab && !document.querySelector('.filter-tab.active')?.classList?.contains(targetFilter)) {
                            document.querySelector('.filter-tab[data-filter="pending"]')?.click();
                        }
                        showFloatToast(`📌 已定位到 #${cardId.replace('card-', '')}`);
                    };
                    menu.appendChild(gotoItem);

                    // 修改风险点
                    const editItem = document.createElement('div');
                    editItem.className = 'menu-item';
                    editItem.innerHTML = '<span class="mi-icon">✎</span> 修改此风险点';
                    editItem.onclick = () => {
                        closeMenu();
                        document.querySelectorAll('.annot-card').forEach(c => c.classList.remove('focus-current'));
                        card.classList.add('focus-current');
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // 展开违规理由多选区
                        const multi = card.querySelector('.reason-multi');
                        if (multi) multi.classList.remove('collapsed');
                        const editBtn = card.querySelector('.action-btn.edit');
                        if (editBtn) editBtn.click();
                        showFloatToast(`✎ 正在修改风险点 #${cardId.replace('card-', '')}`);
                    };
                    menu.appendChild(editItem);
                    const div1 = document.createElement('div'); div1.className = 'menu-divider'; menu.appendChild(div1);
                }
            }

            // 新增为风险点（根据来源自动选类型，无需手动选择）
            const addItem = document.createElement('div');
            addItem.className = 'menu-item';
            addItem.innerHTML = '<span class="mi-icon">＋</span> 新增为风险点';
            addItem.onclick = () => {
                closeMenu();
                // ASR 来源 → 语音文字；OCR 来源 → 画面文字
                const autoType = source === 'ASR' ? 'voice' : 'text';
                addNewRiskCard(autoType, rowText, timeText);
            };
            menu.appendChild(addItem);
            document.body.appendChild(menu);
            currentMenu = menu;
            return menu;
        }

        function positionMenu(menu, e) {
            const rect = menu.getBoundingClientRect();
            let x = e.clientX, y = e.clientY + 8;
            if (x + 190 > window.innerWidth) x = window.innerWidth - 200;
            if (y + rect.height > window.innerHeight) y = e.clientY - rect.height - 4;
            menu.style.left = x + 'px'; menu.style.top = y + 'px';
        }

        // 绑定 ASR 行 & OCR 行 — 支持多选（Ctrl/Cmd+点击）
        let selectedRows = [];
        let multiSelectBar = null;
