if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./service-worker.js', {updateViaCache:'none'});
      await reg.update();
    } catch (err) {
      console.error('Service Worker:', err);
    }
  });
}
