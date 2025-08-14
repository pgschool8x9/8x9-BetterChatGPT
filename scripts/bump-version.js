#!/usr/bin/env node
import VersionManager from './version-manager.js';
import { execSync } from 'child_process';
import process from 'process';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

class VersionBumper {
  constructor() {
    this.vm = new VersionManager();
  }

  showHelp() {
    console.log(`
🚀 Better ChatGPT バージョン管理ツール

使用方法:
  node scripts/bump-version.js [type] [options]

バージョンタイプ:
  patch   パッチバージョンアップ (例: 1.21.0 → 1.21.1) - バグ修正・改善
  minor   マイナーバージョンアップ (例: 1.21.0 → 1.22.0) - 新機能・機能追加  
  major   メジャーバージョンアップ (例: 1.21.0 → 2.0.0) - 破壊的変更

オプション:
  --dry-run, -d    実際には変更せず、予定される変更内容のみ表示
  --help, -h       このヘルプを表示

例:
  node scripts/bump-version.js minor          # マイナーバージョンアップ
  node scripts/bump-version.js major --dry-run # メジャーバージョンアップの確認
  node scripts/bump-version.js               # デフォルト（minor）

NPMスクリプト:
  npm run version:patch    # パッチバージョンアップ
  npm run version:minor    # マイナーバージョンアップ
  npm run version:major    # メジャーバージョンアップ
  npm run version:check    # 現在のバージョン確認
`);
  }

  async executeGitCommand(command) {
    try {
      const result = execSync(command, { stdio: 'pipe', encoding: 'utf8' });
      return result.trim();
    } catch (error) {
      throw new Error(`Git コマンドエラー: ${error.message}`);
    }
  }

  async checkGitStatus() {
    try {
      const status = await this.executeGitCommand('git status --porcelain');
      if (status) {
        console.log('⚠️  警告: 未コミットの変更があります:');
        console.log(status);
        console.log('');
        
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        return new Promise((resolve) => {
          readline.question('続行しますか？ (y/N): ', (answer) => {
            readline.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
          });
        });
      }
      return true;
    } catch (error) {
      console.log('⚠️  Git の状態確認でエラーが発生しました:', error.message);
      return false;
    }
  }

  async run() {
    const args = process.argv.slice(2);
    
    // ヘルプ表示
    if (args.includes('--help') || args.includes('-h')) {
      this.showHelp();
      return;
    }

    // 引数解析
    const versionType = args.find(arg => !arg.startsWith('-')) || 'minor';
    const isDryRun = args.includes('--dry-run') || args.includes('-d');

    // バージョンタイプの検証
    if (!this.vm.validateVersionType(versionType)) {
      console.error('❌ 無効なバージョン種別です。patch, minor, major のいずれかを指定してください。');
      this.showHelp();
      process.exit(1);
    }

    try {
      // 現在の状況表示
      console.log('📊 現在のバージョン情報:');
      this.vm.displayVersionInfo();
      console.log('');

      const oldVersion = this.vm.getCurrentVersion();
      const newVersion = this.vm.getNextVersion(versionType);

      if (isDryRun) {
        console.log('🔍 ドライラン実行 (実際の変更は行いません):');
        console.log(`   バージョンタイプ: ${versionType}`);
        console.log(`   変更内容: ${oldVersion} → ${newVersion}`);
        console.log('');
        console.log('📋 実行予定の操作:');
        console.log('   1. package.json のバージョン更新');
        console.log('   2. CHANGELOG.md の更新');
        console.log('   3. Git コミット作成');
        console.log('   4. Git タグ作成');
        console.log('');
        console.log('✅ ドライラン完了。実際に実行するには --dry-run オプションを外してください。');
        return;
      }

      // Gitの状態確認
      const canContinue = await this.checkGitStatus();
      if (!canContinue) {
        console.log('❌ 処理が中止されました。');
        process.exit(1);
      }

      console.log(`🚀 ${versionType} バージョンアップを開始します...`);
      console.log(`   ${oldVersion} → ${newVersion}`);
      console.log('');

      // Git設定
      try {
        await this.executeGitCommand('git config user.name');
        await this.executeGitCommand('git config user.email');
      } catch {
        console.log('⚙️  Git ユーザー設定中...');
        await this.executeGitCommand('git config --local user.name "Version Bumper"');
        await this.executeGitCommand('git config --local user.email "version@localhost"');
      }

      // バージョン更新
      console.log('📝 package.json を更新中...');
      this.vm.updateVersion(versionType);

      // チェンジログ生成
      console.log('📋 CHANGELOG.md を更新中...');
      this.vm.generateChangeLog(newVersion, versionType);

      // package-lock.json の更新（存在する場合）
      try {
        console.log('🔒 package-lock.json を更新中...');
        execSync('npm install --package-lock-only', { stdio: 'pipe' });
      } catch (error) {
        console.log('⚠️  package-lock.json の更新でエラーが発生しましたが、続行します。');
      }

      // Git 操作
      console.log('📦 Git コミットを作成中...');
      await this.executeGitCommand('git add package.json package-lock.json CHANGELOG.md');
      await this.executeGitCommand(`git commit -m "🔖 バージョンアップ: v${newVersion}"`);

      console.log('🏷️  Git タグを作成中...');
      await this.executeGitCommand(`git tag "v${newVersion}"`);

      console.log('');
      console.log('✅ バージョンアップが完了しました！');
      console.log(`   ${oldVersion} → ${newVersion}`);
      console.log('');
      console.log('📤 リモートリポジトリにプッシュするには:');
      console.log('   git push origin main --tags');
      console.log('');
      console.log('🎉 お疲れさまでした！');

    } catch (error) {
      console.error('❌ エラーが発生しました:', error.message);
      console.error('');
      console.error('🔧 トラブルシューティング:');
      console.error('   - Git リポジトリ内で実行していることを確認してください');
      console.error('   - package.json ファイルが存在することを確認してください');
      console.error('   - Git の設定が正しく行われていることを確認してください');
      process.exit(1);
    }
  }
}

// スクリプトが直接実行された場合（無条件実行）
const bumper = new VersionBumper();
bumper.run().catch(console.error);

export default VersionBumper;