# ALGEXYZ

**Same value, different basis.**

ALGEXYZ é um app mobile para aprender e trabalhar com sistemas numéricos. Ele converte, calcula e treina números em binário, octal, decimal, duodecimal e hexadecimal, sempre mostrando que o valor é o mesmo e só a base muda.

- Web: [algexyz-b8931.web.app](https://algexyz-b8931.web.app/)
- Plataforma principal: Android (Capacitor)

## Funcionalidades

| Aba | O que faz |
|---|---|
| **Converter** | Converte números entre bases, valida os dígitos permitidos e explica passo a passo a conversão de binário para hexadecimal (agrupamento de bits). |
| **Calculator** | Soma, subtrai, multiplica e divide inteiros na base escolhida, com precisão arbitrária (`bigint`). Uso ilimitado. |
| **Practice** | Exercícios de conversão com resposta direta ou múltipla escolha, correção imediata e explicação. Tem limite diário de atividades conforme o plano. |
| **Paywall** | Compara os planos e permite assinar e restaurar compras pelo RevenueCat. |

### Planos

| | FREE | PRO | PREMIUM |
|---|---|---|---|
| Bases | 2, 10, 16 | + 8 e 12 | 2 a 36 |
| Prática por dia | 5 | 20 | Ilimitada |
| Calculadora e conversor | ✓ | ✓ | ✓ |

As bases bloqueadas continuam visíveis, com cadeado e o plano necessário; ao tocar nelas, o paywall abre. As regras dos planos ficam centralizadas em `src/app/core/subscription/capabilities.ts`.

## Stack

- [Angular 22](https://angular.dev) com componentes standalone, Signals e modo zoneless
- [Ionic 9](https://ionicframework.com)
- [Capacitor 8](https://capacitorjs.com) para Android
- [Firebase 12](https://firebase.google.com) para Hosting e Auth
- [RevenueCat](https://www.revenuecat.com) (`@revenuecat/purchases-capacitor`) para assinaturas
- [Vitest](https://vitest.dev) para testes

## Arquitetura

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

Princípios:

- **Domínio isolado:** toda a matemática roda localmente e é testada sem framework. O app funciona offline.
- **Assinaturas desacopladas:** as telas consultam apenas `SubscriptionCapabilities`. A dependência segue esta ordem: telas → capacidades → `SubscriptionService` → `SubscriptionGateway` → adaptador RevenueCat → SDK. Só `revenuecat-subscription.gateway.ts` importa o SDK.
- **Estado único de assinatura:** o plano vem sempre do `CustomerInfo` do RevenueCat e nunca é concedido manualmente.

## Como rodar

### Pré-requisitos

- Node.js 20 ou superior
- Ionic CLI (`npm install -g @ionic/cli`)
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

Sem a chave do RevenueCat, o app funciona normalmente no plano FREE.

### Navegador

```bash
ionic serve
```

As assinaturas só funcionam no app Android. No navegador, o paywall informa isso e o app fica no plano FREE.

### Android

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

### Testes

```bash
npm test
```

## Configuração do RevenueCat

No dashboard do RevenueCat:

1. Crie os entitlements `pro` e `premium`.
2. Crie os produtos `algexyz_pro_monthly` e `algexyz_premium_monthly` e associe cada um ao entitlement correspondente.
3. Crie a offering `default`, marque como **Current** e adicione os pacotes `pro_monthly` e `premium_monthly`.

Os preços exibidos no app vêm do RevenueCat, localizados; nenhum preço está fixo no código.

## Roadmap

- Explicações passo a passo para outros pares de bases
- Frações e complemento de dois (PRO)
- Bases arbitrárias de 2 a 36 na interface (PREMIUM)
- Publicação na Google Play Store

## Autor

Ítalo Marques Rodrigues Silva

## Licença

[MIT](LICENSE)
