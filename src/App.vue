<template>
  <FireworksScene v-if="pageType === 'fireworks'" />

  <div v-else class="tool-page">
    <div class="tool-card">
      <h1>{{ pageTitle }}</h1>

      <template v-if="pageType === 'query'">
        <div class="form-row">
          <input v-model.trim="queryVisitorId" placeholder="输入访问码（即 visitor_id），例如 kf2a91q8" />
          <button @click="loadQueryRecords">查询</button>
        </div>

        <p class="hint">统一规则: /#/query/访问码</p>

        <p v-if="queryError" class="error">{{ queryError }}</p>

        <div v-if="queryResult" class="meta">
          <strong>visitor_id:</strong> {{ queryResult.visitorId }}
          <span class="meta-gap"></span>
          <strong>记录数:</strong> {{ queryResult.records.length }}
        </div>

        <div class="table-wrap" v-if="queryResult">
          <table>
            <thead>
              <tr>
                <th>event_type</th>
                <th>ip_address</th>
                <th>country</th>
                <th>city</th>
                <th>visited_at</th>
                <th>url</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!queryResult.records.length">
                <td colspan="6">暂无数据</td>
              </tr>
              <tr v-for="(row, index) in queryResult.records" :key="index">
                <td>{{ row.event_type }}</td>
                <td>{{ row.ip_address }}</td>
                <td>{{ row.country }}</td>
                <td>{{ row.city }}</td>
                <td>{{ row.visited_at }}</td>
                <td class="url-cell">{{ row.url }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <template v-if="pageType === 'config'">
        <div class="form-row">
          <button @click="createAccessCode">生成访问码</button>
        </div>

        <p v-if="configError" class="error">{{ configError }}</p>

        <div v-if="createdConfig" class="result-box">
          <p><strong>visitor_id:</strong> {{ createdConfig.visitorId }}</p>
          <p><strong>访问码:</strong> {{ createdConfig.code }}</p>
          <p><strong>访问烟花页:</strong> <a :href="createdConfig.visitUrl">{{ createdConfig.visitUrl }}</a></p>
          <p><strong>查询链接:</strong> <a :href="createdConfig.accessUrl">{{ createdConfig.accessUrl }}</a></p>
        </div>

        <p class="hint">访问码规则: 6-7位36进制秒级时间戳 + 2位随机数（小写字母和数字）。</p>
      </template>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import FireworksScene from './components/FireworksScene.vue'

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

function parseHashRoute() {
  const hash = (window.location.hash || '').trim()
  const hashValue = hash.startsWith('#') ? hash.slice(1) : hash
  const [hashPath, hashQuery = ''] = hashValue.split('?')
  const parts = hashPath.split('/').filter(Boolean)
  const first = (parts[0] || '').trim().toLowerCase()
  const second = (parts[1] || '').trim()
  const query = new URLSearchParams(hashQuery)

  return {
    first,
    second,
    queryId: (query.get('id') || '').trim()
  }
}

function parsePageType(pathname) {
  const hashRoute = parseHashRoute()
  if (hashRoute.first === 'query') return 'query'
  if (hashRoute.first === 'config') return 'config'
  return 'fireworks'
}

function parseQueryInit() {
  const hashRoute = parseHashRoute()
  return {
    visitorId: (hashRoute.queryId || hashRoute.second || '').trim()
  }
}

export default {
  components: { FireworksScene },
  setup () {
    const pageType = ref(parsePageType(window.location.pathname))
    const pageTitle = computed(() => (pageType.value === 'query' ? '访问信息查询' : '访问码配置'))

    const init = parseQueryInit()
    const queryVisitorId = ref(init.visitorId)
    const queryResult = ref(null)
    const queryError = ref('')

    const createdConfig = ref(null)
    const configError = ref('')

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

      const code = generateAccessCode()
      const base = window.location.origin
      createdConfig.value = {
        ok: true,
        code,
        visitorId: code,
        visitUrl: `${base}/#/t/${encodeURIComponent(code)}`,
        accessUrl: `${base}/#/query/${encodeURIComponent(code)}`
      }
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
      loadQueryRecords,
      createAccessCode
    }
  }
}
</script>

<style lang="less">
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

.url-cell {
  min-width: 280px;
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

@media (max-width: 680px) {
  .tool-page {
    padding: 12px;
  }

  .tool-card {
    padding: 14px;
  }
}
</style>
