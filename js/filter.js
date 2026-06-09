// ============ 提交前质量自检 ============
        const sessionStartTime = Date.now();
        let lastDecisionTime = sessionStartTime;
        const decisionTimes = [];
        const _origSetCardState2 = setCardState;
        setCardState = function(card, state, extra) {
            if (state === 'accepted' || state === 'rejected') {
                const now = Date.now();
                decisionTimes.push(now - lastDecisionTime);
                lastDecisionTime = now;
            }
            _origSetCardState2(card, state, extra);
            // 接受/剔除 → 更新筛选 & 计数（卡片留在原位置，仅通过 filter 切换显隐）
            applyCurrentFilter();
            updateBadgeCounts();
        };

        // ============ 筛选 / 计数 ============
        const cardsFlowEl = document.getElementById('cards-flow');
        // 记录每张卡片的原始顺序
        document.querySelectorAll('#cards-flow > .annot-card').forEach((c, i) => {
            c.dataset.origIdx = i;
        });
        function getCurrentFilter() {
            const active = document.querySelector('.filter-tab.active');
            return active ? (active.dataset.filter || 'pending') : 'pending';
        }
        function applyCurrentFilter() {
            const filter = getCurrentFilter();
            cardsFlowEl.classList.toggle('show-resolved', filter === 'all' || filter === 'resolved');
            document.querySelectorAll('#cards-flow > .annot-card').forEach(card => {
                const isResolved = card.classList.contains('confirmed') || card.classList.contains('rejected');
                let show = true;
                if (filter === 'pending') show = !isResolved;
                else if (filter === 'resolved') show = isResolved;
                else if (filter === 'text') show = card.dataset.type === 'text';
                else if (filter === 'voice') show = card.dataset.type === 'voice';
                else if (filter === 'scene') show = card.dataset.type === 'scene';
                else show = true; // all
                card.style.display = show ? '' : 'none';
            });
        }
        function updateBadgeCounts() {
            const all = document.querySelectorAll('#cards-flow > .annot-card');
            const counts = { all: all.length, text: 0, voice: 0, scene: 0, pending: 0, resolved: 0 };
            all.forEach(c => {
                const t = c.dataset.type;
                if (counts[t] !== undefined) counts[t]++;
                if (c.classList.contains('confirmed') || c.classList.contains('rejected')) counts.resolved++;
                else counts.pending++;
            });
            Object.entries(counts).forEach(([k, v]) => {
                const el = document.querySelector(`.badge-num[data-count="${k}"]`);
                if (el) el.textContent = v;
            });
        }
        applyCurrentFilter();
        updateBadgeCounts();

        function updateQualityCheck() {
            // 占位：后续可以在底栏显示平均决策耗时
        }
        // 提交按钮拦截：检查决策速度
        function qualityGate() {
            const total = document.querySelectorAll('.annot-card').length;
            const done = document.querySelectorAll('.annot-card.confirmed, .annot-card.rejected').length;
            if (done < total) {
                const remain = total - done;
                if (!confirm(`还有 ${remain} 项未处理，确认要提交吗？`)) return false;
            }
            if (decisionTimes.length >= 3) {
                const avg = decisionTimes.reduce((a, b) => a + b, 0) / decisionTimes.length;
                if (avg < 2000) {
                    if (!confirm(`⚠ 平均每项决策仅 ${(avg / 1000).toFixed(1)} 秒，建议复查后再提交。\n\n仍要提交？`)) {
                        // 随机高亮一张已处理卡片提示复核
                        const processed = document.querySelectorAll('.annot-card.confirmed, .annot-card.rejected');
                        if (processed.length > 0) {
                            const pick = processed[Math.floor(Math.random() * processed.length)];
                            document.querySelectorAll('.annot-card').forEach(c => c.classList.remove('focus-current'));
                            pick.classList.add('focus-current');
                            pick.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            showFloatToast('🔍 请复核此项');
                        }
                        return false;
                    }
                }
            }
            return true;
        }

        // ============ 一键全部接受（仅作用于"待处理" 卡片） ============
        function acceptAllPending() {
            const pending = document.querySelectorAll('.annot-card:not(.confirmed):not(.rejected)');
            if (pending.length === 0) {
                showFloatToast('已无待处理项');
                return;
            }
            // 二次确认 + 速度提醒
            const sessionElapsed = Date.now() - sessionStartTime;
            const tooFast = sessionElapsed < pending.length * 2000;
            const warn = tooFast
                ? `⚠ 距离开始审核仅 ${(sessionElapsed/1000).toFixed(1)} 秒，平均每项不足 2 秒。\n\n建议先抽查几项再批量接受。\n\n仍要一键接受全部 ${pending.length} 项？`
                : `确认要一键接受剩余 ${pending.length} 项待处理风险点？\n\n（接受后仍可在卡片上单独剔除/编辑）`;
            if (!confirm(warn)) return;
            // 逐张接受（带轻量动画错峰，视觉上"一片绿"扫过）
            pending.forEach((card, i) => {
                setTimeout(() => {
                    setCardState(card, 'accepted');
                }, i * 60);
            });
            showFloatToast(`✓ 已一键接受 ${pending.length} 项`);
        }
        document.getElementById('accept-all-btn')?.addEventListener('click', e => {
            e.stopPropagation();
            acceptAllPending();
        });
        // 快捷键：Shift+A 一键全部接受
        document.addEventListener('keydown', e => {
            const tag = (e.target.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
            if (e.shiftKey && e.key.toLowerCase() === 'a' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                acceptAllPending();
            }
        });
        // 包装顶栏提交按钮
        document.querySelectorAll('.top-bar .btn').forEach(btn => {
            if (btn.textContent.trim().startsWith('提交')) {
                const orig = btn.onclick;
                btn.onclick = null;
                btn.addEventListener('click', e => {
                    if (!qualityGate()) { e.stopImmediatePropagation(); return; }
                }, true);
            }
        });
