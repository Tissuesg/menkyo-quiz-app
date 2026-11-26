/**
 * DriveGenius v1.0.0 - Googleドライブ自動クラウド同期用バックエンド (Google Apps Script)
 *
 * 【セットアップ手順】
 * 1. https://script.google.com/ で「新しいプロジェクト」を作成
 * 2. このコード全体を貼り付けて、下の SECRET_TOKEN をお好きな合言葉に書き換える
 * 3. 右上の「デプロイ」＞「新しいデプロイ」＞ 種類「ウェブアプリ」を選択
 *    - 次のユーザーとして実行：「自分」
 *    - アクセスできるユーザー：「全員」
 * 4. 発行された「ウェブアプリ URL」と「合言葉」を DriveGenius の設定画面に入力！
 */
const SECRET_TOKEN = 'CHANGE_THIS_TO_YOUR_SECRET'; // ← お好きな合言葉に変更してください
const FOLDER_NAME = 'DriveGenius_Sync';
const FILE_NAME = 'drivegenius_cloud_sync.json';

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, app: 'DriveGenius Cloud Sync', message: '正常に稼働しています。' })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const rawBody = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const req = JSON.parse(rawBody);

    if (!req.token || req.token !== SECRET_TOKEN) {
      return jsonResponse({ ok: false, error: 'INVALID_TOKEN', message: '合言葉（シークレットトークン）が一致しません。' });
    }

    const action = req.action || 'load';

    if (action === 'ping') {
      const existing = readSyncFile();
      return jsonResponse({
        ok: true,
        hasData: Boolean(existing),
        updatedAt: existing ? existing.updatedAt : null
      });
    }

    if (action === 'load') {
      const existing = readSyncFile();
      return jsonResponse({
        ok: true,
        hasData: Boolean(existing),
        data: existing || null
      });
    }

    if (action === 'save') {
      if (!req.payload || typeof req.payload !== 'object') {
        return jsonResponse({ ok: false, error: 'INVALID_PAYLOAD', message: '保存データが不正です。' });
      }
      const savedAt = req.payload.updatedAt || new Date().toISOString();
      req.payload.updatedAt = savedAt;
      writeSyncFile(req.payload);
      return jsonResponse({ ok: true, updatedAt: savedAt });
    }

    return jsonResponse({ ok: false, error: 'UNKNOWN_ACTION', message: '不明なアクションです。' });
  } catch (err) {
    return jsonResponse({ ok: false, error: 'SERVER_ERROR', message: String(err) });
  }
}

function getOrCreateSyncFolder() {
  const folders = DriveApp.getFoldersByName(FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(FOLDER_NAME);
}

function readSyncFile() {
  const folder = getOrCreateSyncFolder();
  const files = folder.getFilesByName(FILE_NAME);
  if (!files.hasNext()) return null;
  const content = files.next().getBlob().getDataAsString('UTF-8');
  return content ? JSON.parse(content) : null;
}

function writeSyncFile(dataObj) {
  const folder = getOrCreateSyncFolder();
  const jsonText = JSON.stringify(dataObj, null, 2);
  const files = folder.getFilesByName(FILE_NAME);
  if (files.hasNext()) {
    files.next().setContent(jsonText);
  } else {
    folder.createFile(FILE_NAME, jsonText, MimeType.PLAIN_TEXT);
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
