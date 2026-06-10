<template>
  <FireworksScene v-if="pageType === 'fireworks'" />

  <div v-else class="tool-page">
    <div class="tool-card">
      <h1>{{ pageTitle }}</h1>

      <template v-if="pageType === 'query'">
        <div class="form-row">
          <input
            v-model.trim="queryVisitorId"
            placeholder="输入访问码（visitor_id），例如 kf2a91q8"
          />
          <button @click="loadQueryRecords">查询</button>
        </div>

        <p class="hint">规则：`/_query/访问码`</p>

        <p v-if="queryError" class="error">{{ queryError }}</p>

        <div v-if="queryResult" class="meta">
          <strong>访问码：</strong>{{ queryResult.visitorId }}
          <span class="meta-gap"></span>
          <strong>记录数：</strong>{{ displayRecords.length }}
        </div>

        <div class="table-wrap" v-if="queryResult">
          <table>
            <thead>
              <tr>
                <th v-for="column in queryColumns" :key="column.key">{{ column.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!displayRecords.length">
                <td :colspan="queryColumns.length">暂无数据</td>
              </tr>
              <tr v-for="(row, index) in displayRecords" :key="index">
                <td
                  v-for="column in queryColumns"
                  :key="column.key"
                  :data-label="column.label"
                  :class="{ 'url-cell': column.key === 'url', 'ua-cell': column.key === 'deviceInfo' }"
                >
                  <template v-if="(column.key === 'clientIpv4' || column.key === 'clientIpv6') && row[column.key] && row[column.key] !== '-'">
                    <span class="ip-cell">
                      <span class="ip-text">{{ row[column.key] }}</span>
                      <button class="ip-action-btn copy-icon-btn" @click="copyText(row[column.key])" title="复制IP">📋</button>
                      <a
                        class="ip-action-btn query-link"
                        :href="`https://ipinfo.io/${row[column.key]}`"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="查看IP详情"
                      >🔍</a>
                    </span>
                  </template>
                  <template v-else>
                    {{ row[column.key] || '-' }}
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="copySuccessText" class="copy-success">{{ copySuccessText }}</p>
      </template>

      <template v-if="pageType === 'config'">
        <div class="form-row">
          <button @click="createAccessCode">生成访问码</button>
        </div>

        <p v-if="configError" class="error">{{ configError }}</p>

        <div v-if="createdConfig" class="result-box">
          <p><strong>visitor_id:</strong> {{ createdConfig.visitorId }}</p>
          <p><strong>访问码：</strong> {{ createdConfig.code }}</p>
          <p class="result-link-row">
            <strong>访问烟花页：</strong>
            <a :href="createdConfig.visitUrl">{{ createdConfig.visitUrl }}</a>
            <button class="copy-btn" @click="copyText(createdConfig.visitUrl)">复制</button>
          </p>
          <p class="result-link-row">
            <strong>查询链接：</strong>
            <a :href="createdConfig.accessUrl">{{ createdConfig.accessUrl }}</a>
            <button class="copy-btn" @click="copyText(createdConfig.accessUrl)">复制</button>
          </p>
          <p v-if="copySuccessText" class="copy-success">{{ copySuccessText }}</p>
        </div>

        <p class="hint">访问码规则：6-7 位 base36 秒级时间戳 + 2 位随机字符。</p>
      </template>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import FireworksScene from './components/FireworksScene.vue'

const queryColumns = [
  { key: 'eventType', label: '事件类型' },
  { key: 'clientIpv4', label: 'IPv4 地址' },
  { key: 'clientIpv6', label: 'IPv6 地址' },
  { key: 'clientCity', label: '城市（IPv4）' },
  { key: 'country', label: '国家/地区' },
  { key: 'visitedAt', label: '访问时间' },
  { key: 'deviceInfo', label: '设备/浏览器' },
  { key: 'url', label: '访问链接' }
]

const cityZhMap = {
  Nanjing: '南京',
  'Santa Clara': '圣克拉拉'
}

const regionNameZh = typeof Intl.DisplayNames === 'function'
  ? new Intl.DisplayNames(['zh-Hans', 'zh-CN'], { type: 'region' })
  : null

function toBase36(value) {
  return Math.max(0, Number(value) || 0).toString(36)
}

function randomBase36(length) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
  let result = ''
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * 36)]
  }
  return result
}

function generateAccessCode() {
  const tsPart = toBase36(Math.floor(Date.now() / 1000))
  const randomPart = randomBase36(2)
  return `${tsPart}${randomPart}`
}

function parsePageType(pathname) {
  const first = (pathname.split('/').filter(Boolean)[0] || '').trim().toLowerCase()
  if (first === '_query') return 'query'
  if (first === '_config') return 'config'
  return 'fireworks'
}

function parseQueryInit() {
  const url = new URL(window.location.href)
  const parts = url.pathname.split('/').filter(Boolean)
  return {
    visitorId: (url.searchParams.get('id') || parts[1] || '').trim()
  }
}

function getCountryZh(value) {
  const code = String(value || '').trim().toUpperCase()
  if (!code) return '-'
  if (!regionNameZh || code.length !== 2) return code
  return regionNameZh.of(code) || code
}

function getCityZh(value) {
  const city = String(value || '').trim()
  if (!city) return '-'
  return cityZhMap[city] || city
}

function parseUserAgent(ua) {
  const text = String(ua || '')
  if (!text) {
    return '未知设备'
  }

  let browser = '其他浏览器'
  if (/Edg\//i.test(text)) browser = 'Edge'
  else if (/OPR\//i.test(text)) browser = 'Opera'
  else if (/Firefox\//i.test(text)) browser = 'Firefox'
  else if (/Chrome\//i.test(text)) browser = 'Chrome'
  else if (/Safari\//i.test(text) && !/Chrome\//i.test(text)) browser = 'Safari'
  else if (/MSIE|Trident\//i.test(text)) browser = 'IE'

  let os = '未知系统'
  if (/Android/i.test(text)) os = 'Android'
  else if (/iPhone|iPad|iPod/i.test(text)) os = 'iOS'
  else if (/Windows/i.test(text)) os = 'Windows'
  else if (/Mac OS X|Macintosh/i.test(text)) os = 'macOS'
  else if (/Linux/i.test(text)) os = 'Linux'

  let device = '桌面'
  if (/iPad|Tablet|PlayBook|Silk/i.test(text)) device = '平板'
  else if (/Mobile|Android|iPhone|iPod/i.test(text)) device = '手机'

  return `${device} / ${os} · ${browser}`
}

async function writeClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }

  const input = document.createElement('textarea')
  input.value = text
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  input.style.pointerEvents = 'none'
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
}

export default {
  components: { FireworksScene },
  setup() {
    const pageType = ref(parsePageType(window.location.pathname))
    const pageTitle = computed(() => (pageType.value === 'query' ? '访问信息查询' : '访问码配置'))

    const init = parseQueryInit()
    const queryVisitorId = ref(init.visitorId)
    const queryResult = ref(null)
    const queryError = ref('')

    const createdConfig = ref(null)
    const configError = ref('')
    const copySuccessText = ref('')
    let copyTimer = 0

    const displayRecords = computed(() => {
      const rows = queryResult.value?.records || []
      return rows.map((row) => {
        const ipv6 = row.client_ipv6 || ''
        return {
          eventType: row.event_type || '-',
          clientIpv4: row.client_ipv4 || '-',
          clientIpv6: ipv6 ? ipv6.slice(0, 20) + (ipv6.length > 20 ? '...' : '') : '-',
          clientCity: row.client_city || '-',
          country: getCountryZh(row.country),
          visitedAt: row.visited_at || '-',
          deviceInfo: parseUserAgent(row.device_user_agent),
          url: row.url || '-'
        }
      })
    })

    const loadQueryRecords = async () => {
      queryError.value = ''
      queryResult.value = null

      if (!queryVisitorId.value) {
        queryError.value = '请先输入访问码（visitor_id）。'
        return
      }

      const params = new URLSearchParams()
      params.set('id', queryVisitorId.value)

      try {
        const res = await fetch(`/api/query-records?${params.toString()}`)
        const data = await res.json()
        if (!res.ok || !data.ok) {
          queryError.value = data.error || '查询失败'
          return
        }
        queryResult.value = data
      } catch (error) {
        queryError.value = '网络异常，请稍后重试。'
      }
    }

    const createAccessCode = async () => {
      configError.value = ''
      createdConfig.value = null
      copySuccessText.value = ''

      const code = generateAccessCode()
      const base = window.location.origin
      createdConfig.value = {
        ok: true,
        code,
        visitorId: code,
        visitUrl: `${base}/t/${encodeURIComponent(code)}`,
        accessUrl: `${base}/_query/${encodeURIComponent(code)}`
      }
    }

    const copyText = async (text) => {
      try {
        await writeClipboard(text)
        // 检测是否为IP地址
        const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(text)
        copySuccessText.value = isIp ? 'IP已复制' : '链接已复制'
      } catch (error) {
        copySuccessText.value = '复制失败，请手动复制'
      }

      if (copyTimer) {
        clearTimeout(copyTimer)
      }
      copyTimer = setTimeout(() => {
        copySuccessText.value = ''
      }, 1800)
    }

    onMounted(() => {
      if (pageType.value === 'query' && queryVisitorId.value) {
        loadQueryRecords()
      }
    })

    return {
      pageType,
      pageTitle,
      queryVisitorId,
      queryResult,
      queryError,
      createdConfig,
      configError,
      copySuccessText,
      queryColumns,
      displayRecords,
      loadQueryRecords,
      createAccessCode,
      copyText
    }
  }
}
</script>

<style lang="less">
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
}

.tool-page {
  min-height: 100vh;
  background: linear-gradient(130deg, #11161f 0%, #1a2333 38%, #22324a 100%);
  padding: 20px;
}

.tool-card {
  max-width: 1080px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 34px rgba(0, 0, 0, 0.22);
}

.tool-card h1 {
  margin-top: 0;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.form-row input {
  flex: 1;
  min-width: 220px;
  border: 1px solid #ced6e3;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
}

.form-row button {
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  background: #2b77ff;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}

.hint {
  color: #4e5d7a;
  font-size: 13px;
}

.error {
  color: #bf2132;
  font-size: 14px;
}

.meta {
  font-size: 14px;
  margin: 12px 0;
  word-break: break-all;
}

.meta-gap {
  display: inline-block;
  width: 16px;
}

.table-wrap {
  overflow: auto;
  border: 1px solid #e5eaf2;
  border-radius: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th,
td {
  border-bottom: 1px solid #eaeef5;
  text-align: left;
  vertical-align: top;
  padding: 10px;
}

th {
  background: #f7faff;
}

.url-cell,
.ua-cell {
  min-width: 220px;
  word-break: break-all;
}

.result-box {
  background: #f7faff;
  border: 1px solid #dbe6ff;
  border-radius: 10px;
  padding: 12px;
  margin: 10px 0;
}

.result-box p {
  margin: 6px 0;
}

.result-link-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.result-link-row a {
  word-break: break-all;
  color: #134dbd;
}

.copy-btn {
  border: none;
  border-radius: 8px;
  padding: 6px 10px;
  background: #0f6ddf;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
}

.ip-cell {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.ip-text {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}

.ip-action-btn {
  border: none;
  background: none;
  cursor: pointer;
  padding: 2px 4px;
  font-size: 12px;
  opacity: 0.6;
  transition: opacity 0.2s;
  text-decoration: none;
}

.ip-action-btn:hover {
  opacity: 1;
}

.copy-icon-btn {
  border-radius: 4px;
}

.query-link {
  border-radius: 4px;
  color: #2b77ff;
}

.copy-success {
  color: #0f6a32;
  font-size: 13px;
  margin-top: 10px;
}

@media (max-width: 860px) {
  .tool-page {
    padding: 14px;
  }

  .tool-card {
    padding: 16px;
    border-radius: 14px;
  }
}

@media (max-width: 680px) {
  .tool-page {
    padding: 12px;
  }

  .tool-card {
    padding: 14px;
  }

  .form-row {
    flex-direction: column;
  }

  .form-row input,
  .form-row button {
    width: 100%;
    min-width: 0;
  }

  .meta-gap {
    display: none;
  }
}

@media (max-width: 760px) {
  .table-wrap {
    border: none;
    overflow: visible;
  }

  table,
  thead,
  tbody,
  tr,
  th,
  td {
    display: block;
    width: 100%;
  }

  thead {
    display: none;
  }

  tbody tr {
    background: #f7faff;
    border: 1px solid #dbe6ff;
    border-radius: 10px;
    margin-bottom: 10px;
    padding: 8px 10px;
  }

  tbody tr td {
    border-bottom: 1px dashed #d5dfef;
    padding: 8px 0;
    position: relative;
    padding-left: 44%;
    min-height: 30px;
    word-break: break-word;
  }

  tbody tr td:last-child {
    border-bottom: none;
  }

  tbody tr td::before {
    content: attr(data-label);
    position: absolute;
    left: 0;
    top: 8px;
    width: 42%;
    font-weight: 600;
    color: #43506a;
    text-transform: none;
  }

  tbody tr td[colspan] {
    padding-left: 0;
    text-align: center;
  }

  tbody tr td[colspan]::before {
    display: none;
  }

  .url-cell,
  .ua-cell {
    min-width: 0;
  }

  .ip-cell {
    flex-wrap: wrap;
  }

  .result-link-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .copy-btn {
    width: 100%;
    padding: 8px 10px;
    font-size: 13px;
  }
}
</style>
