import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

class VersionManager {
  constructor() {
    const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
    this.packagePath = path.join(__dirname, '../package.json');
    this.package = require(this.packagePath);
  }

  getCurrentVersion() {
    return this.package.version;
  }

  updateVersion(type = 'minor') {
    const [major, minor, patch] = this.package.version.split('.').map(Number);
    
    let newVersion;
    switch (type) {
      case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
      case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case 'patch':
      default:
        newVersion = `${major}.${minor}.${patch + 1}`;
    }

    this.package.version = newVersion;
    fs.writeFileSync(this.packagePath, JSON.stringify(this.package, null, 2) + '\n');
    
    return newVersion;
  }

  generateChangeLog(version, type = 'minor') {
    const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
    const changelogPath = path.join(__dirname, '../CHANGELOG.md');
    const date = new Date().toISOString().split('T')[0];
    
    let changeTypeText;
    switch (type) {
      case 'major':
        changeTypeText = '破壊的変更・メジャーアップデート';
        break;
      case 'minor':
        changeTypeText = '新機能・機能追加';
        break;
      case 'patch':
      default:
        changeTypeText = 'バグ修正・改善';
    }
    
    const entry = `\n## [${version}] - ${date}\n### ${changeTypeText}\n- 自動バージョンアップ (${type})\n`;
    
    if (fs.existsSync(changelogPath)) {
      const content = fs.readFileSync(changelogPath, 'utf8');
      const lines = content.split('\n');
      const insertIndex = lines.findIndex(line => line.startsWith('## [')) || 2;
      lines.splice(insertIndex, 0, ...entry.trim().split('\n'));
      fs.writeFileSync(changelogPath, lines.join('\n'));
    } else {
      const initialContent = `# CHANGELOG\n\nAll notable changes to this project will be documented in this file.\n${entry}`;
      fs.writeFileSync(changelogPath, initialContent);
    }
  }

  validateVersionType(type) {
    const validTypes = ['patch', 'minor', 'major'];
    return validTypes.includes(type);
  }

  getNextVersion(type = 'minor') {
    const [major, minor, patch] = this.package.version.split('.').map(Number);
    
    switch (type) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
      default:
        return `${major}.${minor}.${patch + 1}`;
    }
  }

  displayVersionInfo() {
    const current = this.getCurrentVersion();
    console.log(`📦 現在のバージョン: ${current}`);
    console.log(`🔼 次のバージョン候補:`);
    console.log(`   patch: ${this.getNextVersion('patch')} (バグ修正・改善)`);
    console.log(`   minor: ${this.getNextVersion('minor')} (新機能・機能追加)`);
    console.log(`   major: ${this.getNextVersion('major')} (破壊的変更・メジャーアップデート)`);
  }
}

export default VersionManager;