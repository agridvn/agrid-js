# Hướng dẫn tích hợp Agrid JS

Tài liệu này hướng dẫn cách tích hợp thư viện `agrid-js` vào các ứng dụng web, bao gồm JavaScript thuần và ReactJS.

## Mục lục

1. [Tích hợp với JavaScript thuần](#tích-hợp-với-javascript-thuần)
2. [Tích hợp với ReactJS](#tích-hợp-với-reactjs)
3. [Các tính năng chính](#các-tính-năng-chính)
4. [Cấu hình nâng cao](#cấu-hình-nâng-cao)
5. [Ví dụ thực tế](#ví-dụ-thực-tế)
6. [Troubleshooting](#troubleshooting)

---

## Tích hợp với JavaScript thuần

### Cài đặt

#### Cách 1: Sử dụng CDN (Khuyến nghị cho production)

Thêm script loader vào thẻ `<head>` của HTML. Script này sẽ tự động tải SDK từ server:

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ứng dụng của bạn</title>

    <!-- Agrid JS SDK Loader -->
    <script>
        !function(t,e){var o,n,p,r;e.__SV||(window.agrid=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="agrid",u.people=u.people||[],u.toString=function(t){var e="agrid";return"agrid"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getSurveys getActiveMatchingSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.agrid||[]);
    </script>
</head>
<body>
    <!-- Nội dung trang web -->
</body>
</html>
```

#### Cách 2: Cài đặt qua npm

```bash
npm install agrid-js
# hoặc
yarn add agrid-js
# hoặc
pnpm add agrid-js
```

Sau đó import vào file JavaScript:

```javascript
import agrid from 'agrid-js'
```

### Khởi tạo

Sau khi script đã được load, khởi tạo Agrid với API key của bạn:

```javascript
// Khởi tạo Agrid
agrid.init('YOUR_PROJECT_API_KEY', {
    api_host: 'https://us.i.agrid.com', // URL của Agrid instance
    // Các tùy chọn khác
    loaded: function(agrid) {
        // Callback khi Agrid đã load xong
        console.log('Agrid đã sẵn sàng!');
    }
});
```

**Lưu ý:** Nếu bạn sử dụng CDN, script loader sẽ tự động gọi `init()` khi SDK được tải. Bạn có thể gọi `agrid.init()` ngay sau script loader mà không cần đợi DOM ready.

### Ví dụ tích hợp cơ bản

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Ứng dụng Web - Tích hợp Agrid</title>
    <script>
        !function(t,e){var o,n,p,r;e.__SV||(window.agrid=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="agrid",u.people=u.people||[],u.toString=function(t){var e="agrid";return"agrid"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getSurveys getActiveMatchingSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.agrid||[]);
    </script>
</head>
<body>
    <h1>Ứng dụng của tôi</h1>
    <button id="btn-dang-ky">Đăng ký</button>
    <button id="btn-dang-nhap">Đăng nhập</button>
    <button id="btn-mua-hang">Mua hàng</button>

    <script>
        // Khởi tạo Agrid
        agrid.init('YOUR_PROJECT_API_KEY', {
            api_host: 'https://us.i.agrid.com',
            loaded: function(agrid) {
                console.log('Agrid đã sẵn sàng!');
            }
        });

        // Track sự kiện đăng ký
        document.getElementById('btn-dang-ky').addEventListener('click', function() {
            agrid.capture('user_registered', {
                registration_method: 'email',
                timestamp: new Date().toISOString()
            });
        });

        // Track sự kiện đăng nhập
        document.getElementById('btn-dang-nhap').addEventListener('click', function() {
            agrid.capture('user_logged_in', {
                login_method: 'email'
            });
        });

        // Track sự kiện mua hàng
        document.getElementById('btn-mua-hang').addEventListener('click', function() {
            agrid.capture('purchase_completed', {
                product_name: 'Sản phẩm A',
                price: 500000,
                currency: 'VND'
            });
        });
    </script>
</body>
</html>
```

### Ví dụ với ES Modules

Nếu bạn sử dụng ES modules:

```javascript
import agrid from 'agrid-js'

// Khởi tạo
agrid.init('YOUR_PROJECT_API_KEY', {
    api_host: 'https://us.i.agrid.com'
})

// Track events
agrid.capture('page_viewed', {
    page: 'homepage'
})

// Identify user
agrid.identify('user_123', {
    email: 'user@example.com',
    name: 'Nguyễn Văn A'
})
```

---

## Tích hợp với ReactJS

### Cài đặt

```bash
npm install agrid-js @agrid/react
# hoặc
yarn add agrid-js @agrid/react
# hoặc
pnpm add agrid-js @agrid/react
```

### Cấu hình cơ bản

#### Sử dụng AgridProvider

Bọc ứng dụng của bạn với `AgridProvider` trong component gốc (thường là `App.jsx` hoặc `App.tsx`):

```jsx
import React from 'react'
import { AgridProvider } from '@agrid/react'
import YourApp from './YourApp'

function App() {
    return (
        <AgridProvider
            apiKey="YOUR_PROJECT_API_KEY"
            options={{
                api_host: 'https://us.i.agrid.com',
                capture_pageview: true,
                capture_pageleave: true
            }}
        >
            <YourApp />
        </AgridProvider>
    )
}

export default App
```

#### Sử dụng với client instance đã khởi tạo

Nếu bạn muốn khởi tạo client riêng:

```jsx
import React from 'react'
import { AgridProvider } from '@agrid/react'
import agrid from 'agrid-js'

// Khởi tạo Agrid
agrid.init('YOUR_PROJECT_API_KEY', {
    api_host: 'https://us.i.agrid.com'
})

function App() {
    return (
        <AgridProvider client={agrid}>
            <YourApp />
        </AgridProvider>
    )
}

export default App
```

### Sử dụng Hooks

#### useAgrid Hook

Hook này trả về instance của Agrid client để bạn có thể gọi các phương thức như `capture`, `identify`, v.v.

```jsx
import React from 'react'
import { useAgrid } from '@agrid/react'

function ProductCard({ product }) {
    const agrid = useAgrid()

    const handlePurchase = () => {
        // Track sự kiện mua hàng
        agrid?.capture('product_purchased', {
            product_id: product.id,
            product_name: product.name,
            price: product.price,
            category: product.category
        })
    }

    return (
        <div className="product-card">
            <h3>{product.name}</h3>
            <p>{product.price} VND</p>
            <button onClick={handlePurchase}>Mua ngay</button>
        </div>
    )
}

export default ProductCard
```

**Lưu ý:** Sử dụng optional chaining (`?.`) vì `agrid` có thể là `undefined` trong một số trường hợp (ví dụ: khi chưa khởi tạo xong).

#### useFeatureFlagEnabled Hook

Kiểm tra xem một feature flag có được bật hay không:

```jsx
import React from 'react'
import { useFeatureFlagEnabled } from '@agrid/react'

function PromoBanner() {
    const isPromoEnabled = useFeatureFlagEnabled('promo-banner')

    if (!isPromoEnabled) {
        return null
    }

    return (
        <div className="promo-banner">
            <h2>Khuyến mãi đặc biệt!</h2>
            <p>Giảm 20% cho đơn hàng đầu tiên</p>
        </div>
    )
}

export default PromoBanner
```

#### useFeatureFlagVariantKey Hook

Lấy variant key của feature flag (hữu ích cho A/B testing):

```jsx
import React from 'react'
import { useFeatureFlagVariantKey } from '@agrid/react'

function CheckoutButton() {
    const buttonVariant = useFeatureFlagVariantKey('checkout-button-style')

    const getButtonClass = () => {
        switch(buttonVariant) {
            case 'primary':
                return 'btn-primary'
            case 'secondary':
                return 'btn-secondary'
            default:
                return 'btn-default'
        }
    }

    return (
        <button className={getButtonClass()}>
            Thanh toán
        </button>
    )
}

export default CheckoutButton
```

#### useFeatureFlagPayload Hook

Lấy payload của feature flag (dữ liệu JSON tùy chỉnh):

```jsx
import React from 'react'
import { useFeatureFlagPayload } from '@agrid/react'

function ProductCard({ product }) {
    const discountConfig = useFeatureFlagPayload('product-discount-config')

    const getDiscountPrice = () => {
        if (discountConfig && discountConfig.discountPercent) {
            return product.price * (1 - discountConfig.discountPercent / 100)
        }
        return product.price
    }

    return (
        <div className="product-card">
            <h3>{product.name}</h3>
            <p className="price">{getDiscountPrice()} VND</p>
            {discountConfig?.showBadge && (
                <span className="badge">Giảm giá!</span>
            )}
        </div>
    )
}

export default ProductCard
```

#### useActiveFeatureFlags Hook

Lấy danh sách tất cả các feature flags đang active:

```jsx
import React from 'react'
import { useActiveFeatureFlags } from '@agrid/react'

function FeatureFlagsDebug() {
    const activeFlags = useActiveFeatureFlags()

    return (
        <div>
            <h3>Active Feature Flags:</h3>
            <ul>
                {activeFlags.map(flag => (
                    <li key={flag}>{flag}</li>
                ))}
            </ul>
        </div>
    )
}

export default FeatureFlagsDebug
```

### Components

#### AgridErrorBoundary

Component này giúp track lỗi React và gửi về Agrid:

```jsx
import React from 'react'
import { AgridErrorBoundary } from '@agrid/react'

function App() {
    return (
        <AgridErrorBoundary>
            <YourApp />
        </AgridErrorBoundary>
    )
}
```

### Ví dụ tích hợp đầy đủ cho React App

```jsx
// src/App.jsx
import React from 'react'
import { AgridProvider } from '@agrid/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProductPage from './pages/ProductPage'
import CheckoutPage from './pages/CheckoutPage'

function App() {
    return (
        <AgridProvider
            apiKey={process.env.REACT_APP_AGRID_API_KEY}
            options={{
                api_host: process.env.REACT_APP_AGRID_API_HOST || 'https://us.i.agrid.com',
                person_profiles: 'identified_only',
                capture_pageview: true,
                capture_pageleave: true
            }}
        >
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products/:id" element={<ProductPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                </Routes>
            </BrowserRouter>
        </AgridProvider>
    )
}

export default App
```

```jsx
// src/pages/ProductPage.jsx
import React, { useEffect } from 'react'
import { useAgrid, useFeatureFlagEnabled } from '@agrid/react'
import { useParams } from 'react-router-dom'

function ProductPage() {
    const { id } = useParams()
    const agrid = useAgrid()
    const showNewCheckout = useFeatureFlagEnabled('new-checkout-flow')

    useEffect(() => {
        // Track page view
        agrid?.capture('product_viewed', {
            product_id: id
        })
    }, [id, agrid])

    const handleAddToCart = () => {
        agrid?.capture('product_added_to_cart', {
            product_id: id
        })
    }

    return (
        <div>
            <h1>Chi tiết sản phẩm {id}</h1>
            <button onClick={handleAddToCart}>Thêm vào giỏ</button>
            {showNewCheckout && (
                <div>Checkout flow mới đã được bật!</div>
            )}
        </div>
    )
}

export default ProductPage
```

---

## Các tính năng chính

### 1. Track Events (Ghi lại sự kiện)

Capture các sự kiện người dùng với các thuộc tính tùy chỉnh:

```javascript
// JavaScript thuần
agrid.capture('event_name', {
    property1: 'value1',
    property2: 'value2',
    numeric_property: 123
})

// ReactJS
const agrid = useAgrid()
agrid?.capture('event_name', {
    property1: 'value1',
    property2: 'value2'
})
```

### 2. Identify Users (Xác định người dùng)

Xác định người dùng khi họ đăng nhập:

```javascript
// Khi người dùng đăng nhập
agrid.identify('user_id_123', {
    email: 'user@example.com',
    name: 'Nguyễn Văn A',
    phone: '0123456789',
    plan: 'premium'
})
```

### 3. Set User Properties (Thiết lập thuộc tính người dùng)

Cập nhật thông tin người dùng:

```javascript
// Set một lần (chỉ set nếu chưa có giá trị)
agrid.people.set_once({
    first_visit: new Date().toISOString(),
    signup_date: '2024-01-01'
})

// Set hoặc cập nhật
agrid.people.set({
    plan: 'premium',
    subscription_date: new Date().toISOString(),
    last_active: new Date().toISOString()
})

// Increment (tăng giá trị số)
agrid.people.increment('purchase_count', 1)
agrid.people.increment('total_spent', 50000)
```

### 4. Feature Flags (Cờ tính năng)

Kiểm tra và sử dụng feature flags:

```javascript
// Kiểm tra feature flag có được bật không
const isEnabled = agrid.isFeatureEnabled('new-checkout-flow')

if (isEnabled) {
    // Hiển thị tính năng mới
    showNewCheckoutFlow()
}

// Lấy giá trị variant của feature flag
const variant = agrid.getFeatureFlag('button-color')
// variant có thể là: 'red', 'blue', 'green', hoặc false nếu flag không được bật

// Lấy payload của feature flag
const payload = agrid.getFeatureFlagPayload('discount-config')
// payload có thể là: { discountPercent: 20, showBadge: true }

// Lắng nghe thay đổi của feature flags
agrid.onFeatureFlags(function(flags) {
    console.log('Feature flags updated:', flags)
})
```

### 5. Session Recording (Ghi lại phiên làm việc)

Bật session recording để ghi lại hành vi người dùng:

```javascript
agrid.init('YOUR_API_KEY', {
    api_host: 'https://us.i.agrid.com',
    session_recording: {
        recordCrossOriginIframes: true,
        maskAllInputs: false,
        maskInputOptions: {
            password: true,
            email: false
        }
    }
})
```

### 6. Autocapture (Tự động capture)

Tự động capture các sự kiện click, form submission, và pageview:

```javascript
agrid.init('YOUR_API_KEY', {
    api_host: 'https://us.i.agrid.com',
    autocapture: true, // Bật autocapture
    capture_pageview: true, // Tự động capture pageview
    capture_pageleave: true // Tự động capture khi rời trang
})
```

### 7. Surveys (Khảo sát)

Lấy và hiển thị surveys:

```javascript
// Lấy tất cả surveys
const surveys = agrid.getSurveys()

// Lấy các surveys đang active và match với user hiện tại
const activeSurveys = agrid.getActiveMatchingSurveys()

// Lắng nghe thay đổi surveys
agrid.on('surveys', function(surveys) {
    console.log('Surveys updated:', surveys)
})
```

---

## Cấu hình nâng cao

### Cấu hình đầy đủ

```javascript
agrid.init('YOUR_PROJECT_API_KEY', {
    api_host: 'https://us.i.agrid.com',

    // Tự động capture pageview
    capture_pageview: true,

    // Tự động capture pageleave
    capture_pageleave: true,

    // Autocapture (tự động capture clicks, form submissions)
    autocapture: true,

    // Session recording
    session_recording: {
        recordCrossOriginIframes: true,
        maskAllInputs: false,
        maskInputOptions: {
            password: true,
            email: false
        }
    },

    // Feature flags
    advanced_disable_feature_flags_on_first_load: false,

    // Person profiles
    person_profiles: 'identified_only', // 'always' | 'identified_only' | 'never'

    // Persistence
    persistence: 'localStorage+cookie', // 'localStorage+cookie' | 'localStorage' | 'cookie' | 'memory' | 'disabled'

    // Debug mode (chỉ dùng trong development)
    debug: process.env.NODE_ENV === 'development',

    // Loaded callback
    loaded: function(agrid) {
        console.log('Agrid loaded:', agrid)
    }
})
```

### Environment Variables

Tạo file `.env`:

```env
REACT_APP_AGRID_API_KEY=your_api_key_here
REACT_APP_AGRID_API_HOST=https://us.i.agrid.com
```

Sử dụng trong code:

```javascript
agrid.init(process.env.REACT_APP_AGRID_API_KEY, {
    api_host: process.env.REACT_APP_AGRID_API_HOST
})
```

### TypeScript Support

Agrid JS có hỗ trợ TypeScript đầy đủ:

```typescript
import agrid from 'agrid-js'

agrid.init('YOUR_API_KEY', {
    api_host: 'https://us.i.agrid.com'
})

// TypeScript sẽ tự động gợi ý các phương thức và thuộc tính
agrid.capture('event_name', {
    // TypeScript sẽ kiểm tra types
})
```

---

## Ví dụ thực tế

### E-commerce Website

```jsx
// src/hooks/useTracking.js
import { useAgrid } from '@agrid/react'

export function useTracking() {
    const agrid = useAgrid()

    const trackProductView = (product) => {
        agrid?.capture('product_viewed', {
            product_id: product.id,
            product_name: product.name,
            category: product.category,
            price: product.price
        })
    }

    const trackAddToCart = (product, quantity = 1) => {
        agrid?.capture('product_added_to_cart', {
            product_id: product.id,
            product_name: product.name,
            quantity: quantity,
            price: product.price,
            total: product.price * quantity
        })
    }

    const trackPurchase = (order) => {
        agrid?.capture('purchase_completed', {
            order_id: order.id,
            total: order.total,
            items: order.items,
            payment_method: order.payment_method
        })
    }

    const trackSearch = (query, resultsCount) => {
        agrid?.capture('search_performed', {
            search_query: query,
            results_count: resultsCount
        })
    }

    return {
        trackProductView,
        trackAddToCart,
        trackPurchase,
        trackSearch
    }
}
```

```jsx
// src/components/ProductCard.jsx
import React, { useEffect } from 'react'
import { useTracking } from '../hooks/useTracking'
import { useFeatureFlagEnabled } from '@agrid/react'

function ProductCard({ product }) {
    const { trackProductView, trackAddToCart } = useTracking()
    const showDiscount = useFeatureFlagEnabled('show-product-discount')

    useEffect(() => {
        trackProductView(product)
    }, [product, trackProductView])

    const handleAddToCart = () => {
        trackAddToCart(product, 1)
        // Logic thêm vào giỏ hàng
    }

    return (
        <div className="product-card">
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
            <p>{product.price} VND</p>
            {showDiscount && product.discount && (
                <span className="discount">Giảm {product.discount}%</span>
            )}
            <button onClick={handleAddToCart}>Thêm vào giỏ</button>
        </div>
    )
}

export default ProductCard
```

### User Authentication Flow

```javascript
// Khi người dùng đăng nhập
function handleLogin(user) {
    // Identify user
    agrid.identify(user.id, {
        email: user.email,
        name: user.name,
        plan: user.plan
    })

    // Set user properties
    agrid.people.set({
        last_login: new Date().toISOString(),
        login_count: user.loginCount
    })

    // Track login event
    agrid.capture('user_logged_in', {
        login_method: 'email',
        user_id: user.id
    })
}

// Khi người dùng đăng xuất
function handleLogout() {
    agrid.capture('user_logged_out')
    agrid.reset() // Reset user session
}
```

---

## Troubleshooting

### Agrid không load

1. **Kiểm tra API key và API host**: Đảm bảo bạn đã cung cấp đúng API key và host
2. **Kiểm tra console**: Mở DevTools và kiểm tra tab Console để xem có lỗi không
3. **Kiểm tra network**: Xem tab Network để đảm bảo requests được gửi đi
4. **Đảm bảo script được load**: Nếu dùng CDN, đảm bảo script loader được đặt trong `<head>`

### Events không được gửi

1. **Kiểm tra network tab**: Xem có requests đến Agrid server không
2. **Kiểm tra ad blocker**: Một số ad blocker có thể chặn requests đến analytics services
3. **Kiểm tra CORS**: Đảm bảo server Agrid cho phép CORS từ domain của bạn
4. **Kiểm tra debug mode**: Bật `debug: true` trong config để xem logs chi tiết

### Feature flags không hoạt động

1. **Đảm bảo feature flags đã được bật**: Kiểm tra trong Agrid dashboard
2. **Kiểm tra user đã được identify chưa**: Một số flags yêu cầu user phải được identify
3. **Sử dụng debug**: Gọi `agrid.getFeatureFlag('flag-name')` để xem giá trị hiện tại
4. **Kiểm tra network**: Đảm bảo requests để load feature flags thành công

### React hooks trả về undefined

1. **Đảm bảo AgridProvider đã được bọc**: Component sử dụng hooks phải nằm trong `AgridProvider`
2. **Kiểm tra API key**: Đảm bảo API key đã được cung cấp
3. **Sử dụng optional chaining**: Luôn sử dụng `agrid?.capture()` thay vì `agrid.capture()`

### Session recording không hoạt động

1. **Kiểm tra cấu hình**: Đảm bảo `session_recording` đã được bật trong config
2. **Kiểm tra permissions**: Một số browser có thể chặn recording
3. **Kiểm tra console**: Xem có lỗi liên quan đến recording không

---

## Tài liệu tham khảo

- [Agrid JS Repository](https://github.com/agridvn/agrid-js)
- [Agrid JS npm Package](https://www.npmjs.com/package/agrid-js)
- [@agrid/react npm Package](https://www.npmjs.com/package/@agrid/react)
- [Agrid Documentation](https://agrid.vn/docs)
- [API Reference](https://agrid.vn/docs/api)

---

## Hỗ trợ

Nếu gặp vấn đề, vui lòng:

1. Kiểm tra [tài liệu chính thức](https://github.com/agridvn/agrid-js#readme)
2. Tạo issue trên [GitHub](https://github.com/agridvn/agrid-js/issues)
3. Liên hệ team phát triển

---

## Tóm tắt nhanh

### JavaScript thuần

```javascript
// 1. Thêm script loader vào <head>
// 2. Khởi tạo
agrid.init('YOUR_API_KEY', { api_host: 'https://us.i.agrid.com' })
// 3. Track events
agrid.capture('event_name', { property: 'value' })
// 4. Identify users
agrid.identify('user_id', { email: 'user@example.com' })
```

### ReactJS

```jsx
// 1. Cài đặt
// npm install agrid-js @agrid/react

// 2. Bọc app với AgridProvider
<AgridProvider apiKey="YOUR_API_KEY" options={{ api_host: 'https://us.i.agrid.com' }}>
    <App />
</AgridProvider>

// 3. Sử dụng hooks
const agrid = useAgrid()
agrid?.capture('event_name')
```
