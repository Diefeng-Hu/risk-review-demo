// ============ Demo 数据 ============

// 左侧信息栏数据
const INFO_DATA = {
    customer: '长春市京起经贸有限公司',
    creditCode: '91220100MAED4YAW4K',
    industry: '快速消费品/日化用品',
    product: '芊美轻姿保健贴',
    industryLink: 'app.kwaixiaodian.com/we...',
    accountType: '直播',
    authRelation: '—',
    preBroadcast: '—',
    annotation: {
        title: '备案批注-已生效',
        content: '01 业务线：电商DSP；‖ 允许广告主与店铺主体不一致（有效期 2026-12-31）'
    }
};

// ASR 行数据
const ASR_ROWS = [
    { ts: '00:00', text: '大家好，欢迎来到我的直播间。', tag: '正常' },
    { ts: '00:01', text: '"你 <span class="hl" data-card="card-1">使使劲啊</span>，没有啥不可能的。<span class="hl" data-card="card-1">三十分钟都做不到</span>的"', tag: '违规', card: 'card-1', violation: true },
    { ts: '00:08', text: '看我手上这款产品，纯天然无添加。', tag: '正常' },
    { ts: '00:11', text: '我们这是 <span class="hl" data-card="card-4">浓缩特效型</span> 的，<span class="hl" data-card="card-4">谁用谁知道</span>。', tag: '违规', card: 'card-4', violation: true },
    { ts: '00:18', text: '下面给大家简单介绍一下使用方法。', tag: '正常' },
    { ts: '00:22', text: '放心拍，包邮到家。', tag: '正常' },
    { ts: '00:26', text: '现在下单 <span class="hl" data-card="card-7">免费送</span>，<span class="hl" data-card="card-7">绝对最低价</span>，错过就没有了。', tag: '违规', card: 'card-7', violation: true },
    { ts: '00:32', text: '感谢大家的支持，我们下次直播再见。', tag: '正常' },
];

// OCR 行数据
const OCR_ROWS = [
    { ts: '00:02', text: '主播头像 / 直播间标题', tag: '正常' },
    { ts: '00:05', text: '画面字幕："最低价直降，错过等一年"', tag: '违规', card: 'card-2', violation: true },
    { ts: '00:12', text: '商品包装文字：浓缩配方', tag: '正常' },
    { ts: '00:20', text: '弹幕水印："官方授权 全网最低"', tag: '违规', card: 'card-5', violation: true },
    { ts: '00:28', text: '右下角 logo', tag: '正常' },
];

// 风险卡片数据
const CARD_DATA = [
    {
        id: 'card-1', idx: 1, type: 'voice', timeRange: '00:01-00:07',
        sourceLabel: 'ASR：', sourceText: '"你<span class="highlight">使使劲啊</span>，没有啥不可能的。<span class="highlight">三十分钟都做不到</span>的"',
        reason: '涉及效果承诺及绝对化用语；涉及使用过程效果保证', focus: true
    },
    {
        id: 'card-2', idx: 2, type: 'text', timeRange: '00:03-00:08',
        sourceLabel: 'OCR：', sourceText: '画面文字「<span class="highlight">按摩服务~看这里</span>、<span class="highlight">预约体检</span>」',
        reason: '虚假夸大宣传以及承诺性描述'
    },
    {
        id: 'card-3', idx: 3, type: 'scene', timeRange: '00:05-00:12',
        sourceLabel: '画面：', sourceText: '抽帧 #2 - 检测到<span class="highlight">蘑菇/植物特写</span>，疑似暗示性元素',
        reason: '涉及产品安全保证'
    },
    {
        id: 'card-4', idx: 4, type: 'voice', timeRange: '00:11-00:16',
        sourceLabel: 'ASR：', sourceText: '"我们这是<span class="highlight">浓缩特效型</span>的，<span class="highlight">谁用谁知道</span>"',
        reason: '虚假夸大宣传以及承诺性描述', confirmed: true
    },
    {
        id: 'card-5', idx: 5, type: 'text', timeRange: '00:22-00:26',
        sourceLabel: 'OCR：', sourceText: '画面文字「<span class="highlight">免费送</span>、<span class="highlight">最后一天</span>」',
        reason: '涉及效果承诺及绝对化用语；涉及数据虚假判断'
    },
    {
        id: 'card-6', idx: 6, type: 'scene', timeRange: '00:24-00:30',
        sourceLabel: '画面：', sourceText: '抽帧 #5 - 检测到<span class="highlight">服装暴露</span>，疑似软色情',
        reason: '涉及直接或间接高回报承诺'
    },
    {
        id: 'card-7', idx: 7, type: 'voice', timeRange: '00:26-00:32',
        sourceLabel: 'ASR：', sourceText: '"现在下单<span class="highlight">免费送</span>，<span class="highlight">绝对最低价</span>"',
        reason: '涉及效果承诺及绝对化用语'
    },
];

const RISK_TYPES = ['语音文字', '画面文字', '画面本身', '视频异常'];
const RISK_TYPE_MAP = { voice: '语音文字', text: '画面文字', scene: '画面本身', abnormal: '视频异常' };
const COMBINE_TAGS = ['结合画面本身', '结合语音文字', '结合画面文字'];

// 违规理由预设选项（多选）
const REASON_PRESETS = [
    '真人担保样式',
    '产品无效退款',
    '虚假夸大宣传以及承诺性描述',
    '承诺使用商品或接受服务后的效果',
    '涉及效果承诺及绝对化用语',
    '涉及直接或间接高回报承诺',
    '推广书籍产品涉及保证性描述',
    '涉及数据虚假判断',
    '涉及使用过程效果保证',
    '涉及产品安全保证',
];
