# IP Track 烟花访问追踪

这是一个基于 Vue 3 + Cloudflare Worker + D1 的访问追踪项目。

当前版本已经收敛为一套固定规则，便于记忆和维护。

## 固定路由规则

1. 访问页
- /t/访问码
- 示例: /t/alice

2. 查询页
- /_query/访问码
- 或 /_query?id=访问码
- 示例: /_query/alice

3. 配置页
- /_config
- 用于生成访问码和分享链接

## 访问码规则

访问码由以下两段组成:
- 6 到 7 位 36 进制秒级时间戳
- 2 位随机字符 (小写字母和数字)

随机尾部组合数量:
- 36^2 = 1296

## 数据记录规则

1. 仅在页面打开时记录一次 page_view。
2. 仅识别 /t/访问码 为有效 visitor_id 来源。
3. anonymous 不会被记录到数据库。
4. 查询页和配置页默认不触发埋点。

## 核心文件

- cloudflare/worker.js: Worker 路由、静态资源回退、API、入库逻辑
- cloudflare/schema.sql: D1 表结构
- src/App.vue: 前端页面入口和路由页面渲染
- src/utils/tracking.js: 前端埋点上报
- src/main.js: 应用启动与埋点启用控制
- wrangler.toml: Worker、ASSETS、D1 绑定配置

## 本地开发

安装依赖:
    npm install

开发模式:
    npm run serve

生产构建:
    npm run build

## Cloudflare 部署

1. 登录 Cloudflare:
    wrangler login

2. 构建前端:
    npm run build

3. 初始化或更新 D1 结构:
    wrangler d1 execute who_clicked_clock_db --remote --file=cloudflare/schema.sql

4. 部署 Worker:
    wrangler deploy

## 线上快速验证

1. 打开配置页:
- https://你的域名/_config

2. 生成访问码后，访问分享页:
- https://你的域名/t/alice

3. 打开查询页:
- https://你的域名/_query/alice

4. 检查 Worker 版本:
- https://你的域名/api/version

## 常见问题

1. 为什么以前会出现 307 跳转到 / ?
- 历史实现里用 /index.html 做 SPA 回退，资产层会把它规范化为 /，从而出现 307。
- 现版本已经改为统一回退到 /，避免该问题。

2. 如何确认请求命中的是当前 Worker?
- 查看响应头中的 X-Worker-Version。

3. 为什么要禁止 anonymous 入库?
- 防止无效访问污染数据，保证 visitor_id 数据可用。

## 数据库表示例查询

查询最新记录:
    SELECT id, visitor_id, event_type, ip_address, country, city, visited_at, url
    FROM click_events
    ORDER BY id DESC
    LIMIT 50;

按访问码查询:
    SELECT id, visitor_id, event_type, ip_address, country, city, visited_at, url
    FROM click_events
    WHERE visitor_id = 'alice'
    ORDER BY id DESC
    LIMIT 200;

## 说明

当前文档仅描述最新稳定实现。
旧路由和旧查询入口不再作为推荐方案。
