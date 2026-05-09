async function getEventId() {
  const url = 'https://cal.com/api/trpc/public/event.get?input=' + encodeURIComponent(JSON.stringify({ json: { username: "ariel-altamirano-j3amfh", eventSlug: "test-calendar" } }));
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Event Type ID:", data?.result?.data?.json?.id);
  } catch (e) {
    console.error(e);
  }
}
getEventId();
