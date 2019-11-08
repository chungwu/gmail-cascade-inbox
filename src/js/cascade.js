
$(async () => {
  try {
    await waitUntil(gmailReady, 1000, 10);
    console.log("Gmail ready!  Cascades extension starting", window.document.title);
  } catch (err) {
    console.log("Failed to wait for Gmail to initialize within 10 seconds");
  }
  initialize();
});

function gmailReady() {
  return $("div[role=main]:first").length > 0;
}

async function initialize() {
  const settings = await loadSettings();
  const validInstances = (settings.cascadesInstances || []).filter(inst => inst.address);

  if (validInstances.length === 0) {
    console.log("Cascades extension still needs to be setup; nevermind");
    return;
  }

  const usableInstances = validInstances.filter(inst => !inst.address || window.document.title.indexOf(inst.address) >= 0);
  if (usableInstances.length === 0) {
    // Email is set and is not the current gmail account; forget it
    console.log("Cascades extension expecting gmail in title " + window.document.title + " but not found; nevermind!");
    return;
  }

  console.log("Running Cascades plugin!");

  window.cascades = {
    settings: usableInstances[0],
    observers: []
  };
  
  console.log("Cascades: settings", window.cascades);

  $(window).bind("hashchange", () => setTimeout(checkPage, 100));
  checkPage();
}

function checkPage() {
  if (isShowingThreadList()) {
    handleThreads();
  } else {
    disconnectObservers();
  }
}

function isShowingThreadList() {
  return $("div[role='main'] table.F.cf.zt").length > 0;  
}

function handleThreads() {
  for (const section of window.cascades.settings.sections) {
    const $section = $(`span.qh:contains(${section.name})`).closest("div[role='tabpanel']");
    if ($section.length > 0) {
      const observer = monitorSection(section, $section);
      window.cascades.observers.push(observer);
      console.log("Handling", section.name);
    }
  }
  console.log("Checking threads!");
}

function disconnectObservers() {
  console.log("Disconnecting observers");
  for (const observer of window.cascades.observers) {
    observer.disconnect();
  }
  window.cascades.observers.splice(0, window.cascades.observers.length);
}

function monitorSection(section, $section) {
  const observer = new MutationObserver(() => {
    console.log("COntent changed!");
    trimSection(section, $section);
  });
  observer.observe($section[0], {childList: true, subtree: true, attributes: true, attributeFilter: ["class"]});
  return observer;
}


function trimSection(section, $section) {
  console.log("Trimming", section);
  $("tr.zA", $section).show();
  $("li.bqX.brq.pW", $section).closest("tr.zA").hide();
  const $rows = $("tr.zA:visible", $section);
  console.log(`Found ${$rows.length} rows, need to trim to ${section.limit}`);
  if ($rows.length > section.limit) {
    $($rows.slice(section.limit)).hide();
  }
}

async function waitUntil(condition, delay, maxAttempts) {
  return new Promise((resolve, reject) => {
    let attempt = 0;
    let timer = setInterval(
      () => {
        attempt += 1;
        if (condition()) {
          clearInterval(timer);
          resolve();
        } else if (attempt >= maxAttempts) {
          clearInterval(timer);
          reject();
        }
      }, delay);
  });
}
