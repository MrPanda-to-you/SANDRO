(async function () {
  // Wait for DOM and UnicornStudio to be available
  function ready() {
    return new Promise(resolve => {
      if (document.readyState === "complete" || document.readyState === "interactive") {
        resolve();
      } else {
        document.addEventListener("DOMContentLoaded", resolve);
      }
    });
  }

  await ready();

  // Wait for UnicornStudio global
  function unicornReady() {
    return new Promise(resolve => {
      if (window.UnicornStudio) return resolve();
      const check = setInterval(() => {
        if (window.UnicornStudio) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    });
  }

  await unicornReady();

  // Fetch the scene JSON
  const response = await fetch('sandro-clinic-glass.json');
  if (!response.ok) {
    document.body.innerHTML = '<b>Failed to load scene JSON.</b>';
    throw new Error('Failed to load sandro-clinic-glass.json');
  }
  const scene = await response.json();

  // Render the scene
  window.UnicornStudio.render({
    container: document.getElementById('unicorn-root'),
    scene
  });
})();
