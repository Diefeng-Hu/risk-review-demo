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

        // ============ Step 5：全键盘操作 ============
