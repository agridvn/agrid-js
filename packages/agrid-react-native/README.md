# @agrid/agrid-react-native

React Native SDK for Agrid analytics and feature flags, scoped as `@agrid/agrid-react-native`. Supports React Native and Expo apps with optional integrations (AsyncStorage, DeviceInfo, Navigation, SafeArea, etc.).

## Installation

```bash
npx expo install @agrid/agrid-react-native expo-file-system expo-application expo-device expo-localization
# or
npm install @agrid/agrid-react-native @react-native-async-storage/async-storage react-native-device-info react-native-localize
```

On iOS:

```bash
cd ios && pod install && cd ..
```

## Quick Start

```tsx
import { AgridProvider } from '@agrid/agrid-react-native'

export function App() {
  return (
    <AgridProvider
      apiKey="YOUR_PROJECT_API_KEY"
      options={{ host: 'https://app.agrid.com' }}
    >
      <YourApp />
    </AgridProvider>
  )
}
```

Manual initialization:

```ts
import Agrid from '@agrid/agrid-react-native'

export const agrid = new Agrid('YOUR_PROJECT_API_KEY', {
  host: 'https://app.agrid.com',
})
```

## Events

```tsx
import { useAgrid } from '@agrid/agrid-react-native'

function MyComponent() {
  const agrid = useAgrid()
  const onPress = () => {
    agrid?.capture('button_clicked', { button_name: 'sign_up', screen: 'home' })
  }
  return <Button onPress={onPress} title="Sign Up" />
}
```

## Screen Tracking

For `@react-navigation/native` v6 or below:

```tsx
import { AgridProvider } from '@agrid/agrid-react-native'
import { NavigationContainer } from '@react-navigation/native'

export function App() {
  return (
    <NavigationContainer>
      <AgridProvider apiKey="YOUR_PROJECT_API_KEY" autocapture>
        <YourApp />
      </AgridProvider>
    </NavigationContainer>
  )
}
```

For v7 and above, track screens manually in `onStateChange`.

## Autocapture

```tsx
<AgridProvider
  apiKey="YOUR_PROJECT_API_KEY"
  options={{ captureAppLifecycleEvents: true }}
  autocapture={{ captureScreens: true, captureTouches: true }}
>
  <YourApp />
</AgridProvider>
```

## Links

- Main repo: https://github.com/advnsoftware-oss/agrid-js
agrid?.identify('user_123', {
  email: 'user@example.com',
  name: 'Nguyễn Văn A',
  plan: 'premium',
})
```

> **💡 Mẹo:** Gọi `identify` ngay sau khi người dùng đăng nhập để đảm bảo tất cả sự kiện được liên kết đúng.

### Lấy Distinct ID hiện tại

```tsx
const distinctId = agrid?.getDistinctId()
```

### Alias

Gán nhiều distinct ID cho cùng một người dùng:

```tsx
agrid?.alias('new_distinct_id')
```

### Thiết lập thuộc tính người dùng

#### Sử dụng $set

```tsx
agrid?.identify('user_123', {
  $set: {
    email: 'user@example.com',
    name: 'Nguyễn Văn A',
  }
})
```

#### Sử dụng $set_once

`$set_once` chỉ thiết lập thuộc tính nếu người dùng chưa có thuộc tính đó:

```tsx
agrid?.identify('user_123', {
  $set: {
    email: 'user@example.com',
  },
  $set_once: {
    first_login_date: '2024-01-01',
  }
})
```

#### Thiết lập thuộc tính trong sự kiện

```tsx
agrid?.capture('purchase_completed', {
  $set: {
    last_purchase_date: new Date().toISOString(),
  },
  product_id: '12345',
})
```

## Super Properties

Super properties là các thuộc tính được gửi kèm với **mọi** sự kiện sau khi được thiết lập:

```tsx
agrid?.register({
  app_version: '1.0.0',
  environment: 'production',
  user_tier: 'premium',
})
```

Sau khi gọi `register`, tất cả sự kiện sẽ tự động bao gồm các thuộc tính này.

### Xóa Super Properties

```tsx
agrid?.unregister('app_version')
```

> **⚠️ Lưu ý:** Super properties khác với person properties. Super properties chỉ áp dụng cho sự kiện, không lưu trữ thông tin người dùng.

## Feature Flags

Feature flags cho phép bạn triển khai và rollback tính năng một cách an toàn.

### Cách 1: Sử dụng Hooks

```tsx
import { useFeatureFlag } from '@agrid/agrid-react-native'

function MyComponent() {
  const showNewFeature = useFeatureFlag('new-feature')

  if (showNewFeature) {
    return <NewFeature />
  }

  return <OldFeature />
}
```

### Cách 2: Kiểm tra trực tiếp

```tsx
import { useAgrid } from '@agrid/agrid-react-native'

function MyComponent() {
  const agrid = useAgrid()
  const isEnabled = agrid?.isFeatureEnabled('new-feature')

  return isEnabled ? <NewFeature /> : <OldFeature />
}
```

### Lấy giá trị Feature Flag

```tsx
const flagValue = agrid?.getFeatureFlag('feature-key')
// Trả về: boolean | string | undefined
```

### Lấy payload của Feature Flag

```tsx
const payload = agrid?.getFeatureFlagPayload('feature-key')
```

### Reload Feature Flags

```tsx
// Reload đồng bộ
agrid?.reloadFeatureFlags()

// Reload bất đồng bộ
const flags = await agrid?.reloadFeatureFlagsAsync()
```

### Thiết lập thuộc tính cho Feature Flags

Đôi khi bạn cần đánh giá feature flags dựa trên thuộc tính chưa được gửi lên server:

```tsx
agrid?.setPersonPropertiesForFlags({
  is_beta_user: 'true',
  organization_size: 'large',
})
```

## Tùy chọn nâng cao

### Flush thủ công

Gửi tất cả sự kiện trong hàng đợi ngay lập tức:

```tsx
await agrid?.flush()
```

### Reset sau khi logout

Xóa tất cả dữ liệu người dùng và bắt đầu session mới:

```tsx
agrid?.reset()
```

### Opt out/in

```tsx
// Opt out - ngừng tracking
await agrid?.optOut()

// Opt in - tiếp tục tracking
await agrid?.optIn()
```

### Group Analytics

Liên kết người dùng với một nhóm (ví dụ: công ty, team):

```tsx
agrid?.group('company', 'company_id_123', {
  name: 'Acme Inc',
  employees: 50,
})
```

### Custom Storage

Bạn có thể cung cấp custom storage implementation:

```tsx
import { MMKV } from 'react-native-mmkv'

const storage = new MMKV()

const customStorage = {
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
}

<AgridProvider
  apiKey="<your_api_key>"
  options={{
    customStorage: customStorage,
  }}
>
  {/* App */}
</AgridProvider>
```

### Debug Mode

Bật logging để debug:

```tsx
<AgridProvider
  apiKey="<your_api_key>"
  options={{
    // Bật debug logs
    debug: true,
  }}
>
  {/* App */}
</AgridProvider>
```

### Vô hiệu hóa cho môi trường local

```tsx
<AgridProvider
  apiKey="<your_api_key>"
  options={{
    disabled: __DEV__, // Tắt tracking trong development
  }}
>
  {/* App */}
</AgridProvider>
```

## Session Replay

Ghi lại và phát lại session của người dùng:

```tsx
<AgridProvider
  apiKey="<your_api_key>"
  options={{
    enableSessionReplay: true,
    sessionReplayConfig: {
      maskAllTexts: true,        // Che tất cả text
      maskAllImages: true,        // Che tất cả hình ảnh
      captureNetworkTelemetry: true, // Capture network requests
    },
  }}
>
  {/* App */}
</AgridProvider>
```

## Error Tracking

Tự động ghi nhận lỗi JavaScript:

```tsx
<AgridProvider
  apiKey="<your_api_key>"
  options={{
    errorTracking: {
      captureErrors: true,
      captureUnhandledRejections: true,
    },
  }}
>
  {/* App */}
</AgridProvider>
```

## Surveys

Hiển thị khảo sát cho người dùng:

```tsx
import { AgridSurveyProvider } from '@agrid/agrid-react-native'

<AgridProvider apiKey="<your_api_key>">
  <AgridSurveyProvider>
    {/* App */}
  </AgridSurveyProvider>
</AgridProvider>
```

## Ví dụ hoàn chỉnh

```tsx
import React, { useEffect, useState } from 'react'
import { View, Button, Text } from 'react-native'
import { AgridProvider, useAgrid } from '@agrid/agrid-react-native'

function App() {
  return (
    <AgridProvider
      apiKey="<your_api_key>"
      options={{
        host: 'https://gw.track-asia.vn',
        captureAppLifecycleEvents: true,
        flushAt: 10,
      }}
      autocapture={{
        captureTouches: true,
      }}
    >
      <MyApp />
    </AgridProvider>
  )
}

function MyApp() {
  const agrid = useAgrid()
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Identify user khi đăng nhập
    if (user) {
      agrid?.identify(user.id, {
        email: user.email,
        name: user.name,
      })
    }
  }, [user, agrid])

  const handlePurchase = () => {
    agrid?.capture('purchase_completed', {
      product_id: '12345',
      price: 99.99,
    })
  }

  const handleLogout = () => {
    agrid?.reset()
    setUser(null)
  }

  return (
    <View>
      <Text>Welcome to Agrid!</Text>
      <Button title="Make Purchase" onPress={handlePurchase} />
      <Button title="Logout" onPress={handleLogout} />
    </View>
  )
}

export default App
```

## Câu hỏi?

- Liên hệ với đội ngũ hỗ trợ Agrid qua email (advn.software@gmail.com) để được giúp đỡ.

## Tài liệu tham khảo

- [React Native Documentation](https://reactnative.dev/)
