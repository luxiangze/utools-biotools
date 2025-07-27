// uTools 插件 preload.js
// 此文件可以调用 Node.js API 和 Electron 渲染进程 API

const { clipboard } = require('electron');

// 插件进入时的回调
window.utools.onPluginEnter(({ code, type, payload }) => {
  console.log('插件进入:', { code, type, payload });
  
  // 只处理主界面
  if (code === 'biotools') {
    // 主界面，不需要特殊处理
    console.log('打开 Biotools 主界面');
  }
});

// 插件退出时的回调
window.utools.onPluginOut(() => {
  console.log('插件退出');
});

// 增强的剪贴板功能 - 提供给主界面使用
window.enhancedClipboard = {
  // 写入剪贴板
  writeText: (text) => {
    try {
      clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('写入剪贴板失败:', error);
      return false;
    }
  },

  // 读取剪贴板
  readText: () => {
    try {
      return clipboard.readText();
    } catch (error) {
      console.error('读取剪贴板失败:', error);
      return '';
    }
  }
};

// 系统通知功能 - 提供给主界面使用
window.showNotification = (title, body, options = {}) => {
  try {
    window.utools.showNotification({
      title,
      body,
      ...options
    });
  } catch (error) {
    console.error('显示通知失败:', error);
  }
};
