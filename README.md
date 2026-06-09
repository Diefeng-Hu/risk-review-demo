# 风险定位标注 · AI 预标注校对 Demo

快手内容治理 CAP — 风险定位标注交互原型。

## 快速启动

无需构建工具，直接用浏览器打开：

```bash
# 方式1：直接打开
open index.html

# 方式2：本地服务器（推荐，避免跨域问题）
npx serve .
# 或
python3 -m http.server 8080
```

## 目录结构

```
├── index.html          # 页面骨架（148行）
├── favicon.svg         # 标签页图标
├── css/
│   ├── base.css        # 全局重置、滚动条
│   ├── top-bar.css     # 顶部操作栏
│   ├── layout.css      # 主布局网格
│   ├── video.css       # 视频区 + 播放控件
│   ├── timeline.css    # 时间轴 + 进度条
│   ├── cards-flow.css  # 卡片流容器
│   ├── card.css        # 风险卡片样式
│   ├── asr-ocr.css     # ASR/OCR 侧栏行样式
│   └── bottom-bar.css  # 底部状态栏
└── js/
    ├── data.js             # Demo 数据（卡片、ASR/OCR、信息栏）
    ├── render.js           # 动态渲染（卡片、侧栏、信息栏）
    ├── state.js            # 状态管理（卡片状态切换）
    ├── card-actions.js     # 卡片操作（接受/剔除/编辑/保存）
    ├── keyboard.js         # 键盘导航（Step 5）
    ├── video.js            # 视频模拟播放 + 进度条跳转
    ├── filter.js           # 筛选 + 质量自检 + 一键接受
    ├── keyboard-events.js  # 全局键盘事件绑定
    ├── shortcut-modal.js   # 快捷键帮助弹窗
    ├── card-add.js         # 新增风险点
    ├── menu.js             # 右键菜单 + showProgress
    ├── merge.js            # 多选合并
    └── ui-utils.js         # Toast + 底栏显隐
```

## 快捷键

| 按键 | 功能 |
|------|------|
| `A` | 接受当前卡片 |
| `D` | 剔除当前卡片 |
| `E` | 编辑违规理由 |
| `↑/↓` | 切换卡片焦点 |
| `Enter` | 保存编辑 |
| `Esc` | 取消编辑 |
| `?` | 显示快捷键帮助 |
| `B` | 隐藏/显示底栏 |
| `C` | 提交 |

## 部署

已部署至 GitHub Pages：
https://diefeng-hu.github.io/risk-review-demo/
