// ============ 新增风险点（人工补漏） ============
        let addedRiskCount = 0;
        function addNewRiskCard(presetType, prefillText, prefillTime) {
            addedRiskCount++;
            const types = {
                text:  { label:'画面文字', cls:'text',  border:'#1890ff' },
                voice: { label:'语音文字', cls:'voice', border:'#1890ff' },
                scene: { label:'画面本身', cls:'scene', border:'#1890ff' }
            };
            const t = types[presetType] || types.voice;
            const newId = 'card-new-' + addedRiskCount;
            const totalIdx = document.querySelectorAll('.annot-card').length + 1;
            const timeVal = prefillTime ? `▶ ${prefillTime}` : `▶ ${videoCurrentTime}-${videoCurrentTime}`;
            const textVal = prefillText || '点击此处输入违规原文（如 ASR 片段、画面文字）';

            const card = document.createElement('div');
            card.className = `annot-card ${t.cls}`;
            card.dataset.id = newId;
            card.dataset.type = t.cls;
            card.dataset.manual = '1';
            const typeOptions = Object.entries(RISK_TYPE_MAP).map(([val, label]) =>
                `<option value="${val}"${val === t.cls ? ' selected' : ''}>${label}</option>`
            ).join('');
            const reasonCheckHtml = REASON_PRESETS.map(r =>
                `<label class="reason-check-item"><input type="checkbox" class="reason-check" value="${r}"><span>${r}</span></label>`
            ).join('');
            card.innerHTML = `
                <div class="card-head">
                    <span class="card-id">${totalIdx}</span>
                    <span class="card-time" contenteditable="true" title="点击编辑时间">${timeVal}</span>
                    <select class="card-type-select ${t.cls}" data-id="${newId}">${typeOptions}</select>
                    <span style="font-size:10px;padding:1px 6px;border-radius:3px;background:#666;color:#fff;">人工</span>
                    <span class="spacer"></span>
                    <span class="action-btn reject" style="padding:2px 8px;margin-left:6px;" title="删除此条">🗑</span>
                </div>
                <div class="card-body">
                    <div class="card-thumb"><img src="https://picsum.photos/seed/manual${addedRiskCount}/64/64" alt=""></div>
                    <div class="card-content">
                        <div class="original-text">
                            <span class="label">原文：</span><span contenteditable="true" style="outline:none;border-bottom:1px dashed #1890ff;padding:0 4px;">${textVal}</span>
                        </div>
                        <div class="reason-multi collapsed" data-id="${newId}">
                            <div class="reason-multi-head" onclick="this.closest('.reason-multi').classList.toggle('collapsed')">违规理由 <span class="reason-count">0</span></div>
                            <div class="reason-multi-body">
                                ${reasonCheckHtml}
                                <label class="reason-check-item other"><input type="checkbox" class="reason-check other-check" value="__other__"><span>其他</span></label>
                                <input type="text" class="reason-other-input" placeholder="补充其他违规理由…" style="display:none">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="annot-actions">
                    <button class="action-btn accept">✓ 保存</button>
                    <button class="action-btn reject">✗ 取消</button>
                </div>
            `;

            document.getElementById('cards-flow').appendChild(card);

            // 绑定交互
            card.querySelector('.action-btn.accept')?.addEventListener('click', e => {
                e.stopPropagation();
                setCardState(card, 'accepted');
                showFloatToast('✓ 已新增风险点 ' + totalIdx);
            });
            card.querySelectorAll('.action-btn.reject').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    card.remove();
                    addedRiskCount--;
                    showProgress();
                    showFloatToast('🗑 已删除');
                });
            });
            card.querySelector('.card-type-select')?.addEventListener('change', e => {
                const v = e.target.value;
                card.classList.remove('text', 'voice', 'scene', 'abnormal');
                card.classList.add(v);
                e.target.className = `card-type-select ${v}`;
            });
            // 新增卡片的多选理由 checkbox 联动
            card.querySelectorAll('.reason-check').forEach(cb => {
                cb.addEventListener('change', () => {
                    const multi = cb.closest('.reason-multi');
                    const otherInput = multi?.querySelector('.reason-other-input');
                    if (cb.classList.contains('other-check') && otherInput) {
                        otherInput.style.display = cb.checked ? '' : 'none';
                        if (cb.checked) setTimeout(() => otherInput.focus(), 50);
                    }
                    const count = multi?.querySelectorAll('.reason-check:checked').length || 0;
                    const badge = multi?.querySelector('.reason-count');
                    if (badge) badge.textContent = count;
                });
            });
            card.addEventListener('click', () => {
                document.querySelectorAll('.annot-card').forEach(c => c.classList.remove('focus-current'));
                card.classList.add('focus-current');
            });

            // 滚动到新卡片，聚焦原文输入
            setTimeout(() => {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                document.querySelectorAll('.annot-card').forEach(c => c.classList.remove('focus-current'));
                card.classList.add('focus-current');
                const editable = card.querySelector('[contenteditable="true"]');
                if (editable) {
                    editable.focus();
                    // 如果是预填文本（从 ASR/OCR 行来的），选中全文方便修改
                    if (prefillText) document.execCommand('selectAll', false, null);
                }
            }, 100);

            showProgress();
            renderVideoSegments?.();
            updateBadgeCounts?.();
            return card;
        }

        // 「+ 新增风险点」按钮：弹出类型选择
        document.getElementById('add-risk-btn')?.addEventListener('click', e => {
            e.stopPropagation();
            const prefillText = e.currentTarget.dataset.prefillText || '';
            const prefillTime = e.currentTarget.dataset.prefillTime || videoCurrentTime;
            // 弹出小菜单
            let menu = document.getElementById('add-risk-menu');
            if (menu) { menu.remove(); return; }
            menu = document.createElement('div');
            menu.id = 'add-risk-menu';
            menu.style.cssText = `
                position: absolute; background: #fff; border: 1px solid #d9d9d9;
                border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                z-index: 100; padding: 4px; min-width: 140px;
            `;
            const rect = e.currentTarget.getBoundingClientRect();
            menu.style.top = (rect.bottom + 4) + 'px';
            menu.style.left = rect.left + 'px';
            menu.innerHTML = `
                <div data-t="text" style="padding:6px 10px;cursor:pointer;font-size:12px;border-radius:3px;display:flex;align-items:center;gap:6px;">
                    <span style="width:8px;height:8px;background:#1890ff;border-radius:2px;"></span>画面文字
                </div>
                <div data-t="voice" style="padding:6px 10px;cursor:pointer;font-size:12px;border-radius:3px;display:flex;align-items:center;gap:6px;">
                    <span style="width:8px;height:8px;background:#1890ff;border-radius:2px;"></span>语音文字
                </div>
                <div data-t="scene" style="padding:6px 10px;cursor:pointer;font-size:12px;border-radius:3px;display:flex;align-items:center;gap:6px;">
                    <span style="width:8px;height:8px;background:#1890ff;border-radius:2px;"></span>画面本身
                </div>
                <div data-t="abnormal" style="padding:6px 10px;cursor:pointer;font-size:12px;border-radius:3px;display:flex;align-items:center;gap:6px;">
                    <span style="width:8px;height:8px;background:#faad14;border-radius:2px;"></span>视频异常
                </div>
            `;
            menu.querySelectorAll('div[data-t]').forEach(item => {
                item.addEventListener('mouseenter', () => item.style.background = '#e6f7ff');
                item.addEventListener('mouseleave', () => item.style.background = '');
                item.addEventListener('click', () => {
                    const t = item.getAttribute('data-t');
                    menu.remove();
                    addNewRiskCard(t, prefillText, prefillTime);
                });
            });
            document.body.appendChild(menu);
            setTimeout(() => {
                document.addEventListener('click', function close(ev) {
                    if (!menu.contains(ev.target)) {
                        menu.remove();
                        document.removeEventListener('click', close);
                    }
                });
            }, 0);
        });

        // 快捷键 + → 新增风险点（默认语音文字）
        document.addEventListener('keydown', e => {
            const tag = (e.target.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
            if (e.target.isContentEditable) return;
            if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                document.getElementById('add-risk-btn')?.click();
            }
        });

        // 5) 时间轴片段 → 高亮对应卡片
        document.querySelectorAll('.risk-segment').forEach(seg => {
            seg.addEventListener('click', () => {
                document.querySelectorAll('.risk-segment').forEach(s => s.classList.remove('active'));
                seg.classList.add('active');
                const cardId = seg.getAttribute('data-card');
                const card = document.querySelector(`[data-id="${cardId}"]`);
                if (card) {
                    document.querySelectorAll('.annot-card').forEach(c => c.classList.remove('focus-current'));
                    card.classList.add('focus-current');
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });

        // 6) 进度更新
