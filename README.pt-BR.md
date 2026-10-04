<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="src/assets/icon/icon-algexyz-dark.png" />
  <img src="src/assets/icon/icon-algexyz.png" alt="ALGEXYZ" width="160" />
</picture>

# ALGEXYZ

**Same value, different basis.**

Aprenda e trabalhe com sistemas numéricos: converta, calcule e pratique em binário, octal, decimal, duodecimal e hexadecimal.

[English](README.md) · **Português**

[![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)](https://angular.dev)
[![Ionic](https://img.shields.io/badge/Ionic-9-3880FF?logo=ionic&logoColor=white)](https://ionicframework.com)
[![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![RevenueCat](https://img.shields.io/badge/RevenueCat-13-F2545B)](https://www.revenuecat.com)
[![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev)

[![Android](https://img.shields.io/badge/plataforma-Android-3DDC84?logo=android&logoColor=white)](#-android)
[![Versão](https://img.shields.io/badge/vers%C3%A3o-0.7.0-F3701E)](package.json)
[![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-4B607F)](LICENSE)

[**Abrir no navegador**](https://algexyz-b8931.web.app/) · [Funcionalidades](#-funcionalidades) · [Como rodar](#-como-rodar) · [Roadmap](#-roadmap)

</div>

---

## Sumário

- [Funcionalidades](#-funcionalidades)
- [Explicações passo a passo](#-explicações-passo-a-passo)
- [Arquitetura](#-arquitetura)
- [Como rodar](#-como-rodar)
- [Roadmap](#-roadmap)
- [Autor e licença](#-autor-e-licença)

## ✨ Funcionalidades

| Aba | O que faz |
|---|---|
| **Converter** | Converte números entre bases, valida os dígitos permitidos e mostra a conversão passo a passo. |
| **Calculator** | Soma, subtrai, multiplica e divide inteiros na base escolhida, com precisão arbitrária (`bigint`). As teclas A–F mostram no canto o valor decimal (10–15). Uso ilimitado. |
| **Practice** | Exercícios de conversão com resposta direta ou múltipla escolha, correção imediata e explicação, com limite diário. |

Tudo roda localmente: a matemática não depende de rede, então o app funciona offline.

## 🧮 Explicações passo a passo

| Conversão | Técnica |
|---|---|
| Binário → hexadecimal | **Agrupamento de bits:** os bits são separados em grupos de 4, com cores alternadas que ligam cada grupo ao dígito hexadecimal correspondente. Os zeros de preenchimento à esquerda aparecem esmaecidos. |
| Qualquer base → decimal | **Valor posicional:** cada algarismo mostra acima o valor da sua posição (128, 64, 32… no binário), destacado quando conta e esmaecido quando é zero, seguido da soma. |

Exemplo de valor posicional:

```
11010110₂ = 1·2⁷ + 1·2⁶ + 0·2⁵ + 1·2⁴ + 0·2³ + 1·2² + 1·2¹ + 0·2⁰
          = 128 + 64 + 16 + 4 + 2
          = 214₁₀
```

As explicações são compartilhadas entre Converter e Practice e ficam em [`src/app/domain/explanation/`](src/app/domain/explanation).

## 🏗️ Arquitetura

```
src/app/
├── domain/        Lógica pura em TypeScript, sem Angular, Ionic ou Capacitor
│   ├── number-system/   Bases, dígitos e validação
│   ├── conversion/      Conversão entre bases (bigint)
│   ├── calculator/      Operações aritméticas
│   ├── explanation/     Explicações passo a passo
│   └── practice/        Geração de questões, correção e limite diário
├── core/
│   ├── firebase/        Inicialização do Firebase e autenticação
│   └── subscription/    Planos, capacidades e integração com RevenueCat
├── features/      Telas: converter, calculator, practice, paywall
├── shared/        Componentes reutilizados entre telas
└── tabs/          Navegação por abas
```

- **Domínio isolado:** toda a matemática é testada sem framework.
- **Assinaturas desacopladas:** as telas consultam apenas `SubscriptionCapabilities`. A dependência segue esta ordem: telas → capacidades → `SubscriptionService` → `SubscriptionGateway` → adaptador RevenueCat → SDK. Só `revenuecat-subscription.gateway.ts` importa o SDK.
- **Estado único de assinatura:** o plano vem sempre do `CustomerInfo` do RevenueCat e nunca é concedido manualmente.

## 🚀 Como rodar

### Pré-requisitos

- Node.js 20 ou superior
- Ionic CLI: `npm install -g @ionic/cli`
- Android Studio, para rodar no Android

### Instalação

```bash
git clone https://github.com/prof-outro-planeta/algexyz.git
cd algexyz
npm install
```

### Configuração

Os arquivos de ambiente não são versionados. Crie-os a partir do modelo:

```bash
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.example.ts src/environments/environment.prod.ts
```

Depois preencha:

- **`firebase`:** a configuração do app web no Firebase Console.
- **`revenueCat.apiKey`:** a chave pública do SDK. Use a do Test Store (`test_...`) em desenvolvimento e a do Google Play (`goog_...`) em produção. Nunca use uma chave secreta.
- No `environment.prod.ts`, defina `production: true` e `debugLogs: false`.

> [!NOTE]
> Sem a chave do RevenueCat, o app funciona normalmente no plano FREE.

### 🌐 Navegador

```bash
ionic serve
```

As assinaturas só funcionam no app Android. No navegador, o app fica no plano FREE.

### 🤖 Android

```bash
ionic build
npx cap sync android
npx cap open android
```

Depois rode pelo Android Studio. Para testar compras com o Test Store, prefira o build de desenvolvimento, que ativa os logs do SDK:

```bash
npx ng build --configuration development
npx cap sync android
```

### 🧪 Testes

```bash
npm test
```

<details>
<summary><strong>Configuração do RevenueCat</strong></summary>

<br />

No dashboard do RevenueCat:

1. Crie os entitlements `pro` e `premium`.
2. Crie os produtos `algexyz_pro_monthly` e `algexyz_premium_monthly` e associe cada um ao entitlement correspondente.
3. Crie a offering `default`, marque como **Current** e adicione os pacotes `pro_monthly` e `premium_monthly`.

Os preços exibidos no app vêm do RevenueCat, localizados; nenhum preço está fixo no código.

</details>

## 🗺️ Roadmap

- [x] Conversor com validação de dígitos
- [x] Calculadora em qualquer base disponível
- [x] Prática diária com correção e explicação
- [x] Assinaturas PRO e PREMIUM com RevenueCat
- [x] Passo a passo por agrupamento de bits e por valor posicional
- [ ] Passo a passo de decimal para outras bases (divisões sucessivas) e entre bases não decimais
- [ ] Frações e complemento de dois (PRO)
- [ ] Bases arbitrárias de 2 a 36 na interface (PREMIUM)
- [ ] Publicação na Google Play Store

## 👤 Autor e licença

Feito por **Ítalo Marques Rodrigues Silva**.

Distribuído sob a licença [MIT](LICENSE).
