console.log("util injected");

async function getStorage(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, (result) => {
      resolve(result);
    });
  });
}

async function setStorage(vals) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(vals, () => resolve());
  });
}

async function loadSettings() {
  const blob = await getStorage(["settings"]) || {};
  const settings = blob.settings || {};
  console.log("Loaded cascades settings", settings);
  return settings;
}

async function saveSettings(settings) {
  await setStorage({settings});
}

