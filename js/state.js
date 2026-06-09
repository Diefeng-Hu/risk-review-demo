// Step 3 脚本：卡片交互
        // 2) 快捷标签 → 自动写入违规理由
        document.querySelectorAll('.quick-tags').forEach(tags => {
            tags.querySelectorAll('.quick-tag').forEach(tag => {
                tag.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const card = tag.closest('.annot-card');
                    // 互斥：同组内单选
                    tags.querySelectorAll('.quick-tag').forEach(t => t.classList.remove('active'));
                    tag.classList.add('active');
                    // 自动填充违规理由
                    if (card) {
                        const reasonEl = card.querySelector('.reason-text, .reason-input');
                        if (reasonEl) {
                            reasonEl.textContent = tag.textContent.trim();
                            showFloatToast(`✓ 违规理由：${tag.textContent.trim()}`);
                        }
                    }
                });
            });
        });

        // 3) 卡片点击聚焦 + 自动跳转到对应视频时间
        document.querySelectorAll('.annot-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // 忽略按钮、可编辑区域、链接、checkbox、reason-multi 的点击
                if (e.target.closest('button, a, [contenteditable="true"], input, textarea, select, .reason-multi, .quick-tag, .reject-reason-input')) {
                    return;
                }
                document.querySelectorAll('.annot-card').forEach(c => c.classList.remove('focus-current'));
                card.classList.add('focus-current');
                // 自动跳转到该卡片的视频时间 + 进度条定位
                const timeEl = card.querySelector('.card-time');
                if (timeEl) {
                    const timeText = timeEl.textContent.trim().replace(/[▶\s]/g, '');
                    seekVideoTo(timeText);
                    showFloatToast(`⏯ 跳转到 ${timeEl.textContent.trim()}`);
                }
            });
        });

        // 4) 接受/剔除按钮 → 切换为「已处理」状态
        function setCardState(card, state, extra) {
            // state: 'accepted' | 'rejected' | 'pending'
            card.classList.remove('confirmed', 'rejected', 'editing');
            card.querySelectorAll('.status-badge').forEach(b => b.remove());
            card.querySelectorAll('.reject-reason-tip').forEach(b => b.remove());
            const actions = card.querySelector('.annot-actions');
            const head = card.querySelector('.card-head');
            const spacer = head?.querySelector('.spacer');

            if (state === 'accepted') {
                card.classList.add('confirmed');
                card.classList.remove('flash-reject');
                // 触发闪烁动画
                card.classList.remove('flash-accept');
                void card.offsetWidth;
                card.classList.add('flash-accept');
                if (head) {
                    const badge = document.createElement('span');
                    badge.className = 'status-badge accepted';
                    badge.textContent = '✓ 已接受';
                    if (spacer) spacer.parentNode.insertBefore(badge, spacer); else head.appendChild(badge);
                }
                if (actions) actions.innerHTML = '<button class="action-btn undo">↺ 撤销</button><span style="font-size:11px;color:#52c41a;margin-left:6px;">已记录</span>';
            } else if (state === 'rejected') {
                card.classList.add('rejected');
                card.classList.remove('flash-accept');
                card.classList.remove('flash-reject');
                void card.offsetWidth;
                card.classList.add('flash-reject');
                if (head) {
                    const badge = document.createElement('span');
                    badge.className = 'status-badge rejected';
                    badge.textContent = '✗ 已剔除';
                    if (spacer) spacer.parentNode.insertBefore(badge, spacer); else head.appendChild(badge);
                }
                if (actions) {
                    const reasonHtml = extra?.reason ? `<span class="reject-reason-tip" style="font-size:11px;color:#999;margin-left:6px;">原因：${extra.reason}</span>` : '';
                    actions.innerHTML = '<button class="action-btn undo">↺ 撤销</button>' + reasonHtml;
                }
            } else {
                if (actions) actions.innerHTML = '<button class="action-btn accept">✓ 接受</button><button class="action-btn reject">✗ 剔除</button>';
            }
            bindCardActions(card);
            showProgress();
        }
        function focusNextPending(card) {
            const cards = Array.from(document.querySelectorAll('.annot-card'));
            const i = cards.indexOf(card);
            for (let k = 1; k <= cards.length; k++) {
                const c = cards[(i + k) % cards.length];
                if (!c.classList.contains('confirmed') && !c.classList.contains('rejected')) {
                    document.querySelectorAll('.annot-card').forEach(x => x.classList.remove('focus-current'));
                    c.classList.add('focus-current');
                    c.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    break;
                }
            }
        }
        function promptInline(card, placeholder, onSubmit) {
            const actions = card.querySelector('.annot-actions');
            if (!actions) return;
            const old = actions.innerHTML;
            const templates = ['AI 误判', '原文无违规', '已在其他卡片覆盖', '时间段不准', '类型分类错误', '截图不清晰'];
            actions.innerHTML = `
                <select class="reject-template" style="padding:3px 6px;border:1px solid #ff7875;border-radius:3px;font-size:12px;outline:none;background:#fff;">
                    <option value="">— 选择常用原因 —</option>
                    ${templates.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
                <input type="text" class="inline-prompt reject-reason-input" placeholder="${placeholder}" style="flex:1;padding:3px 8px;border:1px solid #ff7875;border-radius:3px;font-size:12px;outline:none;">
                <button class="action-btn reject confirm-reject">确认剔除</button>
                <button class="action-btn cancel-prompt">取消</button>
            `;
            const inp = actions.querySelector('.inline-prompt');
            const tpl = actions.querySelector('.reject-template');
            tpl.onchange = e => { e.stopPropagation(); if (tpl.value) { inp.value = tpl.value; inp.focus(); } };
            inp.focus();
            actions.querySelector('.confirm-reject').onclick = e => {
                e.stopPropagation();
                onSubmit(inp.value.trim() || '未填写');
            };
            actions.querySelector('.cancel-prompt').onclick = e => {
                e.stopPropagation();
                actions.innerHTML = old;
                bindCardActions(card);
            };
            inp.addEventListener('keydown', e => {
                if (e.key === 'Enter') { e.preventDefault(); actions.querySelector('.confirm-reject').click(); }
                if (e.key === 'Escape') { e.preventDefault(); actions.querySelector('.cancel-prompt').click(); }
            });
        }
        function bindCardActions(card) {
            card.querySelectorAll('.action-btn.accept').forEach(b => {
                b.onclick = e => {
                    e.stopPropagation();
                    setCardState(card, 'accepted');
                    showFloatToast('✓ 已接受');
                    focusNextPending(card);
                };
            });
            card.querySelectorAll('.action-btn.reject').forEach(b => {
                b.onclick = e => {
                    e.stopPropagation();
                    promptInline(card, '请输入剔除原因（可留空）', reason => {
                        setCardState(card, 'rejected', { reason });
                        showFloatToast('✗ 已剔除');
                        focusNextPending(card);
                    });
                };
            });
            card.querySelectorAll('.action-btn.undo').forEach(b => {
                b.onclick = e => { e.stopPropagation(); setCardState(card, 'pending'); showFloatToast('↺ 已撤销'); };
            });
        }
        // 绑定卡片操作事件
        document.querySelectorAll('.annot-card').forEach(c => bindCardActions(c));
        // 初始已接受/已剔除卡片应用样式
        document.querySelectorAll('.annot-card.confirmed').forEach(c => setCardState(c, 'accepted'));
        document.querySelectorAll('.annot-card.rejected').forEach(c => setCardState(c, 'rejected'));
