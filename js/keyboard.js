// ============ Step 5：全键盘操作 ============
        // 当前聚焦卡片索引
        let currentIdx = 0;
        function getVisibleCards() {
            return Array.from(document.querySelectorAll('.annot-card')).filter(c => c.style.display !== 'none');
        }
        function focusCard(idx) {
            const cards = getVisibleCards();
            if (cards.length === 0) return;
            if (idx < 0) idx = cards.length - 1;
            if (idx >= cards.length) idx = 0;
            cards.forEach(c => c.classList.remove('focus-current'));
            cards[idx].classList.add('focus-current');
            cards[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
            currentIdx = idx;
        }
        // 同步点击聚焦
        document.querySelectorAll('.annot-card').forEach(card => {
            card.addEventListener('click', () => {
                const cards = getVisibleCards();
                const i = cards.indexOf(card);
                if (i >= 0) currentIdx = i;
            });
        });

        // 顶部「整条通过」「拒绝」「提交」按钮
        document.getElementById('pass-all-btn')?.addEventListener('click', () => {
            if (!confirm('确认整条视频无违规，整体通过？\n\n（操作后当前任务将标记为通过并进入下一题）')) return;
            document.querySelectorAll('.annot-card').forEach(c => {
                if (!c.classList.contains('confirmed') && !c.classList.contains('rejected')) {
                    c.classList.add('rejected'); // 将所有未处理卡片视为剔除（即AI预标注误判）
                }
            });
            showFloatToast('✓ 整条通过 — 已记录，即将进入下一题');
            renderVideoSegments?.();
            showProgress?.();
        });
        document.querySelectorAll('.top-bar .btn').forEach(btn => {
            const txt = btn.textContent.trim();
            if (txt.startsWith('拒绝')) {
                btn.addEventListener('click', () => showFloatToast('✗ 当前任务已整体拒绝'));
            } else if (txt.startsWith('提交')) {
                btn.addEventListener('click', () => {
                    const total = document.querySelectorAll('.annot-card').length;
                    const done = document.querySelectorAll('.annot-card.confirmed, .annot-card.rejected').length;
                    showFloatToast(`📤 提交标注：${done}/${total} 已处理`);
                });
            }
        });

        // 视频模拟播放 + 进度条跳转
        const TOTAL_SECONDS = 34;
        let simulatedTime = 0; // 当前模拟秒数
        let isPlaying = false;
        let playTimer = null;
