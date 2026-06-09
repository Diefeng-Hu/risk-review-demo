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

        // 4) 接受/编辑/剔除按钮 → 切换为「已处理」状态
        function setCardState(card, state, extra) {
            // state: 'accepted' | 'rejected' | 'pending' | 'editing'
            card.classList.remove('confirmed', 'rejected', 'editing');
            card.querySelectorAll('.status-badge').forEach(b => b.remove());
            card.querySelectorAll('.reject-reason-tip').forEach(b => b.remove());
            const actions = card.querySelector('.annot-actions');
            const head = card.querySelector('.card-head');
            const spacer = head?.querySelector('.spacer');
            // 关闭编辑态
            card.querySelectorAll('[data-editable="1"]').forEach(el => {
                el.contentEditable = 'false';
                el.style.background = '';
                el.style.outline = '';
                el.removeAttribute('data-editable');
            });

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
            } else if (state === 'editing') {
                card.classList.add('editing');
                // 原文区：只加虚线视觉，不可编辑
                const orig = card.querySelector('.original-text');
                if (orig) {
                    orig.contentEditable = 'false';
                    orig.removeAttribute('data-editable');
                    orig.style.cssText = '';
                }
                // 违规理由：替换为 input + 铅笔图标
                const reasonRow = card.querySelector('.reason-row');
                if (reasonRow) {
                    const currentText = reasonRow.querySelector('.reason-text')?.textContent?.trim() || '';
                    // 隐藏原始文本
                    const rt = reasonRow.querySelector('.reason-text');
                    if (rt) rt.style.display = 'none';
                    // 隐藏点击编辑铅笔
                    const origEi = reasonRow.querySelector('.edit-icon');
                    if (origEi) origEi.style.display = 'none';
                    // 插入可编辑 input
                    let inp = reasonRow.querySelector('.reason-input');
                    if (!inp) {
                        inp = document.createElement('input');
                        inp.type = 'text';
                        inp.className = 'reason-input';
                        if (rt) { reasonRow.insertBefore(inp, rt.nextSibling); }
                        else { reasonRow.appendChild(inp); }
                    }
                    inp.value = currentText;
                    inp.style.display = '';
                    inp.placeholder = '格式：时间段：违规理由；时间段：违规理由  例如：1-3：暗示壮阳；1:32-1:34：夸大功效';
                    // 尾部展示铅笔图标（装饰，不可点击）
                    let decoIcon = reasonRow.querySelector('.deco-icon');
                    if (!decoIcon) {
                        decoIcon = document.createElement('span');
                        decoIcon.className = 'deco-icon';
                        decoIcon.textContent = '✎';
                        decoIcon.style.pointerEvents = 'none';
                        reasonRow.appendChild(decoIcon);
                    }
                    decoIcon.style.display = '';
                    setTimeout(() => inp.focus(), 50);
                }
                if (actions) actions.innerHTML = '<button class="action-btn accept save">✓ 保存编辑</button><button class="action-btn cancel">× 取消</button>';
            } else {
                if (actions) actions.innerHTML = '<button class="action-btn accept">✓ 接受</button><button class="action-btn edit">✎ 编辑</button><button class="action-btn reject">✗ 剔除</button>';
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
                if (b.classList.contains('save')) {
                    b.onclick = e => {
                        e.stopPropagation();
                        // 将 input 内容写回 reason-text，然后恢复显示
                        const inp = card.querySelector('.reason-input');
                        const rt = card.querySelector('.reason-text');
                        const decoIcon = card.querySelector('.deco-icon');
                        if (inp && rt) {
                            if (inp.value.trim()) rt.textContent = inp.value.trim();
                            inp.style.display = 'none';
                            rt.style.display = '';
                        }
                        if (decoIcon) decoIcon.style.display = 'none';
                        setCardState(card, 'accepted');
                        showFloatToast('✓ 编辑已保存并接受');
                        focusNextPending(card);
                    };
                } else {
                    b.onclick = e => {
                        e.stopPropagation();
                        setCardState(card, 'accepted');
                        showFloatToast('✓ 已接受');
                        focusNextPending(card);
                    };
                }
            });
            card.querySelectorAll('.action-btn.edit').forEach(b => {
                b.onclick = e => {
                    e.stopPropagation();
                    setCardState(card, 'editing');
                    showFloatToast('✎ 进入编辑模式，修改后点保存');
                };
            });
            card.querySelectorAll('.action-btn.cancel').forEach(b => {
                b.onclick = e => {
                    e.stopPropagation();
                    // 取消：恢复 reason-text 显示，隐藏 input 和装饰图标
                    const inp = card.querySelector('.reason-input');
                    const rt = card.querySelector('.reason-text');
                    const origEi = card.querySelector('.reason-row .edit-icon');
                    const decoIcon = card.querySelector('.deco-icon');
                    if (inp) inp.style.display = 'none';
                    if (rt) rt.style.display = '';
                    if (origEi) origEi.style.display = '';
                    if (decoIcon) decoIcon.style.display = 'none';
                    setCardState(card, 'pending');
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
            // 编辑图标 ✎ 点击 = 编辑按钮
            card.querySelectorAll('.edit-icon').forEach(ic => {
                ic.onclick = e => {
                    e.stopPropagation();
                    if (card.classList.contains('confirmed') || card.classList.contains('rejected')) {
                        setCardState(card, 'pending');
                    }
                    setCardState(card, 'editing');
                };
            });
        }
        // 初始：把现有静态的 ✎ 编辑按钮加上 .edit class（HTML 里没写）
        document.querySelectorAll('.annot-actions').forEach(a => {
            a.querySelectorAll('button.action-btn').forEach(b => {
                const txt = b.textContent.trim();
                if (txt.includes('编辑')) b.classList.add('edit');
            });
        });
        // 绑定卡片操作事件（必须在加完 .edit class 之后调用）
        document.querySelectorAll('.annot-card').forEach(c => bindCardActions(c));
        // 初始已接受/已剔除卡片应用样式
        document.querySelectorAll('.annot-card.confirmed').forEach(c => setCardState(c, 'accepted'));
        document.querySelectorAll('.annot-card.rejected').forEach(c => setCardState(c, 'rejected'));
