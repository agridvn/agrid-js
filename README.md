<p align="center">
  <strong>Thư viện theo dõi hành vi người dùng trên Web - Agrid JS — SDK Phân Tích Sản Phẩm & Cờ Tính Năng</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/agrid-js">
    <img alt="npm version" src="https://img.shields.io/npm/v/agrid-js?style=flat-square">
  </a>
  <a href="https://github.com/agridvn/agrid-js/blob/main/LICENSE">
    <img alt="MIT License" src="https://img.shields.io/badge/License-MIT-red.svg?style=flat-square">
  </a>
  <a href="https://github.com/agridvn/agrid-js">
    <img alt="GitHub contributors" src="https://img.shields.io/github/contributors/agridvn/agrid-js?style=flat-square">
  </a>
  <a href="http://makeapullrequest.com">
    <img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square">
  </a>
</p>

<p align="center">
  <a href="#-bắt-đầu-nhanh">Bắt đầu nhanh</a> •
  <a href="#-hướng-dẫn-cài-đặt">Hướng dẫn cài đặt</a> •
  <a href="#-các-gói">Các gói</a> •
  <a href="#-ví-dụ-sử-dụng">Ví dụ sử dụng</a> •
  <a href="#-phát-triển">Phát triển</a>
</p>

---

# Thư viện theo dõi hành vi người dùng trên Web - Agrid JS

**Thư viện theo dõi hành vi người dùng trên Web - Agrid JS** là bộ SDK JavaScript toàn diện cho phân tích sản phẩm, cờ tính năng, ghi lại phiên, bản đồ nhiệt, khảo sát và nhiều hơn nữa. Monorepo này chứa nhiều gói để tích hợp Agrid trên Trình duyệt (Browser), Node.js, React, React Native, Nuxt và NextJS.

## 🚀 Bắt đầu nhanh

### JavaScript (Trình duyệt)

```html
<script>
  !function(t,e){var o,n,p,r;e.__SV||(window.agrid=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="agrid",u.people=u.people||[],u.toString=function(t){var e="agrid";return"agrid"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getSurveys getActiveMatchingSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.agrid||[]);

  agrid.init('YOUR_PROJECT_API_KEY', {
    api_host: 'YOUR_INGESTION_URL'
  });
</script>
```

### React

```bash
npm install agrid-js @agrid/react
```

```jsx
import { AgridProvider } from '@agrid/react'

function App() {
  return (
    <AgridProvider
      apiKey="YOUR_PROJECT_API_KEY"
      options={{
        host: "https://app.agrid.vn",
      }}
    >
      <MyComponent />
    </AgridProvider>
  )
}
```

### Node.js

```bash
npm install agrid-node
```

```javascript
import { Agrid } from 'agrid-node'

const client = new Agrid('YOUR_PROJECT_API_KEY', {
  host: 'https://app.agrid.vn'
})

client.capture({
  distinctId: 'user123',
  event: 'purchase_completed',
  properties: {
    product: 'Product Name',
    price: 99.99
  }
})
```

---

## 🧩 Hướng dẫn cài đặt

### Trình duyệt (SDK chính `agrid-js`)

- Cài đặt: `npm install agrid-js`
- Khởi tạo với `agrid.init(apiKey, { api_host })` như ví dụ trên.
- Hỗ trợ tự động thu thập (autocapture), cờ tính năng, ghi phiên, bản đồ nhiệt, khảo sát.

### React (`@agrid/react`)

- Cài đặt: `npm install agrid-js @agrid/react`
- Bọc ứng dụng của bạn với `AgridProvider` và sử dụng các hook `useAgrid`, `useFeatureFlagEnabled`.
- Yêu cầu `react >= 16.8.0` và phiên bản `agrid-js` tương thích theo peer dependencies.

### Node.js (`agrid-node`)

- Cài đặt: `npm install agrid-node`
- Yêu cầu `node >= 20`.
- Sử dụng client `Agrid` để gửi sự kiện phía server, cờ tính năng và định danh.

### Lite (`agrid-js-lite`)

- Cài đặt: `npm install agrid-js-lite`
- Tối ưu hóa kích thước gói; hỗ trợ các tính năng phân tích cốt lõi và cờ tính năng.

### Nuxt (`@agrid/nuxt`)

- Cài đặt: `npm install @agrid/nuxt`
- Đăng ký module trong `nuxt.config.ts` và cấu hình `apiKey`, `apiHost`.
- Bên trong dựa vào `agrid-js`/`agrid-node` tùy thuộc vào ngữ cảnh.

### Next.js Config (`@agrid/nextjs-config`)

- Cài đặt: `npm install @agrid/nextjs-config`
- Giúp cấu hình NextJS cho phân tích/cờ tính năng và kiểm tra phiên bản CLI.

### AI (`@agrid/ai`)

- Cài đặt: `npm install @agrid/ai`
- Yêu cầu peer: `agrid-node ^5.0.0`.
- Tích hợp cho OpenAI, Anthropic, Gemini, LangChain và Vercel AI SDK.

### Internal Core (`@agrid/core`)

- Cài đặt: `npm install @agrid/core`
- Core dùng chung cho nhiều SDK; thường không cần dùng trực tiếp trừ khi cho mục đích nâng cao.

### Sử dụng pnpm/yarn

- pnpm: `pnpm add <tên-gói>`
- yarn: `yarn add <tên-gói>`

---

## 📦 Packages

- `agrid-js` (Browser SDK) — tích hợp trình duyệt đầy đủ tính năng
- `agrid-js-lite` (Lite SDK) — gói nhỏ gọn, chức năng cốt lõi
- `agrid-node` (Node.js SDK) — phân tích và cờ phía server
- `@agrid/react` (React SDK) — provider và hooks
- `@agrid/core` (Core) — chức năng cốt lõi dùng chung
- `@agrid/nuxt` (Nuxt Module) — tích hợp Nuxt 3/4
- `@agrid/nextjs-config` (NextJS Config) — trợ giúp cấu hình NextJS
- `@agrid/ai` (AI Integration) — tích hợp AI cho Node.js

---

## 💡 Usage Examples

### Theo dõi sự kiện (Track Events)

```javascript
agrid.capture('button_clicked', {
  button_name: 'Sign Up',
  page: 'homepage'
})

agrid.capture('purchase_completed', {
  product_id: '123',
  product_name: 'Product Name',
  price: 99.99,
  currency: 'USD'
})
```

### Định danh người dùng (Identify Users)

```javascript
agrid.identify('0908888888', {
  phone: '0908888888',
  name: 'John Doe',
  email: 'sample@email.com',
  address: '173 - 179 đường Trương Văn Bang, phường Cát Lái, Thành phố Hồ Chí Minh.',
  other_info: 'Some other information'
})
```

### Cờ tính năng (Feature Flags)

```javascript
if (agrid.isFeatureEnabled('new-checkout-flow')) {
  // Hiển thị quy trình thanh toán mới
}

const buttonColor = agrid.getFeatureFlag('button-color')
if (buttonColor === 'blue') {
  // Sử dụng nút màu xanh
}
```

### React Hooks

```jsx
import { useAgrid, useFeatureFlagEnabled } from '@agrid/react'

function MyComponent() {
  const agrid = useAgrid()
  const isNewFeatureEnabled = useFeatureFlagEnabled('new-feature')

  const handleClick = () => {
    agrid?.capture('button_clicked')
  }

  return (
    <div>
      {isNewFeatureEnabled && <NewFeature />}
      <button onClick={handleClick}>Click me</button>
    </div>
  )
}
```

---

## 🏗️ Development

### Yêu cầu tiên quyết

- Node.js `v22.17.1` (xem `.nvmrc`)
- pnpm `@10.12.4`
- TypeScript `5.8.2`

### Setup

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

### Quy trình làm việc

```bash
pnpm dev
pnpm --filter=agrid-js build
pnpm --filter=agrid-js test:unit
```

Xem thêm: [AGENTS.md](./AGENTS.md), [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## 📄 License

MIT — xem [LICENSE](./LICENSE).

---

## 🔗 Links

- Website: https://agrid.vn
- Tài liệu: https://github.com/agridvn/agrid-js#readme
- GitHub: https://github.com/agridvn/agrid-js
- npm: https://www.npmjs.com/package/agrid-js
- Issues: https://github.com/agridvn/agrid-js/issues

---

## 🙏 Lời cảm ơn

Thư viện theo dõi hành vi người dùng trên Web - Agrid JS là bản fork của [PostHog JS](https://github.com/PostHog/posthog-js), được điều chỉnh cho nền tảng Agrid.

<p align="center">
  Được làm với ❤️ bởi đội ngũ Agrid
</p>
