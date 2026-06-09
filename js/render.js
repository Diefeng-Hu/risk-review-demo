// ============ 动态渲染 ============

function renderLeftPanel() {
    const d = INFO_DATA;
    document.getElementById('left-panel').innerHTML = `
        <div class="panel-title">基本信息</div>
        <div class="info-row"><span class="info-label">客户名称</span><span class="info-value">${d.customer}</span></div>
        <div class="info-row"><span class="info-label">信用代码</span><span class="info-value">${d.creditCode}</span></div>
        <div class="info-row"><span class="info-label">行业类型</span><span class="info-value">${d.industry}</span></div>
        <div class="info-row"><span class="info-label">产品名称</span><span class="info-value">${d.product}</span></div>
        <div class="info-row"><span class="info-label">行业链接</span><a href="#" class="industry-link">${d.industryLink}</a></div>
        <div class="divider"></div>
        <div class="panel-title">辅助信息</div>
        <div class="info-row"><span class="info-label">账户类型</span><span class="info-value">${d.accountType}</span></div>
        <div class="info-row"><span class="info-label">授权关系</span><span class="info-value">${d.authRelation}</span></div>
        <div class="info-row"><span class="info-label">直播预热</span><span class="info-value">${d.preBroadcast}</span></div>
        <div class="divider"></div>
        <div class="panel-title">备案批注</div>
        <div style="font-size:11px; color:#666; line-height:1.6;">
            <div style="font-weight:500;color:#333;margin-bottom:4px;">${d.annotation.title}</div>
            ${d.annotation.content}
        </div>`;
}

function renderRefSide() {
    const asrRows = ASR_ROWS.map(r => {
        const cls = r.violation ? 'asr-row violation' : 'asr-row';
        const dataCard = r.card ? ` data-card="${r.card}"` : '';
        return `<div class="${cls}"${dataCard}><span class="row-check"></span><span class="ts">${r.ts}</span><span class="text">${r.text}</span><span class="asr-tag">${r.tag}</span></div>`;
    }).join('');

    const ocrRows = OCR_ROWS.map(r => {
        const cls = r.violation ? 'ocr-row violation' : 'ocr-row';
        const dataCard = r.card ? ` data-card="${r.card}"` : '';
        return `<div class="${cls}"${dataCard}><span class="row-check"></span><span class="ts">${r.ts}</span><span class="text">${r.text}</span><span class="ocr-tag">${r.tag}</span></div>`;
    }).join('');

    document.getElementById('ref-side').innerHTML = `
        <div class="ref-side-section" data-pane="asr">
            <div class="ref-side-section-head">
                <span class="sec-title">📝 语音文字</span>
                <span class="badge-num">${ASR_ROWS.filter(r => r.violation).length}</span>
                <span class="sec-spacer"></span>
                <span class="sec-collapse" title="折叠/展开">▾</span>
            </div>
            <div class="ref-side-section-body"><div class="asr-full">${asrRows}</div></div>
        </div>
        <div class="ref-side-divider"></div>
        <div class="ref-side-section" data-pane="ocr">
            <div class="ref-side-section-head">
                <span class="sec-title">🔤 画面文字</span>
                <span class="badge-num">${OCR_ROWS.filter(r => r.violation).length}</span>
                <span class="sec-spacer"></span>
                <span class="sec-collapse" title="折叠/展开">▾</span>
            </div>
            <div class="ref-side-section-body"><div class="ocr-list">${ocrRows}</div></div>
        </div>`;
}

function renderCards() {
    const container = document.getElementById('cards-flow');
    container.innerHTML = CARD_DATA.map(c => renderCard(c)).join('');
}

function renderCard(c) {
    const confirmedCls = c.confirmed ? ' confirmed' : '';
    const focusCls = c.focus ? ' focus-current' : '';
    const typeLabel = RISK_TYPE_MAP[c.type] || c.type;

    // 违规理由多选区（默认折叠，点击展开）
    const selectedReasons = c.reason ? c.reason.split('；').map(s => s.trim()).filter(Boolean) : [];
    const reasonCheckHtml = REASON_PRESETS.map(r => {
        const checked = selectedReasons.includes(r) ? 'checked' : '';
        return `<label class="reason-check-item"><input type="checkbox" class="reason-check" value="${r}" ${checked}><span>${r}</span></label>`;
    }).join('');
    const otherText = selectedReasons.find(r => !REASON_PRESETS.includes(r)) || '';
    const reasonHtml = `<div class="reason-multi collapsed" data-id="${c.id}">
        <div class="reason-multi-head" onclick="this.closest('.reason-multi').classList.toggle('collapsed')">违规理由 <span class="reason-count">${selectedReasons.length}</span></div>
        <div class="reason-multi-body">
            ${reasonCheckHtml}
            <label class="reason-check-item other"><input type="checkbox" class="reason-check other-check" value="__other__" ${otherText ? 'checked' : ''}><span>其他</span></label>
            <input type="text" class="reason-other-input" placeholder="补充其他违规理由…" value="${otherText}" style="${otherText ? '' : 'display:none'}">
        </div>
    </div>`;

    // Actions
    let actionsHtml;
    if (c.confirmed) {
        actionsHtml = `<button class="action-btn edit">✎ 编辑</button><button class="action-btn reject">↺ 撤销</button>`;
    } else {
        actionsHtml = `<button class="action-btn accept">✓ 接受</button><button class="action-btn edit">✎ 编辑</button><button class="action-btn reject">✗ 剔除</button>`;
    }

    const typeOptions = Object.entries(RISK_TYPE_MAP).map(([val, label]) =>
        `<option value="${val}"${val === c.type ? ' selected' : ''}>${label}</option>`
    ).join('');
    const typeSelect = `<select class="card-type-select ${c.type}" data-id="${c.id}">
        ${typeOptions}
    </select>`;

    return `<!-- Card #${c.idx} ${typeLabel} -->
        <div class="annot-card ${c.type}${confirmedCls}${focusCls}" data-id="${c.id}" data-type="${c.type}">
            <div class="card-head">
                <span class="card-id">${c.idx}</span>
                <span class="card-time" title="点击跳转">▶ ${c.timeRange}</span>
                ${typeSelect}
                <span class="spacer"></span>
            </div>
            <div class="card-body">
                <div class="card-thumb"><img src="https://picsum.photos/seed/${c.id}/64/64" alt=""></div>
                <div class="card-content">
                    <div class="original-text"><span class="label">${c.sourceLabel}</span>${c.sourceText}</div>
                    ${reasonHtml}
                </div>
            </div>
            <div class="annot-actions">${actionsHtml}</div>
        </div>`;
}

// 初始化渲染
renderLeftPanel();
renderRefSide();
renderCards();
