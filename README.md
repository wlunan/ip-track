#  Focus Timer - 翻页时钟 & 番茄专注计时器

[![Vue 3](https://img.shields.io/badge/Vue-3.0-brightgreen.svg)](https://vuejs.org/)
[![ECharts](https://img.shields.io/badge/ECharts-5.5.0-blue.svg)](https://echarts.apache.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

基于 Vue 3 的优雅翻页时钟与番茄工作法计时器，支持多语言、响应式设计、数据统计和跨设备使用。

*A beautiful flip clock with integrated Pomodoro timer built with Vue 3, supporting multiple languages, responsive design, and data visualization.*

---

##  主要特性

###  翻页时钟 (Flip Clock)
-  **Fliqlo 风格翻页动画** - 流畅的翻页效果
-  **多时制支持** - 12/24 小时制自由切换
-  **灵活配置** - 可调节缩放(默认55)、亮度、背景颜色
-  **时钟音效** - 支持开启/关闭滴答声音(clock-ticking.mp3)
-  **日期展示** - 显示完整日期和星期几
-  **秒数显示** - 支持显示/隐藏秒数

###  番茄专注计时 (Pomodoro Timer)
-  **默认配置** - 专注25分钟 / 短休息5分钟 / 长休息15分钟
-  **自定义设置** - 灵活调整各类时长
-  **完整控制** - 开始/暂停/继续/停止功能
-  **多重通知** - 完成时播放声音(success.mp3)并显示桌面通知
-  **自动记录** - 完成的番茄自动保存到本地存储
-  **数据统计** - ECharts 可视化展示
  -  近7天趋势图表
  -  今日完成数、累计完成数
  -  统计数据的导出/导入功能

###  国际化 (i18n)
-  **简体中文** - 完整的中文支持，星期显示为 周一-周日
-  **English** - Full English support with Mon-Sun weekday format
-  **语言偏好保存** - 自动保存用户选择的语言

###  响应式设计 (Responsive)
-  **桌面优化** - PC 端完美显示和交互
-  **移动适配** - 平板、手机自动适配布局
-  **触控友好** - 优化触屏交互体验
-  **全屏支持** - 一键进入/退出全屏模式

###  其他特性
-  **本地持久化** - 所有设置和数据保存到 localStorage
  - 时钟设置(缩放、亮度、背景、时制)
  - 番茄设置(各时长)
  - 番茄记录(用于统计)
  - 音效开关状态
-  **深色主题** - 优化的深色主题 UI
-  **高效性能** - 轻量级依赖，快速加载

---

##  快速开始

### 环境要求
- Node.js 14+
- npm 或 yarn

### 安装依赖
\`\`\`bash
npm install
\`\`\`

### 开发模式运行
\`\`\`bash
npm run serve
\`\`\`
访问 http://localhost:8080/

### 生产构建
\`\`\`bash
npm run build
\`\`\`

---

##  项目结构

\`\`\`
focus-timer/
 src/
    components/              # Vue 组件
       clock.vue           # 翻页时钟组件
       halfClock.vue       # 时钟半部分(内部使用)
       slider.vue          # 滑块组件
       PomodoroStats.vue   # 番茄统计面板
    composables/            # Vue 3 Composition API
       useI18n.js          # 国际化逻辑
       usePomodoro.js      # 番茄计时逻辑
    locales/                # 国际化文本
       zh-CN.js            # 简体中文
       en-US.js            # 英文
    config/                 # 配置文件
       i18n.js             # i18n 配置
    utils/                  # 工具函数
       getampm.js          # 时间格式工具
    assets/                 # 静态资源
       pic.js              # 数字图片资源
       pic.less            # 样式
       clock-ticking.mp3   # 时钟音效
       success.mp3         # 完成音效
    App.vue                 # 根组件
    main.js                 # 入口文件
 public/                     # 静态文件
 package.json               # 项目配置
 babel.config.js            # Babel 配置
 vue.config.js              # Vue 配置
 README.md                  # 本文件
\`\`\`

---

##  使用指南

### 时钟操作
1. **缩放** - 拖动缩放滑块调整时钟大小(范围 20-100)
   - 点击"默认"按钮快速重置为 55
2. **亮度** - 拖动亮度滑块调整显示亮度
3. **背景** - 从下拉菜单选择背景颜色
4. **时制** - 选择 12 或 24 小时格式
5. **秒数** - 勾选显示或隐藏秒数
6. **语言** - 点击语言按钮切换中文/英文
7. **音效** - 点击右上角扬声器图标开启/关闭时钟滴答声
8. **全屏** - 点击右上角全屏按钮进入全屏模式

### 番茄计时
1. **开始计时** - 点击"开始"按钮启动番茄计时(默认25分钟专注)
2. **暂停/继续** - 点击"暂停"按钮可暂停，再点击继续
3. **停止** - 点击"停止"按钮中止当前番茄
4. **完成提示**
   -  播放成功音效
   -  显示桌面通知
   -  自动记录到统计数据
5. **查看统计** - 点击"查看统计"查看近7天的数据趋势
6. **番茄设置** - 点击右上角设置按钮()调整专注/休息时长

### 番茄设置详解
- **专注时间** - 专注阶段的时长(默认25分钟)
- **短休息时间** - 短休息阶段的时长(默认5分钟)
- **长休息时间** - 长休息阶段的时长(默认15分钟)
- **多少个后休息** - 几个番茄后进行长休息(默认4个)

---

##  数据存储

所有数据保存到浏览器的 \`localStorage\`：

| Key | 说明 | 格式 |
|-----|------|------|
| \`clock_settings\` | 时钟配置 | JSON |
| \`pomodoro_records\` | 番茄完成记录 | JSON 数组 |
| \`pomodoro_settings\` | 番茄配置 | JSON |
| \`clock_sound_enabled\` | 音效开关 | Boolean |

---

##  技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.x | 前端框架 |
| ECharts | 5.5.0 | 数据可视化 |
| Less | - | 样式预处理 |
| Babel | - | JavaScript 编译 |

---

##  浏览器兼容性

-  Chrome 90+
-  Firefox 88+
-  Safari 14+
-  Edge 90+

*需要支持 ES6、localStorage、Web Audio API 和 Notification API*

---

##  许可证

MIT License - 详见 LICENSE 文件

---

##  贡献

欢迎提交 Issue 和 Pull Request！

---

##  功能清单

- [x] 翻页时钟核心功能
- [x] 番茄计时功能
- [x] 数据统计与可视化
- [x] 本地数据持久化
- [x] 国际化支持
- [x] 响应式设计
- [x] 桌面通知
- [x] 音效支持
- [x] 全屏模式
- [x] 数据导出/导入

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-27

---

##  访问识别与点击记录（Cloudflare Worker）

项目已支持通过 URL 路径区分访问人，并将访问事件发送到 Cloudflare Worker。

示例 URL：

- `https://your-clock.pages.dev/alice`
- `https://your-clock.pages.dev/bob_sales`
- `https://your-clock.pages.dev/phishing_test_01`

### 单 Worker 一体部署（推荐）

当前项目默认按单 Worker 一体部署：

- 同一个 Worker 托管页面静态资源（`dist`）
- 同一个 Worker 提供埋点接口（`/api/track`）
- D1 绑定名使用 `DB`
- 静态资源绑定名使用 `ASSETS`
- 前端默认固定上报到同域 `/api/track`
- 仅在页面打开时记录一次（`page_view`）
- 提供前端预览路径：`/_clock_view_9x2k7m?id=alice`

仓库关键文件：

- `cloudflare/worker.js`：页面路由 + 埋点入库
- `cloudflare/schema.sql`：D1 表结构
- `wrangler.toml`：Worker 与 D1、静态资源目录配置

部署步骤（Wrangler）：

1. 安装并登录：

```bash
npm i -g wrangler
wrangler login
```

2. 安装依赖并构建前端：

```bash
npm install
npm run build
```

3. 创建 D1 数据库（首次）：

```bash
wrangler d1 create who_clicked_clock_db
```

4. 在 `wrangler.toml` 填入真实 `database_id`，并确认：

- `main = "cloudflare/worker.js"`
- `[assets] directory = "./dist"`
- `[assets] binding = "ASSETS"`
- `[[d1_databases]] binding = "DB"`

5. 初始化表结构（首次）：

```bash
wrangler d1 execute who_clicked_clock_db --remote --file=./cloudflare/schema.sql
```

6. 部署：

```bash
wrangler deploy
```

7. 打开 Worker 域名访问页面，并使用 `/alice` 或 `/track/alice` 验证。

说明：当前单 Worker 模式不依赖 `VUE_APP_TRACKING_WORKER_URL`，避免旧环境变量把请求指向错误域名。

#### 验证是否生效

1. 打开：`https://your-clock.pages.dev/alice`（或 `/track/alice`）
2. 刷新页面后等待 1-2 秒
3. 在 D1 查询：

```sql
SELECT visitor_id, ip_address, device_user_agent, visited_at, event_type
FROM click_events
ORDER BY id DESC
LIMIT 20;
```

`click_events` 表字段说明：

| 字段名 | 类型 | 说明 |
|---|---|---|
| `id` | INTEGER | 主键，自增 |
| `visitor_id` | TEXT | 访问人标识，来自路径 `/xxx` 或 `/track/xxx` |
| `event_type` | TEXT | 事件类型（当前默认记录 `page_view`） |
| `ip_address` | TEXT | 访问 IP（Worker 从 Cloudflare 请求头提取） |
| `device_user_agent` | TEXT | 设备/浏览器信息（User-Agent） |
| `country` | TEXT | 国家（Cloudflare 提供） |
| `city` | TEXT | 城市（Cloudflare 提供） |
| `visited_at` | TEXT | 访问时间（中国时区，`Asia/Shanghai`） |
| `url` | TEXT | 完整页面 URL |

### 前端防调试策略

项目已在前端启用基础防调试策略：

- 禁用右键菜单
- 阻止常见开发者工具快捷键（如 `F12`、`Ctrl+Shift+I/J/C`、`Ctrl+U`）
- 检测开发者工具窗口开启并触发页面模糊

实现位置：

- `src/utils/antiDebug.js`
- `src/main.js`（应用启动时启用）

说明：前端防调试只能提高成本，无法做到绝对防护。
