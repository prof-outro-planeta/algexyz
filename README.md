<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="src/assets/icon/icon-algexyz-dark.png" />
  <img src="src/assets/icon/icon-algexyz.png" alt="ALGEXYZ" width="160" />
</picture>

# ALGEXYZ

**Same value, different basis.**

Learn and work with number systems: convert, calculate and practice in binary, octal, decimal, duodecimal and hexadecimal.

**English** · [Português](README.pt-BR.md)

[![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)](https://angular.dev)
[![Ionic](https://img.shields.io/badge/Ionic-9-3880FF?logo=ionic&logoColor=white)](https://ionicframework.com)
[![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![RevenueCat](https://img.shields.io/badge/RevenueCat-13-F2545B)](https://www.revenuecat.com)
[![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev)

[![Android](https://img.shields.io/badge/platform-Android-3DDC84?logo=android&logoColor=white)](#-android)
[![Version](https://img.shields.io/badge/version-0.7.0-F3701E)](package.json)
[![License](https://img.shields.io/badge/license-MIT-4B607F)](LICENSE)

[**Open in the browser**](https://algexyz-b8931.web.app/) · [Features](#-features) · [Getting started](#-getting-started) · [Roadmap](#-roadmap)

</div>

---

## Contents

- [Features](#-features)
- [Step-by-step explanations](#-step-by-step-explanations)
- [Architecture](#-architecture)
- [Getting started](#-getting-started)
- [Roadmap](#-roadmap)
- [Author and license](#-author-and-license)

## ✨ Features

| Tab | What it does |
|---|---|
| **Converter** | Converts numbers between bases, validates the allowed digits and shows the conversion step by step. |
| **Calculator** | Adds, subtracts, multiplies and divides integers in the chosen base with arbitrary precision (`bigint`). Keys A–F show their decimal value (10–15) in the corner. Unlimited use. |
| **Practice** | Conversion exercises with direct answer or multiple choice, instant feedback and an explanation, with a daily limit. |

Everything runs locally: the math does not depend on the network, so the app works offline.

## 🧮 Step-by-step explanations

| Conversion | Technique |
|---|---|
| Binary → octal or hexadecimal | **Bit grouping:** bits are split into groups of 3 or 4, with alternating colors that link each group to its digit. Leading padding zeros are dimmed. |
| Octal or hexadecimal → binary | **Digit to bits:** each digit becomes 3 or 4 bits, then the bits are joined and the leading zeros dropped. |
| Any base → decimal | **Place value:** each digit shows its place value above it (128, 64, 32… in binary), highlighted when it counts and dimmed when it is zero, followed by the sum. |
| Decimal → any base | **Repeated division:** divide by the target base until the quotient reaches 0, then read the remainders from bottom to top. |
| Other pairs (e.g. 16 → 8, 12 → 2) | **Via decimal:** place value to reach base 10, then repeated division to reach the target base. |

Place value example:

```
11010110₂ = 1·2⁷ + 1·2⁶ + 0·2⁵ + 1·2⁴ + 0·2³ + 1·2² + 1·2¹ + 0·2⁰
          = 128 + 64 + 16 + 4 + 2
          = 214₁₀
```

Explanations are shared between Converter and Practice and live in [`src/app/domain/explanation/`](src/app/domain/explanation).

## 🏗️ Architecture

```
src/app/
├── domain/        Pure TypeScript logic, no Angular, Ionic or Capacitor
│   ├── number-system/   Bases, digits and validation
│   ├── conversion/      Base conversion (bigint)
│   ├── calculator/      Arithmetic operations
│   ├── explanation/     Step-by-step explanations
│   └── practice/        Question generation, grading and daily limit
├── core/
│   ├── firebase/        Firebase initialization and authentication
│   └── subscription/    Plans, capabilities and RevenueCat integration
├── features/      Screens: converter, calculator, practice, paywall
├── shared/        Components reused across screens
└── tabs/          Tab navigation
```

- **Isolated domain:** all the math is tested without any framework.
- **Decoupled subscriptions:** screens only query `SubscriptionCapabilities`. Dependencies flow in this order: screens → capabilities → `SubscriptionService` → `SubscriptionGateway` → RevenueCat adapter → SDK. Only `revenuecat-subscription.gateway.ts` imports the SDK.
- **Single subscription state:** the plan always comes from RevenueCat's `CustomerInfo` and is never granted manually.

## 🚀 Getting started

### Prerequisites

- Node.js 20 or later
- Ionic CLI: `npm install -g @ionic/cli`
- Android Studio, to run on Android

### Installation

```bash
git clone https://github.com/prof-outro-planeta/algexyz.git
cd algexyz
npm install
```

### Configuration

Environment files are not versioned. Create them from the template:

```bash
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.example.ts src/environments/environment.prod.ts
```

Then fill in:

- **`firebase`:** the web app configuration from the Firebase Console.
- **`revenueCat.apiKey`:** the public SDK key. Use the Test Store key (`test_...`) in development and the Google Play key (`goog_...`) in production. Never use a secret key.
- In `environment.prod.ts`, set `production: true` and `debugLogs: false`.

> [!NOTE]
> Without a RevenueCat key, the app works normally on the FREE plan.

### 🌐 Browser

```bash
ionic serve
```

Subscriptions only work in the Android app. In the browser, the app stays on the FREE plan.

### 🤖 Android

```bash
ionic build
npx cap sync android
npx cap open android
```

Then run it from Android Studio. To test purchases with the Test Store, prefer the development build, which enables the SDK logs:

```bash
npx ng build --configuration development
npx cap sync android
```

### 🧪 Tests

```bash
npm test
```

<details>
<summary><strong>RevenueCat setup</strong></summary>

<br />

In the RevenueCat dashboard:

1. Create the `pro` and `premium` entitlements.
2. Create the `algexyz_pro_monthly` and `algexyz_premium_monthly` products and attach each one to its entitlement.
3. Create the `default` offering, mark it as **Current** and add the `pro_monthly` and `premium_monthly` packages.

Prices shown in the app come from RevenueCat, localized; no price is hardcoded.

</details>

## 🗺️ Roadmap

- [x] Converter with digit validation
- [x] Calculator in any available base
- [x] Daily practice with grading and explanations
- [x] PRO and PREMIUM subscriptions with RevenueCat
- [x] Step by step by bit grouping and by place value
- [x] Step by step from decimal to other bases (repeated division) and between non-decimal bases
- [ ] Fractions and two's complement (PRO)
- [ ] Arbitrary bases from 2 to 36 in the UI (PREMIUM)
- [ ] Google Play Store release

## 👤 Author and license

Made by **Ítalo Marques Rodrigues Silva**.

Released under the [MIT](LICENSE) license.
