# バージョン管理システム ドキュメント

Better ChatGPT のバージョン自動化システムの使用方法とドキュメントです。

## 📋 概要

このシステムにより以下が自動化されます：
- **自動バージョンアップ**: コミット時にマイナーバージョンが自動的に上がります
- **手動バージョン制御**: 必要に応じてパッチ・メジャーバージョンも変更可能
- **一元管理**: すべてのバージョン情報がpackage.jsonから管理されます
- **変更履歴**: CHANGELOG.mdが自動生成されます

## 🚀 使用方法

### 1. 自動バージョンアップ（推奨）

mainブランチにコミットすると自動でバージョンアップが実行されます：

```bash
# 通常のコミット（patch: 1.21.0 → 1.21.1）
git commit -m "fix: ボタンのスタイル修正"

# 新機能追加（minor: 1.21.0 → 1.22.0）
git commit -m "feat: ダークモード機能を追加"

# 破壊的変更（major: 1.21.0 → 2.0.0）
git commit -m "BREAKING: APIの仕様を大幅変更"
git commit -m "feat!: 認証システムを完全刷新"
```

### 2. 手動バージョンアップ

#### NPMスクリプト使用
```bash
npm run version:patch   # 1.21.0 → 1.21.1
npm run version:minor   # 1.21.0 → 1.22.0  
npm run version:major   # 1.21.0 → 2.0.0
npm run version:check   # 現在のバージョン確認
```

#### カスタムCLIツール使用
```bash
# 基本的な使用方法
node scripts/bump-version.js minor          # マイナーアップ
node scripts/bump-version.js major          # メジャーアップ
node scripts/bump-version.js patch          # パッチアップ

# ドライラン（実際には変更しない）
node scripts/bump-version.js major --dry-run

# ヘルプ表示
node scripts/bump-version.js --help
```

#### GitHub Actions 手動実行
1. GitHubリポジトリの「Actions」タブを開く
2. 「Auto Version Bump」ワークフローを選択
3. 「Run workflow」をクリック
4. バージョンタイプ（patch/minor/major）を選択
5. 「Run workflow」を実行

### 3. バージョン確認方法

```bash
# 現在のバージョン確認
npm run version:check

# 詳細情報確認  
node scripts/bump-version.js --help

# package.jsonから直接確認
node -p "require('./package.json').version"
```

## 📁 ファイル構成

```
プロジェクト/
├── .github/workflows/
│   └── version-bump.yml          # GitHub Actions ワークフロー
├── scripts/
│   ├── version-manager.js        # バージョン管理コアライブラリ
│   └── bump-version.js          # 手動バージョンアップCLI
├── package.json                 # メインのバージョン定義
├── CHANGELOG.md                 # 変更履歴（自動生成）
└── docs/
    └── VERSION_MANAGEMENT.md    # このドキュメント
```

## ⚙️ 設定とカスタマイズ

### コミットメッセージルールのカスタマイズ

`.github/workflows/version-bump.yml` の以下の部分を編集：

```yaml
# 現在の設定
if [[ $COMMIT_MSG =~ ^BREAKING|^feat!|^fix! ]]; then
  echo "version_type=major"     # メジャー: 2.0.0
elif [[ $COMMIT_MSG =~ ^feat ]]; then
  echo "version_type=minor"     # マイナー: 1.22.0  
else
  echo "version_type=patch"     # パッチ: 1.21.1
fi
```

### バージョン表示コンポーネント

`src/components/Footer/VersionInfo.tsx` がpackage.jsonから自動的にバージョンを読み込みます：

```typescript
import { version } from '../../../package.json';

const VersionInfo = () => {
  return (
    <div className="fixed bottom-2 right-2 text-xs text-gray-400 dark:text-gray-600 print:hidden">
      Version: {version}
    </div>
  );
};
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

1. **「未コミットの変更があります」エラー**
   ```bash
   git add .
   git commit -m "一時コミット"
   ```

2. **Git設定エラー**
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

3. **GitHub Actions が動かない**
   - mainブランチにプッシュしているか確認
   - コミットメッセージに「🔖 バージョンアップ」が含まれていないか確認

4. **package-lock.json エラー**
   ```bash
   npm install --package-lock-only
   ```

### 緊急時の手動復旧

```bash
# 特定のバージョンに手動設定
npm version 1.21.0 --no-git-tag-version

# または package.json を直接編集
# "version": "1.21.0"

# コミットとタグ作成
git add package.json package-lock.json
git commit -m "🔖 バージョンを1.21.0に修正"
git tag "v1.21.0"
```

## 📊 バージョニング規則

このプロジェクトは[セマンティックバージョニング](https://semver.org/)に従います：

- **MAJOR** (`X.0.0`): 破壊的変更・後方互換性なし
- **MINOR** (`1.X.0`): 新機能追加・後方互換性あり  
- **PATCH** (`1.21.X`): バグ修正・後方互換性あり

### コミットメッセージの推奨形式

```bash
# パッチ（デフォルト）
fix: バグを修正
docs: ドキュメント更新
style: コードスタイル修正
refactor: リファクタリング

# マイナー
feat: 新機能を追加

# メジャー  
BREAKING: 破壊的変更
feat!: 破壊的な新機能
fix!: 破壊的なバグ修正
```

## 🎯 ベストプラクティス

1. **通常の開発**: 自動バージョンアップに任せる
2. **リリース前**: 手動でメジャーバージョンを調整
3. **ホットフィックス**: パッチバージョンで対応
4. **機能追加**: マイナーバージョンで対応
5. **大規模変更**: メジャーバージョンで対応

## 📝 更新履歴

- 2025-08-14: バージョン自動化システムの初期導入
- 現在のバージョン: 1.21.0